import { NextResponse } from "next/server";

import { Group } from "@/modules/groups/types/group.types";
import { getLoanMockState } from "@/app/api/loans/_mock-store";

export async function GET() {
  return NextResponse.json({ data: getLoanMockState().groups });
}

export async function POST(request: Request) {
  const group = (await request.json()) as Group;
  if (!group?.id || !group?.name) {
    return NextResponse.json({ error: "Payload inválido para empresa" }, { status: 400 });
  }

  // Mock-only: echo group without remote persistence
  return NextResponse.json({ data: group }, { status: 201 });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
