import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { code, redirectUri } = await request.json();

    const clientId = "com.5F62DDJA3X.sempre.web";
    const clientSecret = process.env.APPLE_CLIENT_SECRET;

    if (!clientSecret) {
      console.error("[api/auth/apple] APPLE_CLIENT_SECRET not configured");
      return NextResponse.json({ error: "Apple client secret not configured" }, { status: 500 });
    }

    const params = new URLSearchParams({
      client_id: clientId,
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
