import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    id: string;
    branchId: string;
    name: string;
    meetingDay: string;
    meetingPlace: string;
    status: "ACTIVE" | "INACTIVE";
  };
  if (!body?.id || !body?.branchId || !body?.name || !body?.meetingDay || !body?.meetingPlace) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }
  // Mock-only: no hay persistencia remota.
  return NextResponse.json({ ok: true }, { status: 201 });
}
