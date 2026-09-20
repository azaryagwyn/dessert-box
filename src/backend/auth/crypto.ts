const JWT_SECRET = "sweetlayers-dessert-box-secret-key-2026";

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = "sl_salt_2026";
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return arrayBufferToHex(hashBuffer);
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === storedHash;
}

export async function createAuthToken(payload: {
  userId: string;
  email: string;
  name: string;
  role: "admin" | "customer";
}): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const fullPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    iat: Math.floor(Date.now() / 1000),
  };

  const encHeader = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const encPayload = btoa(JSON.stringify(fullPayload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const dataToSign = `${encHeader}.${encPayload}`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(dataToSign));
  const encSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${dataToSign}.${encSignature}`;
}

export async function verifyAuthToken(token: string): Promise<{
  userId: string;
  email: string;
  name: string;
  role: "admin" | "customer";
} | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encHeader, encPayload, encSignature] = parts;
    const dataToSign = `${encHeader}.${encPayload}`;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Convert signature from base64url to Uint8Array
    const base64Sig = encSignature.replace(/-/g, "+").replace(/_/g, "/");
    const paddedSig = base64Sig.padEnd(base64Sig.length + ((4 - (base64Sig.length % 4)) % 4), "=");
    const rawSig = Uint8Array.from(atob(paddedSig), (c) => c.charCodeAt(0));

    const isValid = await crypto.subtle.verify("HMAC", key, rawSig, enc.encode(dataToSign));
    if (!isValid) return null;

    // Decode payload
    const base64Payload = encPayload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = base64Payload.padEnd(base64Payload.length + ((4 - (base64Payload.length % 4)) % 4), "=");
    const parsedPayload = JSON.parse(atob(paddedPayload));

    // Check expiration
    if (parsedPayload.exp && parsedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      userId: parsedPayload.userId,
      email: parsedPayload.email,
      name: parsedPayload.name,
      role: parsedPayload.role,
    };
  } catch (err) {
    return null;
  }
}

export function extractBearerToken(authHeader?: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.substring(7).trim();
}
