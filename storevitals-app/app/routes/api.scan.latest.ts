import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getLatestScan, getIssuesForScan } from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const scan = await getLatestScan("squintproof.com");

  if (!scan) {
    return json({ scan: null, issues: [], issueCount: 0 });
  }

  const issues = await getIssuesForScan(scan.id);

  return json({
    scan: {
      id: scan.id,
      status: scan.status,
      pages_scanned: scan.pages_scanned,
      started_at: scan.started_at,
      completed_at: scan.completed_at,
    },
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
    issueCount: issues.length,
  });
};
