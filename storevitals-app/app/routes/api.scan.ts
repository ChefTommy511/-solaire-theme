import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import shopify from "../shopify.server";
import { createScan, getLatestScan } from "../db.server";
import { runScan } from "../scanner.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await shopify.authenticate.admin(request);

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  // Check if a scan is already running
  const latest = await getLatestScan(session.shop);
  if (latest && latest.status === "running") {
    return json({
      scan: {
        id: latest.id,
        status: "running",
        pages_scanned: latest.pages_scanned,
        started_at: latest.started_at,
      },
      message: "A scan is already in progress",
    });
  }

  // Create a new scan record
  const scan = await createScan(session.shop);

  // Fire-and-forget the scanner (don't await — it runs in background)
  // This custom app is currently dedicated to the owner's public store.
  runScan(scan.id, "https://www.squintproof.com").catch((err) => {
    console.error(`Background scan ${scan.id} failed:`, err);
  });

  return json({
    scan: {
      id: scan.id,
      status: "running",
      pages_scanned: 0,
      started_at: new Date().toISOString(),
    },
    message: "Scan started successfully",
  });
};
