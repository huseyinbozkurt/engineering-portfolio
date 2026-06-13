import { getPublicBrandLogoImageFile } from "@portfolio/db/site-images";

export const dynamic = "force-dynamic";

interface BrandLogoRouteProps {
  params: Promise<{ imageId: string }>;
}

export async function GET(_request: Request, { params }: BrandLogoRouteProps): Promise<Response> {
  const { imageId } = await params;
  const file = await getPublicBrandLogoImageFile(imageId);

  if (!file) {
    return new Response("Not found.", { status: 404 });
  }

  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.sizeBytes),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
