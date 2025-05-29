import { NextResponse } from "next/server";
import { AuthClientTwoLegged } from "forge-apis";

const client_id = process.env.NEXT_PUBLIC_FORGE_CLIENT_ID!;
const client_secret = process.env.NEXT_PUBLIC_FORGE_CLIENT_SECRET!;
const SCOPES = [
  "data:read",
  "data:write",
  "data:create",
  "bucket:create",
  "bucket:read",
];

export async function GET() {
  try {
    const authClient = new AuthClientTwoLegged(
      client_id,
      client_secret,
      SCOPES
    );
    const token = await authClient.authenticate();

    return NextResponse.json({
      access_token: token.access_token,
      expires_in: token.expires_in,
    });
  } catch (error: any) {
    console.error("GET /api/auth/twolegged error:", error);
    return NextResponse.json(
      { error: error.message || "Token error" },
      { status: 500 }
    );
  }
}
