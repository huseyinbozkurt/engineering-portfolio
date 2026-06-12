import { getPublicProjectEvidenceAssetFile } from "@portfolio/db/project-evidence-assets";

export const dynamic = "force-dynamic";

interface AssetRouteProps {
  params: Promise<{ assetKey: string }>;
}

export async function GET(_request: Request, { params }: AssetRouteProps): Promise<Response> {
  const { assetKey } = await params;
  const file = await getPublicProjectEvidenceAssetFile(assetKey);

  if (!file) {
    return new Response("Not found.", { status: 404 });
  }

  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.sizeBytes),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
