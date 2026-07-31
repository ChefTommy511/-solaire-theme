import * as cheerio from "cheerio";
import {
  createScan,
  completeScan,
  failScan,
  insertIssues,
  type InsertIssue,
} from "./db.server";

const MAX_PAGES = 200;
const FETCH_TIMEOUT_MS = 15_000;
const REQUEST_DELAY_MS = 300;

export async function runScan(scanId: number, shopDomain: string): Promise<void> {
  const baseUrl = ensureHttps(shopDomain);
  const visited = new Set<string>();
  const toVisit: string[] = [baseUrl];
  const allIssues: InsertIssue[] = [];
  let pagesScanned = 0;

  try {
    while (toVisit.length > 0 && pagesScanned < MAX_PAGES) {
      const url = toVisit.shift()!;
      const normalized = normalizeUrl(url);

      if (visited.has(normalized)) continue;
      visited.add(normalized);

      const pageResult = await fetchAndParse(normalized);
      if (!pageResult) continue;

      pagesScanned++;

      const pageIssues = checkPageSEO(normalized, pageResult.$);
      allIssues.push(...pageIssues);

      const imageIssues = await checkPageImages(normalized, pageResult.$, baseUrl);
      allIssues.push(...imageIssues);

      const internalLinks = extractInternalLinks(baseUrl, pageResult.$);
      for (const link of internalLinks) {
        const norm = normalizeUrl(link);
        if (!visited.has(norm) && !toVisit.includes(norm)) {
          toVisit.push(norm);
        }
      }

      const brokenIssues = await checkBrokenLinks(scanId, normalized, internalLinks, visited);
      allIssues.push(...brokenIssues);

      if (toVisit.length > 0) {
        await sleep(REQUEST_DELAY_MS);
      }
    }

    if (allIssues.length > 0) {
      const scanIssues = allIssues.map((i) => ({ ...i, scan_id: scanId }));
      insertIssues(scanIssues);
    }

    completeScan(scanId, pagesScanned);
  } catch (err) {
    console.error(`Scan ${scanId} failed:`, err);
    try { failScan(scanId, pagesScanned); } catch { /* best effort */ }
  }
}

function ensureHttps(domain: string): string {
  let d = domain.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(d)) d = "https://" + d;
  return d;
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    u.search = "";
    return u.origin + (u.pathname.replace(/\/+$/, "") || "/");
  } catch {
    return url;
  }
}

async function fetchAndParse(url: string): Promise<{ $: cheerio.CheerioAPI } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "StoreVitals-Scanner/1.0 (+https://storevitals.com/bot)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok || !res.headers.get("content-type")?.includes("text/html")) return null;
    const html = await res.text();
    return { $: cheerio.load(html) };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function extractInternalLinks(baseUrl: string, $: cheerio.CheerioAPI): string[] {
  const links: string[] = [];
  const baseOrigin = new URL(baseUrl).origin;

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const resolved = new URL(href, baseUrl);
      if (resolved.origin !== baseOrigin) return;
      if (!resolved.protocol.startsWith("http")) return;
      if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      const path = resolved.pathname.toLowerCase();
      if (/\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|json|xml|pdf|zip|woff2?|ttf|eot)$/.test(path)) return;
      if (path.startsWith("/admin") || path.startsWith("/cart") || path.startsWith("/checkout") || path.startsWith("/account")) return;
      links.push(resolved.href);
    } catch { /* invalid URL */ }
  });
  return links;
}

function checkPageSEO(pageUrl: string, $: cheerio.CheerioAPI): InsertIssue[] {
  const issues: InsertIssue[] = [];

  const titleText = $("title").text().trim();
  if (!titleText) {
    issues.push({
      scan_id: 0, severity: "warning", type: "missing_title", page_url: pageUrl,
      description: "Page is missing a <title> tag",
      fix_recommendation: 'Add a descriptive <title> tag (50-60 characters). Example: "Product Name — Store Name"',
    });
  }

  const metaDesc = $('meta[name="description"]').attr("content");
  if (!metaDesc || metaDesc.trim().length === 0) {
    issues.push({
      scan_id: 0, severity: "warning", type: "missing_meta_description", page_url: pageUrl,
      description: "Page is missing a meta description",
      fix_recommendation: 'Add a <meta name="description"> tag (120-160 characters) summarizing the page. This appears in search results.',
    });
  }

  $("img").each((_, el) => {
    const alt = $(el).attr("alt");
    const src = $(el).attr("src") || "(unknown)";
    if (alt === undefined || alt === null) {
      issues.push({
        scan_id: 0, severity: "warning", type: "missing_alt_text", page_url: pageUrl,
        description: "Image missing alt attribute",
        fix_recommendation: `Add an alt attribute describing the image. Example: alt="${extractAltSuggestion(src)}"`,
        element_detail: src,
      });
    }
  });

  return issues;
}

function extractAltSuggestion(src: string): string {
  try {
    const filename = src.split("/").pop()?.split("?")[0] || "";
    return filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") || "product image";
  } catch { return "product image"; }
}

async function checkBrokenLinks(
  scanId: number, sourceUrl: string, links: string[], alreadyChecked: Set<string>
): Promise<InsertIssue[]> {
  const issues: InsertIssue[] = [];
  const uniqueLinks = [...new Set(links)]
    .filter((l) => !alreadyChecked.has(normalizeUrl(l)))
    .slice(0, 20);

  for (const link of uniqueLinks) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(link, {
        method: "HEAD", signal: controller.signal,
        headers: { "User-Agent": "StoreVitals-Scanner/1.0" },
        redirect: "follow",
      });
      if (res.status === 404) {
        issues.push({
          scan_id: scanId, severity: "critical", type: "broken_link", page_url: link, source_url: sourceUrl,
          description: `Broken link: "${link}" returns 404`,
          fix_recommendation: `Update or remove the link on "${sourceUrl}". If the page moved, set up a 301 redirect.`,
        });
      } else if (res.status >= 500) {
        issues.push({
          scan_id: scanId, severity: "critical", type: "broken_link", page_url: link, source_url: sourceUrl,
          description: `Broken link: "${link}" returns server error ${res.status}`,
          fix_recommendation: `The linked page returns a ${res.status} error. Check if the target is down or the URL is correct.`,
        });
      }
    } catch { /* network error, skip */ }
    finally { clearTimeout(timer); }
    await sleep(100);
  }
  return issues;
}

async function checkPageImages(
  pageUrl: string,
  $: cheerio.CheerioAPI,
  baseUrl: string,
): Promise<InsertIssue[]> {
  const issues: InsertIssue[] = [];
  const baseOrigin = new URL(baseUrl).origin;

  const imgElements = $("img").toArray();
  for (const el of imgElements) {
    const src = ($(el).attr("src") || "").trim();
    if (!src) continue;

    let resolvedSrc: string;
    try {
      resolvedSrc = new URL(src, baseUrl).href;
    } catch {
      continue;
    }

    // Only check local images (same domain as the shop)
    const urlObj = new URL(resolvedSrc);
    if (urlObj.origin !== baseOrigin) continue;

    // ── 1. Missing width/height attributes (layout shift) ──
    const width = $(el).attr("width");
    const height = $(el).attr("height");
    if (!width || !height) {
      issues.push({
        scan_id: 0,
        severity: "warning",
        type: "image_dimensions",
        page_url: pageUrl,
        description: `Image missing width and/or height attributes: ${src}`,
        fix_recommendation:
          "Add width and height attributes to prevent layout shift (CLS). Use the image's intrinsic dimensions.",
        element_detail: src,
      });
    }

    // ── 2. Wrong format: PNG used where WebP/JPEG would be better ──
    const srcLower = src.toLowerCase();
    const hasPngExt =
      srcLower.endsWith(".png") || srcLower.includes(".png?");
    if (hasPngExt) {
      issues.push({
        scan_id: 0,
        severity: "warning",
        type: "image_format",
        page_url: pageUrl,
        description: `PNG image found — consider converting to WebP or JPEG: ${src}`,
        fix_recommendation:
          "Convert PNG to WebP for better compression (smaller files, same quality). Use JPEG if it's a photograph.",
        element_detail: src,
      });
    }

    // ── 3. Image size check via HEAD request ──
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(resolvedSrc, {
          method: "HEAD",
          signal: controller.signal,
          headers: { "User-Agent": "StoreVitals-Scanner/1.0" },
          redirect: "follow",
        });
        const contentLength = res.headers.get("content-length");
        if (contentLength) {
          const sizeBytes = parseInt(contentLength, 10);
          const sizeKB = Math.round(sizeBytes / 1024);

          if (sizeBytes > 500 * 1024) {
            // >500KB — oversized
            issues.push({
              scan_id: 0,
              severity: "warning",
              type: "image_size",
              page_url: pageUrl,
              description: `Oversized image (${sizeKB}KB): ${src}`,
              fix_recommendation: `Compress this image to under 300KB to improve page speed. Current size: ${sizeKB}KB. Use TinyPNG, ImageOptim, or Squoosh.`,
              element_detail: src,
            });
          } else if (sizeBytes > 300 * 1024) {
            // >300KB — compression opportunity
            issues.push({
              scan_id: 0,
              severity: "warning",
              type: "image_size",
              page_url: pageUrl,
              description: `Image could be compressed (${sizeKB}KB): ${src}`,
              fix_recommendation: `Compress this image to under 300KB to improve page speed. Current size: ${sizeKB}KB.`,
              element_detail: src,
            });
          }
        }
      } finally {
        clearTimeout(timer);
      }
    } catch {
      // HEAD request failed, skip size check for this image
    }

    // Small delay between HEAD requests to avoid hammering the server
    await sleep(50);
  }

  return issues;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
