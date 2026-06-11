import { getContactResumeFile } from "@portfolio/db/resume";

export const dynamic = "force-dynamic";

/** Admin-side download of the stored resume (verification before publishing). */
export async function GET(): Promise<Response> {
  const file = await getContactResumeFile();

  if (!file) {
    return new Response("No resume uploaded.", { status: 404 });
  }

  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.fileType,
      "Content-Length": String(file.fileSize),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      "Cache-Control": "no-store",
    },
  });
}
