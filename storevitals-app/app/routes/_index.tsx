import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import shopify from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await shopify.authenticate.admin(request);
  return json({ shop: session.shop });
};

export default function Index() {
  const { shop } = useLoaderData<typeof loader>();

  return (
    <div style={{ padding: 20, fontFamily: "system-ui" }}>
      <h1>StoreVitals</h1>
      <p>Store: {shop}</p>
      <button
        onClick={() =>
          fetch("/api/scan", { method: "POST" })
            .then((response) => response.json())
            .then(alert)
        }
      >
        Scan Store
      </button>
    </div>
  );
}
