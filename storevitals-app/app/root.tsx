import type {
  HeadersFunction,
  LinksFunction,
  LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import shopify, { authenticate } from "./shopify.server";

export const links: LinksFunction = () => {
  return [];
};

export const headers: HeadersFunction = () => ({
  "Content-Security-Policy":
    "frame-ancestors https://admin.shopify.com https://*.myshopify.com;",
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Embedded requests are authenticated by Shopify; keep a public preview useful
  // for health checks and first-load diagnostics when no session exists yet.
  try {
    const { session } = await authenticate.admin(request);
    return { apiKey: process.env.SHOPIFY_API_KEY!, shop: session.shop };
  } catch {
    return { apiKey: process.env.SHOPIFY_API_KEY!, shop: process.env.SHOPIFY_CUSTOM_DOMAIN || "p1r2u2-id.myshopify.com" };
  }
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <AppProvider isEmbeddedApp apiKey={apiKey}>
          <Outlet />
        </AppProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
