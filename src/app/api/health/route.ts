import { NextResponse } from "next/server";

/** Health check para ALB / ECS (TG tulana). */
export async function GET() {
  return NextResponse.json(
    { ok: true, service: "zelify-core", ts: new Date().toISOString() },
    { status: 200 },
  );
}
