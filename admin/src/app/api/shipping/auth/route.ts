import { NextResponse } from "next/server";
import { generateNimbusToken } from "@/lib/nimbuspost";

/**
 * POST /api/shipping/auth
 * Forces a fresh NimbusPost token generation and returns status.
 * Admin-only: credentials stay server-side.
 */
export async function POST() {
  try {
    await generateNimbusToken();
    return NextResponse.json({ success: true, message: "NimbusPost token generated successfully." });
  } catch (error: any) {
    console.error("NIMBUSPOST_AUTH_ERROR", error);
    return NextResponse.json({ error: error.message ?? "Failed to generate NimbusPost token" }, { status: 500 });
  }
}
