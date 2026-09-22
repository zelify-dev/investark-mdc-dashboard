import { NextRequest, NextResponse } from "next/server";
import { getAmlUpstreamBaseUrl } from "@/modules/pld-aml/services/pld-aml-api-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ path?: string[] }> };

function upstreamUrl(request: NextRequest, path: string[] | undefined): string {
  const base = getAmlUpstreamBaseUrl();
  const pathname = `/${(path ?? []).join("/")}`.replace(/\/+/g, "/");
  return `${base}${pathname === "/" ? "/" : pathname}${request.nextUrl.search}`;
}

function forwardRequestHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  ["x-org-id", "x-user-id", "content-type", "accept"].forEach((key) => {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  });
  return headers;
}

function forwardResponseHeaders(upstream: Response): Headers {
  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  const disposition = upstream.headers.get("content-disposition");
  if (contentType) headers.set("content-type", contentType);
  if (disposition) headers.set("content-disposition", disposition);
  return headers;
}

async function proxy(request: NextRequest, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const target = upstreamUrl(request, path);
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers: forwardRequestHeaders(request),
      body: body && body.byteLength > 0 ? body : undefined,
      cache: "no-store",
      redirect: "manual",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo contactar el API PLD/AML.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const responseBody = await upstream.text();
  if (!upstream.ok) {
    console.error(`[pld-aml proxy] ${method} ${target} → ${upstream.status}`, responseBody.slice(0, 800));
  }

  return new NextResponse(responseBody, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: forwardResponseHeaders(upstream),
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
