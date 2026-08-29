import { headers } from "next/headers";

/**
 * Dynamically resolves the application's base URL.
 * 
 * Priority:
 * 1. Current request `host` / `x-forwarded-host` from incoming headers (auto-detects production Vercel/VPS domain or localhost)
 * 2. `NEXT_PUBLIC_APP_URL` environment variable
 * 3. `VERCEL_URL` environment variable
 * 4. Fallback `http://localhost:3000`
 */
export async function getAppBaseUrl(): Promise<string> {
  try {
    const headerList = await headers();
    const host = headerList.get("x-forwarded-host") || headerList.get("host");
    const proto = headerList.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");

    if (host) {
      return `${proto}://${host}`.replace(/\/+$/, "");
    }
  } catch {
    // If called outside request context (e.g. CLI scripts)
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}
