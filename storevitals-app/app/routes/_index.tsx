import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useCallback, useEffect, useState } from "react";

type Issue = {
  id: number;
  severity: string;
  type: string;
  page_url: string;
  description: string;
  fix_recommendation: string;
};
type ScanData = { scan: { status: string; pages_scanned: number; completed_at?: string | null } | null; issues: Issue[]; issueCount: number };

export const loader = async (_args: LoaderFunctionArgs) => {
  // This custom app is dedicated to the owner's public store and intentionally
  // does not require a Shopify OAuth session to render the dashboard.
  return json({ shop: "squintproof.com" });
};

const initial: ScanData = { scan: null, issues: [], issueCount: 0 };

export default function Index() {
  const { shop } = useLoaderData<typeof loader>();
  const [data, setData] = useState<ScanData>(initial);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/scan/latest");
    if (response.ok) setData(await response.json());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (data.scan?.status === "running") {
      const timer = window.setInterval(refresh, 2500);
      return () => window.clearInterval(timer);
    }
  }, [data.scan?.status, refresh]);

  async function startScan() {
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/scan", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to start scan");
      setMessage(result.message || "Scan started");
      await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to start scan"); }
    finally { setLoading(false); }
  }

  const critical = data.issues.filter((issue) => issue.severity === "critical").length;
  const warnings = data.issues.filter((issue) => issue.severity === "warning").length;
  const running = data.scan?.status === "running";

  return (
    <main style={{ minHeight: "100vh", background: "#f6f6f7", color: "#202223", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #e1e3e5", padding: "22px max(24px, calc((100% - 1100px) / 2))" }}>
        <div style={{ maxWidth: 1100, margin: "auto" }}><strong style={{ fontSize: 22 }}>StoreVitals</strong><span style={{ color: "#6d7175", marginLeft: 14 }}>Store health monitor</span></div>
      </header>
      <section style={{ maxWidth: 1100, margin: "auto", padding: "42px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 20, flexWrap: "wrap" }}>
          <div><h1 style={{ margin: 0, fontSize: 32 }}>Store health dashboard</h1><p style={{ color: "#6d7175", marginTop: 8 }}>Monitoring {shop}</p></div>
          <button onClick={startScan} disabled={loading || running} style={{ background: running || loading ? "#8c9196" : "#008060", color: "white", border: 0, borderRadius: 6, padding: "12px 20px", fontWeight: 650, cursor: running || loading ? "wait" : "pointer" }}>{running ? "Scan in progress…" : loading ? "Starting…" : "Scan Store"}</button>
        </div>
        {message && <p role="status" style={{ background: "#fff", border: "1px solid #e1e3e5", borderRadius: 6, padding: 12 }}>{message}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, margin: "30px 0" }}>
          {[['Issues found', data.issueCount, '#202223'], ['Critical', critical, '#d72c0d'], ['Warnings', warnings, '#b98900'], ['Pages scanned', data.scan?.pages_scanned || 0, '#202223']].map(([label, value, color]) => <div key={label as string} style={{ background: "#fff", border: "1px solid #e1e3e5", borderRadius: 8, padding: 20 }}><div style={{ color: "#6d7175", fontSize: 14 }}>{label}</div><strong style={{ display: "block", fontSize: 30, marginTop: 8, color: color as string }}>{value}</strong></div>)}
        </div>
        <div style={{ background: "#fff", border: "1px solid #e1e3e5", borderRadius: 8, padding: 24 }}><h2 style={{ marginTop: 0 }}>Issues</h2>{data.issues.length === 0 ? <p style={{ color: "#6d7175" }}>{running ? "Scanning your store… results will appear here." : "Run a scan to find broken links, SEO gaps, and performance issues."}</p> : <div>{data.issues.map((issue) => <article key={issue.id} style={{ borderTop: "1px solid #e1e3e5", padding: "16px 0" }}><strong style={{ color: issue.severity === "critical" ? "#d72c0d" : "#b98900", textTransform: "capitalize" }}>{issue.severity} · {issue.type}</strong><div style={{ margin: "6px 0" }}>{issue.description}</div><small style={{ color: "#6d7175" }}>{issue.page_url} — Fix: {issue.fix_recommendation}</small></article>)}</div>}</div>
      </section>
    </main>
  );
}
