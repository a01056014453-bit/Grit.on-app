import { NextResponse } from "next/server";
import crypto from "crypto";

const TEAM_ID = "5F62DDJA3X";
const KEY_ID = "96H644W2K9";
const CLIENT_ID = "com.5F62DDJA3X.sempre.web";

function generateClientSecret(privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: "ES256", kid: KEY_ID };
  const payload = {
    iss: TEAM_ID,
    iat: now,
    exp: now + 86400 * 180,
    aud: "https://appleid.apple.com",
    sub: CLIENT_ID,
  };

  function base64url(data: string | Buffer): string {
    const buf = typeof data === "string" ? Buffer.from(data) : data;
    return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  }

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const sign = crypto.createSign("SHA256");
  sign.update(signingInput);
  const sig = sign.sign(privateKey, "base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  return `${signingInput}.${sig}`;
}

export async function POST(request: Request) {
  try {
    const { code, redirectUri } = await request.json();

    // .p8 키에서 JWT 동적 생성 (base64로 저장된 키 지원)
    const keyBase64 = process.env.APPLE_PRIVATE_KEY_BASE64;
    let privateKey = process.env.APPLE_PRIVATE_KEY;

    if (keyBase64) {
      privateKey = Buffer.from(keyBase64, "base64").toString("utf-8");
    } else if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, "\n");
    } else {
      console.error("[api/auth/apple] No Apple private key configured");
      return NextResponse.json({ error: "Apple private key not configured" }, { status: 500 });
    }

    const clientSecret = generateClientSecret(privateKey);

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });

    const res = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await res.json();

    if (data.error) {
      console.error("[api/auth/apple] Token exchange error:", data.error, data.error_description);
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json({
      id_token: data.id_token,
      access_token: data.access_token,
    });
  } catch (err) {
    console.error("[api/auth/apple] Unexpected error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
