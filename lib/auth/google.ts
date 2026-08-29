/**
 * Google OAuth 2.0 PKCE / Authorization Code Flow Engine
 */

export interface GoogleUserProfile {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export function getGoogleOAuthClientConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl.replace(/\/+$/, "")}/api/auth/google/callback`;

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

/**
 * Generate Google OAuth Consent URL
 */
export function getGoogleAuthUrl(state: string): string {
  const { clientId, redirectUri } = getGoogleOAuthClientConfig();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    state,
    prompt: "select_account",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange Authorization Code for Access and ID Tokens
 */
export async function exchangeGoogleCode(code: string): Promise<{ access_token: string; id_token: string } | null> {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthClientConfig();

  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Google token exchange failed:", errorText);
    return null;
  }

  return res.json();
}

/**
 * Fetch User Profile from Google UserInfo endpoint
 */
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserProfile | null> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    console.error("Google userInfo fetch failed:", await res.text());
    return null;
  }

  return res.json();
}
