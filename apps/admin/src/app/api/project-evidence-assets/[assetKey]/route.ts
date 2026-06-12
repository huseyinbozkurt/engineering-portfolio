import { getProjectEvidenceAssetFile } from "@portfolio/db/project-evidence-assets";

export const dynamic = "force-dynamic";

interface AssetRouteProps {
  params: Promise<{ assetKey: string }>;
}

export async function GET(_request: Request, { params }: AssetRouteProps): Promise<Response> {
  const { assetKey } = await params;
  const file = await getProjectEvidenceAssetFile(assetKey);

  if (!file) {
    return new Response("No evidence asset found.", { status: 404 });
  }

  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.sizeBytes),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
