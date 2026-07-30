import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import shopify from "../shopify.server";
import { getLatestScan, getIssuesForScan } from "../db.server";

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

  const scan = getLatestScan(session.shop);
  const issues = scan ? getIssuesForScan(scan.id) : [];

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

export default function Dashboard() {
  const { shop, scan, issues } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [currentScan, setCurrentScan] = useState(scan);
  const [currentIssues, setCurrentIssues] = useState(issues);

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

  const criticalCount = currentIssues.filter(
    (i: any) => i.severity === "critical"
  ).length;
  const warningCount = currentIssues.filter(
    (i: any) => i.severity === "warning"
  ).length;

  const issueTypes = [
    ...new Set(currentIssues.map((i: any) => i.type)),
  ] as string[];

  return (
    <div style={{ padding: "1.5rem", fontFamily: "system-ui, sans-serif", maxWidth: "1000px" }}>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
          StoreVitals
        </h1>
        <p style={{ color: "#666", marginTop: "0.25rem", fontSize: "0.875rem" }}>
          Store health dashboard for {shop.name}
        </p>
      </header>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        <StatCard
          title="Issues Found"
          value={currentIssues.length}
          color={currentIssues.length > 0 ? "#ef4444" : "#22c55e"}
        />
        <StatCard title="Critical" value={criticalCount} color="#ef4444" />
        <StatCard title="Warnings" value={warningCount} color="#f59e0b" />
        <StatCard
          title="Pages Scanned"
          value={currentScan?.pages_scanned ?? 0}
          color="#3b82f6"
        />
        <StatCard
          title="Last Scan"
          value={
            currentScan
              ? formatRelativeTime(currentScan.started_at)
              : "Never"
          }
          color="#6b7280"
        />
      </div>

      {/* Scan button + status */}
      <div style={{ marginBottom: "1.5rem" }}>
        <button
          onClick={triggerScan}
          disabled={isScanning}
          style={{
            background: isScanning ? "#9ca3af" : "#1a1a2e",
            color: "#fff",
            border: "none",
            padding: "0.625rem 1.25rem",
            borderRadius: "6px",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: isScanning ? "not-allowed" : "pointer",
          }}
        >
          {isScanning ? "Scanning..." : "Scan Store"}
        </button>
        {currentScan?.status === "running" && (
          <span
            style={{
              marginLeft: "0.75rem",
              fontSize: "0.8rem",
              color: "#6b7280",
            }}
          >
            Crawling pages… {currentScan.pages_scanned} scanned so far
          </span>
        )}
        {currentScan?.status === "complete" && (
          <span
            style={{
              marginLeft: "0.75rem",
              fontSize: "0.8rem",
              color: "#22c55e",
            }}
          >
            ✓ Scan complete — {currentScan.pages_scanned} pages scanned
          </span>
        )}
        {currentScan?.status === "failed" && (
          <span
            style={{
              marginLeft: "0.75rem",
              fontSize: "0.8rem",
              color: "#ef4444",
            }}
          >
            ✗ Scan failed — try again
          </span>
        )}
      </div>

      {/* Issues list */}
      {currentIssues.length > 0 ? (
        <div>
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              marginBottom: "0.75rem",
            }}
          >
            Issues ({currentIssues.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {currentIssues.map((issue: any) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </div>
      ) : currentScan && currentScan.status === "complete" ? (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#166534", fontWeight: 600, margin: 0 }}>
            🎉 No issues found! Your store looks healthy.
          </p>
        </div>
      ) : !currentScan ? (
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
            No scan data yet
          </h2>
          <p style={{ color: "#666", margin: 0, fontSize: "0.875rem" }}>
            Run your first store scan to check for broken links, SEO gaps, and
            other issues.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "0.875rem",
      }}
    >
      <p style={{ color: "#666", fontSize: "0.7rem", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {title}
      </p>
      <p
        style={{
          color,
          fontSize: "1.5rem",
          fontWeight: 700,
          margin: "0.15rem 0 0",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function IssueCard({ issue }: { issue: any }) {
  const severityColor =
    issue.severity === "critical" ? "#ef4444" : "#f59e0b";
  const severityBg =
    issue.severity === "critical" ? "#fef2f2" : "#fffbeb";
  const typeLabel = formatIssueType(issue.type);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderLeft: `4px solid ${severityColor}`,
        borderRadius: "6px",
        padding: "0.875rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.375rem",
        }}
      >
        <span
          style={{
            background: severityBg,
            color: severityColor,
            fontSize: "0.7rem",
            fontWeight: 700,
            padding: "0.15rem 0.5rem",
            borderRadius: "999px",
            textTransform: "uppercase",
          }}
        >
          {issue.severity}
        </span>
        <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>
          {typeLabel}
        </span>
      </div>
      <p style={{ fontSize: "0.8rem", color: "#374151", margin: "0 0 0.25rem" }}>
        {issue.description}
      </p>
      <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>
        📍 <code style={{ background: "#f3f4f6", padding: "0.1rem 0.3rem", borderRadius: "3px" }}>{issue.page_url}</code>
      </p>
      <p
        style={{
          fontSize: "0.75rem",
          color: "#1d4ed8",
          margin: "0.375rem 0 0",
          background: "#eff6ff",
          padding: "0.375rem 0.5rem",
          borderRadius: "4px",
        }}
      >
        💡 {issue.fix_recommendation}
      </p>
    </div>
  );
}

function formatIssueType(type: string): string {
  const labels: Record<string, string> = {
    broken_link: "Broken Link",
    missing_title: "Missing Title Tag",
    missing_meta_description: "Missing Meta Description",
    missing_alt_text: "Missing Image Alt Text",
  };
  return labels[type] || type.replace(/_/g, " ");
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
