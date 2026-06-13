import { getSiteImageFile } from "@portfolio/db/site-images";

export const dynamic = "force-dynamic";

interface SiteImageRouteProps {
  params: Promise<{ imageId: string }>;
}

export async function GET(_request: Request, { params }: SiteImageRouteProps): Promise<Response> {
  const { imageId } = await params;
  const file = await getSiteImageFile(imageId);

  if (!file) {
    return new Response("No site image found.", { status: 404 });
  }

  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.sizeBytes),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
