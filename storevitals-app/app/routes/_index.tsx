import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useMemo, useRef, useState } from "react";
import shopify from "../shopify.server";
import { getLatestScan, getIssuesForScan } from "../db.server";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Issue {
  id: number;
  severity: "critical" | "warning" | "info";
  type: string;
  page_url: string;
  source_url: string | null;
  description: string;
  fix_recommendation: string;
  element_detail: string | null;
}

interface ScanData {
  id: number;
  status: string;
  pages_scanned: number;
  started_at: string;
  completed_at: string | null;
}

type CategoryFilter =
  | "All"
  | "Links"
  | "SEO"
  | "Images"
  | "Performance"
  | "SEO Infrastructure";

// ─── Shared style constants (Polaris-inspired design tokens) ─────────────────

const COLORS = {
  critical: "#D82C0D",    // Polaris critical red
  criticalBg: "#FEF3F2",  // Polaris critical surface
  warning: "#B98900",     // Polaris warning amber
  warningBg: "#FFF5EA",   // Polaris warning surface
  info: "#005BD3",        // Polaris info blue
  infoBg: "#F1F7FF",      // Polaris info surface
  success: "#007F5F",     // Polaris success green
  successBg: "#EFFBF5",   // Polaris success surface
  text: "#303030",        // Polaris text
  textSecondary: "#616161",
  textTertiary: "#8C9196",
  border: "#E1E3E5",      // Polaris border
  borderStrong: "#C9CCCF",
  surface: "#FFFFFF",
  surfaceBg: "#F6F6F7",   // Polaris background
  surfaceHover: "#F1F1F1",
  brand: "#1A1A2E",       // StoreVitals brand dark
  brandHover: "#2D2D4A",
};

const FONTS = {
  heading: "600 13px/140% -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  headingLg: "600 15px/140% -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  body: "400 13px/140% -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  bodySm: "400 12px/140% -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "400 12px/140% 'SF Mono', 'Monaco', 'Inconsolata', monospace",
  metric: "700 30px/120% -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

// ─── Loader ──────────────────────────────────────────────────────────────────

export const headers: HeadersFunction = () => ({
  "Content-Security-Policy":
    "frame-ancestors https://admin.shopify.com https://*.myshopify.com;",
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await shopify.authenticate.admin(request);

  const shopResponse = await admin.rest.resources.Shop.all({
    session,
    fields: ["name", "domain", "myshopify_domain"],
  });
  const shopData = shopResponse.data[0];

  const scan = getLatestScan(session.shop) as ScanData | null;
  const issues: Issue[] = scan ? getIssuesForScan(scan.id) : [];

  return json({
    shop: {
      name: shopData.name,
      domain: shopData.domain,
      myshopifyDomain: shopData.myshopify_domain,
    },
    scan: scan
      ? {
          id: scan.id,
          status: scan.status,
          pages_scanned: scan.pages_scanned,
          started_at: scan.started_at,
          completed_at: scan.completed_at,
        }
      : null,
    issues: issues.map((i) => ({
      id: i.id,
      severity: i.severity,
      type: i.type,
      page_url: i.page_url,
      source_url: i.source_url,
      description: i.description,
      fix_recommendation: i.fix_recommendation,
      element_detail: i.element_detail,
    })),
  });
};

// ─── Page Component ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const { shop, scan, issues } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [currentScan, setCurrentScan] = useState(scan);
  const [currentIssues, setCurrentIssues] = useState<Issue[]>(issues);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const isScanning =
    currentScan?.status === "running" || fetcher.state === "submitting";

  // Poll for scan updates when scanning
  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(() => {
      fetcher.load("/api/scan/latest");
    }, 2000);
    return () => clearInterval(interval);
  }, [isScanning]);

  // Update state when fetcher returns new data
  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      const data = fetcher.data as any;
      if (data.scan) {
        setCurrentScan(data.scan);
        setCurrentIssues(data.issues || []);
      }
    }
  }, [fetcher.data, fetcher.state]);

  function triggerScan() {
    fetcher.submit(null, { method: "POST", action: "/api/scan" });
  }

  // ── Derived counts ─────────────────────────────────────────────────────────

  const counts = useMemo(() => {
    const critical = currentIssues.filter((i) => i.severity === "critical").length;
    const warning = currentIssues.filter((i) => i.severity === "warning").length;
    const info = currentIssues.filter((i) => i.severity === "info").length;
    return { critical, warning, info, total: currentIssues.length };
  }, [currentIssues]);

  // ── Filter & search ────────────────────────────────────────────────────────

  const filteredIssues = useMemo(() => {
    let result = currentIssues;

    if (categoryFilter !== "All") {
      result = result.filter((i) => getIssueCategory(i.type) === categoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.description.toLowerCase().includes(q) ||
          i.page_url.toLowerCase().includes(q) ||
          i.fix_recommendation.toLowerCase().includes(q) ||
          formatIssueType(i.type).toLowerCase().includes(q)
      );
    }

    return result;
  }, [currentIssues, categoryFilter, searchQuery]);

  const isFiltered =
    categoryFilter !== "All" || searchQuery.trim().length > 0;

  // ── Status badge ───────────────────────────────────────────────────────────

  const statusBadge = useMemo(() => {
    if (!currentScan || currentScan.status === "running") {
      return { label: "No scan", color: COLORS.textTertiary, dot: COLORS.textTertiary };
    }
    if (currentScan.status === "complete") {
      return { label: "Healthy", color: COLORS.success, dot: COLORS.success };
    }
    if (currentScan.status === "failed") {
      return { label: "Error", color: COLORS.critical, dot: COLORS.critical };
    }
    return { label: "Unknown", color: COLORS.textTertiary, dot: COLORS.textTertiary };
  }, [currentScan]);

  const lastScanTime =
    currentScan && currentScan.started_at
      ? formatRelativeTime(currentScan.started_at)
      : null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={styles.root}>
      {/* ─── Header ─── */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoArea}>
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              style={{ flexShrink: 0 }}
            >
              <rect
                width="28"
                height="28"
                rx="6"
                fill={COLORS.brand}
              />
              <path
                d="M8 14h3l1.5-4 3 8 1.5-4H22"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div>
              <h1 style={styles.headerTitle}>StoreVitals</h1>
              <p style={styles.headerSubtitle}>{shop.name}</p>
            </div>
          </div>

          <div style={styles.headerMeta}>
            <div style={styles.statusBadgeRow}>
              <span
                style={{
                  ...styles.statusDot,
                  backgroundColor: statusBadge.dot,
                }}
              />
              <span
                style={{
                  ...styles.statusLabel,
                  color: statusBadge.color,
                }}
              >
                {statusBadge.label}
              </span>
            </div>
            {lastScanTime && (
              <span style={styles.lastScanText}>
                Last scan: {lastScanTime}
              </span>
            )}
            {currentScan?.status === "complete" && (
              <span style={styles.scanMetaText}>
                {currentScan.pages_scanned} pages scanned
              </span>
            )}
          </div>
        </div>

        <button
          onClick={triggerScan}
          disabled={isScanning}
          style={{
            ...styles.scanButton,
            ...(isScanning ? styles.scanButtonDisabled : {}),
          }}
        >
          {isScanning ? (
            <>
              <Spinner size={14} />
              <span>Scanning…</span>
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                style={{ flexShrink: 0 }}
              >
                <path
                  d="M13.5 8.5a5.5 5.5 0 1 1-1.6-3.9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M11.5 4.5v-3h3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Scan Now</span>
            </>
          )}
        </button>
      </header>

      {/* ─── Summary bar ─── */}
      <div style={styles.summaryBar}>
        <SummaryMetric
          label="Total Issues"
          value={counts.total}
          color={
            counts.total > 0 ? COLORS.text : COLORS.textTertiary
          }
        />
        <div style={styles.summaryDivider} />
        <SummaryMetric label="Critical" value={counts.critical} color={COLORS.critical} />
        <div style={styles.summaryDivider} />
        <SummaryMetric label="Warnings" value={counts.warning} color={COLORS.warning} />
        <div style={styles.summaryDivider} />
        <SummaryMetric label="Info" value={counts.info} color={COLORS.info} />
      </div>

      {/* ─── Filters & search ─── */}
      {currentIssues.length > 0 && (
        <div style={styles.filterBar}>
          <div style={styles.filterChips}>
            {FILTER_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  ...styles.filterChip,
                  ...(categoryFilter === cat ? styles.filterChipActive : {}),
                }}
              >
                {cat}
                {cat !== "All" && (
                  <span
                    style={{
                      ...styles.filterChipCount,
                      ...(categoryFilter === cat
                        ? styles.filterChipCountActive
                        : {}),
                    }}
                  >
                    {currentIssues.filter(
                      (i) => getIssueCategory(i.type) === cat
                    ).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={styles.filterActions}>
            <div style={styles.searchBox}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                style={styles.searchIcon}
              >
                <circle
                  cx="6"
                  cy="6"
                  r="4.5"
                  stroke={COLORS.textTertiary}
                  strokeWidth="1.5"
                />
                <path
                  d="M9.5 9.5L13 13"
                  stroke={COLORS.textTertiary}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <input
                type="text"
                placeholder="Search issues…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={styles.searchClear}
                  title="Clear search"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M3 3l6 6M9 3l-6 6"
                      stroke={COLORS.textTertiary}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </div>

            <ExportCSVButton issues={filteredIssues} />
          </div>

          {isFiltered && (
            <div style={styles.resultsCount}>
              {filteredIssues.length} result{filteredIssues.length !== 1 ? "s" : ""}
              {searchQuery && (
                <span>
                  {" "}for "{searchQuery}"
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Loading skeleton ─── */}
      <style>{`
        @keyframes shimmer {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      `}</style>
      {isScanning && currentIssues.length === 0 && (
        <div style={styles.skeletonContainer}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={styles.skeletonCard}>
              <div style={styles.skeletonLine1} />
              <div style={styles.skeletonLine2} />
              <div style={styles.skeletonLine3} />
              <div style={styles.skeletonLine4} />
            </div>
          ))}
        </div>
      )}

      {/* ─── Issue list ─── */}
      {!isScanning && filteredIssues.length > 0 && (
        <div style={styles.issueList}>
          {filteredIssues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} />
          ))}
        </div>
      )}

      {/* ─── Empty states ─── */}
      {!isScanning &&
        currentScan &&
        currentScan.status === "complete" &&
        currentIssues.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
              >
                <circle cx="24" cy="24" r="22" stroke={COLORS.success} strokeWidth="2" />
                <path
                  d="M14 24l6 6 14-14"
                  stroke={COLORS.success}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 style={styles.emptyTitle}>All clear!</h2>
            <p style={styles.emptyText}>
              No issues found. Your store looks healthy — keep it up!
            </p>
          </div>
        )}

      {!isScanning &&
        currentScan &&
        currentScan.status === "complete" &&
        currentIssues.length > 0 &&
        filteredIssues.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
              >
                <circle cx="24" cy="24" r="22" stroke={COLORS.borderStrong} strokeWidth="2" />
                <path
                  d="M24 14v12M24 30v2"
                  stroke={COLORS.textTertiary}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2 style={styles.emptyTitle}>No matches</h2>
            <p style={styles.emptyText}>
              No issues match your current filters. Try adjusting your search or
              category filter.
            </p>
            <button
              onClick={() => {
                setCategoryFilter("All");
                setSearchQuery("");
              }}
              style={styles.resetButton}
            >
              Clear filters
            </button>
          </div>
        )}

      {!isScanning && !currentScan && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
            >
              <rect
                x="8"
                y="10"
                width="32"
                height="28"
                rx="3"
                stroke={COLORS.borderStrong}
                strokeWidth="2"
              />
              <path
                d="M18 22h12M18 28h8"
                stroke={COLORS.textTertiary}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h2 style={styles.emptyTitle}>No scan data yet</h2>
          <p style={styles.emptyText}>
            Run your first store scan to check for broken links, SEO gaps, and
            other issues. It only takes a minute.
          </p>
          <button
            onClick={triggerScan}
            style={styles.scanNowEmptyButton}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{ flexShrink: 0 }}
            >
              <path
                d="M13.5 8.5a5.5 5.5 0 1 1-1.6-3.9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M11.5 4.5v-3h3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Scan My Store</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SummaryMetric({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div style={styles.summaryMetric}>
      <span style={{ ...styles.summaryValue, color }}>{value}</span>
      <span style={styles.summaryLabel}>{label}</span>
    </div>
  );
}

function IssueRow({ issue }: { issue: Issue }) {
  const [copied, setCopied] = useState(false);
  const copyTimeout = useRef<ReturnType<typeof setTimeout>>();

  const severityColor =
    issue.severity === "critical"
      ? COLORS.critical
      : issue.severity === "warning"
        ? COLORS.warning
        : COLORS.info;

  const severityBg =
    issue.severity === "critical"
      ? COLORS.criticalBg
      : issue.severity === "warning"
        ? COLORS.warningBg
        : COLORS.infoBg;

  const severityIcon =
    issue.severity === "critical" ? (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M7 1L13 12H1L7 1Z"
          stroke={COLORS.critical}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M7 5v3M7 10.5v.5" stroke={COLORS.critical} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ) : issue.severity === "warning" ? (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1" y="1" width="12" height="12" rx="6" stroke={COLORS.warning} strokeWidth="1.5" />
        <path d="M7 4v3M7 9.5v.5" stroke={COLORS.warning} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ) : (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="6" stroke={COLORS.info} strokeWidth="1.5" />
        <path d="M7 6v4M7 4.5v.5" stroke={COLORS.info} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );

  const typeLabel = formatIssueType(issue.type);
  const truncatedUrl = truncateUrl(issue.page_url, 50);

  function handleCopyFix() {
    navigator.clipboard.writeText(issue.fix_recommendation);
    setCopied(true);
    if (copyTimeout.current) clearTimeout(copyTimeout.current);
    copyTimeout.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      style={{
        ...styles.issueRow,
        borderLeftColor: severityColor,
      }}
    >
      <div style={styles.issueMain}>
        {/* Severity & category */}
        <div style={styles.issueHeader}>
          <div style={styles.issueBadges}>
            <span
              style={{
                ...styles.severityBadge,
                backgroundColor: severityBg,
                color: severityColor,
              }}
            >
              {severityIcon}
              <span>{issue.severity}</span>
            </span>
            <span style={styles.categoryBadge}>{typeLabel}</span>
          </div>

          <button
            onClick={handleCopyFix}
            style={{
              ...styles.copyFixButton,
              ...(copied ? styles.copyFixButtonDone : {}),
            }}
            title="Copy fix recommendation"
          >
            {copied ? (
              <>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path
                    d="M3 6.5L5.5 9l4.5-5"
                    stroke={COLORS.success}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <rect
                    x="3.5"
                    y="3.5"
                    width="8"
                    height="8"
                    rx="1.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M1.5 9.5V2A0.5 0.5 0 012 1.5h8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Copy fix
              </>
            )}
          </button>
        </div>

        {/* Description */}
        <p style={styles.issueDescription}>{issue.description}</p>

        {/* URL */}
        <div style={styles.issueUrl}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            style={{ flexShrink: 0, marginTop: 2 }}
          >
            <path
              d="M4.5 1.5h-2A1 1 0 001.5 2.5v7A1 1 0 002.5 10.5h7a1 1 0 001-1v-2"
              stroke={COLORS.textTertiary}
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M5.5 6.5l5-5M10.5 3V1L8.5 1.5"
              stroke={COLORS.textTertiary}
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <code style={styles.issueUrlText}>{truncatedUrl}</code>
        </div>

        {/* Fix recommendation */}
        <div style={styles.fixBox}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            style={{ flexShrink: 0, marginTop: 1 }}
          >
            <circle cx="6.5" cy="6.5" r="5.5" stroke={COLORS.info} strokeWidth="1.3" />
            <path d="M6.5 4.5v4M5 6.5h3" stroke={COLORS.info} strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <span style={styles.fixText}>{issue.fix_recommendation}</span>
        </div>
      </div>
    </div>
  );
}

function ExportCSVButton({ issues }: { issues: Issue[] }) {
  const [state, setState] = useState<"idle" | "done">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  function handleExport() {
    const header = [
      "Severity",
      "Category",
      "Page URL",
      "Description",
      "Fix Recommendation",
    ];
    const rows = issues.map((i) => [
      i.severity,
      formatIssueType(i.type),
      i.page_url,
      escapeCsvCell(i.description),
      escapeCsvCell(i.fix_recommendation),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `storevitals-issues-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setState("done");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button
      onClick={handleExport}
      disabled={issues.length === 0}
      style={{
        ...styles.exportButton,
        ...(state === "done" ? styles.exportButtonDone : {}),
        ...(issues.length === 0 ? styles.exportButtonDisabled : {}),
      }}
      title="Download issues as CSV"
    >
      {state === "done" ? (
        <>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M3 6.5L5.5 9l4.5-5"
              stroke={COLORS.success}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Exported
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M6.5 1v8M3.5 5l3 3 3-3M2 11.5h9"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Export CSV
        </>
      )}
    </button>
  );
}

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="31.4 31.4"
        strokeLinecap="round"
        opacity={0.3}
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="15.7 47.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FILTER_CATEGORIES: CategoryFilter[] = [
  "All",
  "Links",
  "SEO",
  "Images",
  "Performance",
  "SEO Infrastructure",
];

function formatIssueType(type: string): string {
  const labels: Record<string, string> = {
    broken_link: "Broken Link",
    missing_title: "Missing Title Tag",
    missing_meta_description: "Missing Meta Description",
    missing_alt_text: "Missing Image Alt Text",
    image_size: "Oversized / Unoptimized Image",
    image_dimensions: "Missing Image Dimensions",
    image_format: "Wrong Image Format",
    missing_sitemap: "Missing Sitemap",
    missing_robots: "Missing Robots.txt",
    robots_blocked: "Robots.txt Blocks Crawling",
    sitemap_not_linked: "Sitemap Not Linked",
    sitemap_empty: "Empty or Invalid Sitemap",
    page_size: "Page Too Large",
    page_slow: "Slow Page Load",
    resource_size: "Oversized Resource",
    resource_count: "Too Many Resources",
    missing_preload: "Missing Preload Hint",
  };
  return labels[type] || type.replace(/_/g, " ");
}

function getIssueCategory(type: string): string {
  if (
    ["missing_alt_text", "image_size", "image_dimensions", "image_format"].includes(
      type
    )
  )
    return "Images";
  if (["missing_title", "missing_meta_description"].includes(type)) return "SEO";
  if (
    [
      "missing_sitemap",
      "missing_robots",
      "robots_blocked",
      "sitemap_not_linked",
      "sitemap_empty",
    ].includes(type)
  )
    return "SEO Infrastructure";
  if (
    [
      "page_size",
      "page_slow",
      "resource_size",
      "resource_count",
      "missing_preload",
    ].includes(type)
  )
    return "Performance";
  if (["broken_link"].includes(type)) return "Links";
  return "Other";
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr + "Z");
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function truncateUrl(url: string, maxLen: number): string {
  if (url.length <= maxLen) return url;
  // Try to keep the domain + start and end of path
  try {
    const u = new URL(url);
    const base = u.origin;
    const path = u.pathname;
    const available = maxLen - base.length - 5; // 5 = "..."
    if (available < 10) return url.slice(0, maxLen - 3) + "...";
    if (path.length > available) {
      return base + path.slice(0, available - 3) + "..." + path.slice(-3);
    }
    return base + path;
  } catch {
    return url.slice(0, maxLen - 3) + "...";
  }
}

function escapeCsvCell(text: string): string {
  return text.replace(/"/g, '""');
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  // Root
  root: {
    font: FONTS.body,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceBg,
    minHeight: "100vh",
  },

  // ── Header ──
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    backgroundColor: COLORS.surface,
    borderBottom: `1px solid ${COLORS.border}`,
    gap: "16px",
    flexWrap: "wrap",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    minWidth: 0,
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
  },
  headerTitle: {
    font: FONTS.headingLg,
    fontSize: "16px",
    margin: 0,
    color: COLORS.text,
  },
  headerSubtitle: {
    font: FONTS.bodySm,
    color: COLORS.textSecondary,
    margin: "1px 0 0",
  },
  headerMeta: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  statusBadgeRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    display: "inline-block",
  },
  statusLabel: {
    font: FONTS.heading,
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  lastScanText: {
    font: FONTS.bodySm,
    color: COLORS.textTertiary,
  },
  scanMetaText: {
    font: FONTS.bodySm,
    color: COLORS.textSecondary,
  },

  scanButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    backgroundColor: COLORS.brand,
    color: "#FFFFFF",
    border: "none",
    borderRadius: "6px",
    padding: "9px 16px",
    font: FONTS.heading,
    fontSize: "13px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  scanButtonDisabled: {
    backgroundColor: COLORS.borderStrong,
    color: COLORS.textTertiary,
    cursor: "not-allowed",
  },

  // ── Summary bar ──
  summaryBar: {
    display: "flex",
    alignItems: "center",
    gap: "0px",
    backgroundColor: COLORS.surface,
    borderBottom: `1px solid ${COLORS.border}`,
    padding: "18px 20px",
    overflowX: "auto",
  },
  summaryMetric: {
    display: "flex",
    alignItems: "baseline",
    gap: "8px",
    padding: "0 18px",
    flexShrink: 0,
  },
  summaryValue: {
    font: FONTS.metric,
    fontWeight: 700,
    fontSize: "28px",
    letterSpacing: "-0.02em",
  },
  summaryLabel: {
    font: FONTS.bodySm,
    color: COLORS.textTertiary,
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
    flexShrink: 0,
  },

  // ── Filters ──
  filterBar: {
    backgroundColor: COLORS.surface,
    borderBottom: `1px solid ${COLORS.border}`,
    padding: "12px 20px",
  },
  filterChips: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    marginBottom: "10px",
  },
  filterChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "5px 11px",
    borderRadius: "6px",
    border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.surface,
    color: COLORS.textSecondary,
    font: FONTS.bodySm,
    fontSize: "12px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "background-color 0.15s",
  },
  filterChipActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
    color: "#FFFFFF",
  },
  filterChipCount: {
    backgroundColor: COLORS.surfaceBg,
    borderRadius: "3px",
    padding: "1px 5px",
    fontSize: "11px",
    fontWeight: 600,
    color: COLORS.textTertiary,
  },
  filterChipCountActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
    color: "#FFFFFF",
  },
  filterActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    backgroundColor: COLORS.surfaceBg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "6px",
    padding: "6px 10px",
    flex: "1 1 220px",
    maxWidth: "320px",
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    border: "none",
    background: "transparent",
    outline: "none",
    font: FONTS.body,
    fontSize: "13px",
    color: COLORS.text,
    width: "100%",
  },
  searchClear: {
    border: "none",
    background: "none",
    cursor: "pointer",
    padding: "2px",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
  exportButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "6px",
    border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.surface,
    color: COLORS.textSecondary,
    font: FONTS.bodySm,
    fontSize: "12px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
    transition: "background-color 0.15s",
  },
  exportButtonDone: {
    borderColor: COLORS.success,
    color: COLORS.success,
    backgroundColor: COLORS.successBg,
  },
  exportButtonDisabled: {
    opacity: 0.4,
    cursor: "default",
  },
  resultsCount: {
    font: FONTS.bodySm,
    color: COLORS.textTertiary,
    marginTop: "8px",
  },

  // ── Skeleton ──
  skeletonContainer: {
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  skeletonCard: {
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "8px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  skeletonLine1: {
    width: "30%",
    height: "14px",
    borderRadius: "4px",
    backgroundColor: COLORS.surfaceBg,
    animation: "shimmer 1.5s ease-in-out infinite",
  } as React.CSSProperties,
  skeletonLine2: {
    width: "75%",
    height: "12px",
    borderRadius: "4px",
    backgroundColor: COLORS.surfaceBg,
    animation: "shimmer 1.5s ease-in-out infinite",
    animationDelay: "0.1s",
  } as React.CSSProperties,
  skeletonLine3: {
    width: "45%",
    height: "10px",
    borderRadius: "3px",
    backgroundColor: COLORS.surfaceBg,
    animation: "shimmer 1.5s ease-in-out infinite",
    animationDelay: "0.2s",
  } as React.CSSProperties,
  skeletonLine4: {
    width: "60%",
    height: "10px",
    borderRadius: "3px",
    backgroundColor: COLORS.surfaceBg,
    animation: "shimmer 1.5s ease-in-out infinite",
    animationDelay: "0.3s",
  } as React.CSSProperties,

  // ── Issue list ──
  issueList: {
    padding: "0 20px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "0",
  },
  issueRow: {
    display: "flex",
    backgroundColor: COLORS.surface,
    borderTop: `1px solid ${COLORS.border}`,
    borderLeft: "4px solid transparent",
    borderRight: `1px solid ${COLORS.border}`,
    borderBottom: `1px solid ${COLORS.border}`,
    transition: "background-color 0.15s",
  },
  issueMain: {
    padding: "14px 16px 14px 12px",
    flex: 1,
    minWidth: 0,
  },
  issueHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "8px",
    flexWrap: "wrap",
  },
  issueBadges: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },
  severityBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  categoryBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: 600,
    backgroundColor: COLORS.surfaceBg,
    color: COLORS.textSecondary,
  },
  copyFixButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "3px 10px",
    borderRadius: "4px",
    border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.surface,
    color: COLORS.textSecondary,
    fontSize: "11px",
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
    transition: "background-color 0.15s, border-color 0.15s",
  },
  copyFixButtonDone: {
    borderColor: COLORS.success,
    color: COLORS.success,
    backgroundColor: COLORS.successBg,
  },
  issueDescription: {
    font: FONTS.body,
    color: COLORS.text,
    margin: "0 0 8px",
    fontSize: "13px",
  },
  issueUrl: {
    display: "flex",
    alignItems: "flex-start",
    gap: "5px",
    marginBottom: "8px",
  },
  issueUrlText: {
    font: FONTS.mono,
    fontSize: "11px",
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surfaceBg,
    padding: "2px 6px",
    borderRadius: "3px",
    wordBreak: "break-all",
  },
  fixBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "6px",
    backgroundColor: COLORS.infoBg,
    padding: "8px 10px",
    borderRadius: "5px",
  },
  fixText: {
    font: FONTS.body,
    fontSize: "12px",
    color: "#00357A",
    lineHeight: "1.5",
  },

  // ── Empty states ──
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 20px",
    textAlign: "center",
    backgroundColor: COLORS.surface,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  emptyIcon: {
    marginBottom: "16px",
  },
  emptyTitle: {
    font: FONTS.headingLg,
    fontSize: "16px",
    color: COLORS.text,
    margin: "0 0 6px",
  },
  emptyText: {
    font: FONTS.body,
    color: COLORS.textSecondary,
    margin: "0 0 16px",
    maxWidth: "400px",
  },
  scanNowEmptyButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    backgroundColor: COLORS.brand,
    color: "#FFFFFF",
    border: "none",
    borderRadius: "6px",
    padding: "10px 20px",
    font: FONTS.heading,
    fontSize: "14px",
    cursor: "pointer",
  },
  resetButton: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 14px",
    borderRadius: "6px",
    border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.surface,
    color: COLORS.textSecondary,
    font: FONTS.bodySm,
    fontSize: "12px",
    cursor: "pointer",
  },
};
