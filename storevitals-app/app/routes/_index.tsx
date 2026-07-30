import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import shopify from "../shopify.server";

export const headers: HeadersFunction = () => ({
  "Content-Security-Policy": "frame-ancestors https://admin.shopify.com https://*.myshopify.com;",
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await shopify.authenticate.admin(request);

  // Get shop info for the dashboard header
  const shopResponse = await admin.rest.resources.Shop.all({
    session,
    fields: ["name", "domain", "myshopify_domain"],
  });
  const shopData = shopResponse.data[0];

  return json({
    shop: {
      name: shopData.name,
      domain: shopData.domain,
      myshopifyDomain: shopData.myshopify_domain,
    },
    issueCount: 0, // Will be populated when scanner is built
  });
};

export default function Dashboard() {
  const { shop, issueCount } = useLoaderData<typeof loader>();

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
          StoreVitals
        </h1>
        <p style={{ color: "#666", marginTop: "0.25rem" }}>
          Store health dashboard for {shop.name}
        </p>
      </header>

      <div
        style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
          No issues detected yet
        </h2>
        <p style={{ color: "#666", marginBottom: "1rem" }}>
          Run your first store scan to check for broken links, SEO gaps, and
          performance problems.
        </p>
        <button
          style={{
            background: "#1a1a2e",
            color: "#fff",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "6px",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Scan Store
        </button>
      </div>

      <div
        style={{
          marginTop: "2rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        <StatCard title="Issues Found" value={issueCount} color="#ef4444" />
        <StatCard title="Pages Scanned" value={0} color="#3b82f6" />
        <StatCard title="Last Scan" value="Never" color="#6b7280" />
      </div>
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
        padding: "1rem",
      }}
    >
      <p style={{ color: "#666", fontSize: "0.75rem", margin: 0 }}>{title}</p>
      <p
        style={{
          color,
          fontSize: "1.5rem",
          fontWeight: 700,
          margin: "0.25rem 0 0",
        }}
      >
        {value}
      </p>
    </div>
  );
}
