import { shopifyApp } from "@shopify/shopify-app-remix/server";
import { SqlJsSessionStorage } from "./sqljs-session-storage.server";

// Use sql.js — pure WASM, no native compilation needed.
// Works on Windows, macOS, and Linux without Visual Studio or any build tools.
const shopifySessionStorage = new SqlJsSessionStorage("./prisma/dev.db");

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  appUrl: process.env.SHOPIFY_APP_URL!,
  scopes: ["read_products", "read_themes", "read_content"],
  sessionStorage: shopifySessionStorage,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
  },
});

export default shopify;
export const authenticate = shopify.authenticate;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
