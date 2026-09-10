import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = (await request.json()) as {
    name?: string;
    status?: "ACTIVE" | "INACTIVE";
    region?: string;
    address?: string | null;
    colonia?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  void id;
  void body;
  // Mock-only: no hay persistencia remota.
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  void id;
  // Mock-only: no hay persistencia remota.
  return NextResponse.json({ ok: true });
}
