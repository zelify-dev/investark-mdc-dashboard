import { NextRequest, NextResponse } from "next/server";
import { getWapiUpstreamBaseUrl } from "@/modules/crm/services/wapi-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ path?: string[] }> };

function upstreamUrl(request: NextRequest, path: string[] | undefined): string {
  const base = getWapiUpstreamBaseUrl();
  const pathname = `/api/${(path ?? []).join("/")}`.replace(/\/+/g, "/");
  return `${base}${pathname === "/api/" ? "/api/health" : pathname}${request.nextUrl.search}`;
}

function forwardRequestHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  ["content-type", "accept"].forEach((key) => {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  });
  return headers;
}

function isBinaryPath(path: string[] | undefined, contentType: string | null): boolean {
  const joined = (path ?? []).join("/");
  if (joined.includes("/download")) return true;
  if (!contentType) return false;
  return /^(image|audio|video|application\/pdf|application\/octet-stream)/i.test(contentType);
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
    const message = error instanceof Error ? error.message : "No se pudo contactar el sandbox WAPI.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type");
  const headers = new Headers();
  if (contentType) headers.set("content-type", contentType);
  const disposition = upstream.headers.get("content-disposition");
  if (disposition) headers.set("content-disposition", disposition);

  if (isBinaryPath(path, contentType)) {
    const buffer = await upstream.arrayBuffer();
    return new NextResponse(buffer, { status: upstream.status, headers });
  }

  const text = await upstream.text();
  if (!upstream.ok) {
    console.error(`[wapi proxy] ${method} ${target} → ${upstream.status}`, text.slice(0, 400));
  }
  return new NextResponse(text, { status: upstream.status, headers });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
