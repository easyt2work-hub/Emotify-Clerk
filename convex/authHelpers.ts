import type { MutationCtx, QueryCtx } from "./_generated/server";
import bcrypt from "bcryptjs";

// Base64url utilities
export function base64urlEncode(strOrBuffer: string | ArrayBuffer): string {
  let binary = "";
  if (typeof strOrBuffer === "string") {
    const bytes = new TextEncoder().encode(strOrBuffer);
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
  } else {
    const bytes = new Uint8Array(strOrBuffer);
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
  }
  return btoa(binary)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

// Get the RSA key pair stored in the database
export async function getOrCreateKeyPair(ctx: MutationCtx | QueryCtx) {
  const existing = await ctx.db.query("authKeys").first();
  if (existing) {
    return {
      privateKeyJwk: JSON.parse(existing.privateKeyJwk),
      publicKeyJwk: JSON.parse(existing.publicKeyJwk),
    };
  }
  throw new Error("RSA Key Pair not initialized. Ensure ensureKeysInitialized action runs first.");
}

// Sign a JWT token using RS256 and stored private key
export async function signJwt(
  ctx: MutationCtx,
  payload: { sub: string; role: string; mobile_number: string; full_name: string }
): Promise<string> {
  const { privateKeyJwk } = await getOrCreateKeyPair(ctx);

  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: "key1",
  };

  const convexSiteUrl = (globalThis as any).process?.env?.CONVEX_SITE_URL || "https://usable-stork-789.convex.site";

  const enrichedPayload = {
    ...payload,
    iss: convexSiteUrl,
    aud: "convex",
    exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 mins expiry
    iat: Math.floor(Date.now() / 1000),
  };

  const headerEncoded = base64urlEncode(JSON.stringify(header));
  const payloadEncoded = base64urlEncode(JSON.stringify(enrichedPayload));
  const dataToSign = `${headerEncoded}.${payloadEncoded}`;

  const privateKey = await crypto.subtle.importKey(
    "jwk",
    privateKeyJwk,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: { name: "SHA-256" },
    },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(dataToSign)
  );

  const signatureEncoded = base64urlEncode(signatureBuffer);
  return `${dataToSign}.${signatureEncoded}`;
}

// Hash password with bcryptjs
export async function hashPassword(password: string): Promise<string> {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

// Verify password with bcryptjs
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compareSync(password, hash);
}
