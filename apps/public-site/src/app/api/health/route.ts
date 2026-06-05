export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return Response.json(
    {
      service: "public-site",
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export function HEAD() {
  return new Response(null, {
    headers: {
      "Cache-Control": "no-store",
    },
    status: 200,
  });
}
