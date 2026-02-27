import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { code, redirectUri } = await request.json();

    if (!code || !redirectUri) {
      return NextResponse.json({ error: "Missing code or redirectUri" }, { status: 400 });
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const data = await tokenResponse.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error_description || data.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id_token: data.id_token,
      access_token: data.access_token,
    });
  } catch (error) {
    console.error("Google token exchange error:", error);
    return NextResponse.json({ error: "Token exchange failed" }, { status: 500 });
  }
}
