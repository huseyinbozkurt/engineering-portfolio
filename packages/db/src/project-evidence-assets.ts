import { and, eq, notInArray, type InferSelectModel } from "drizzle-orm";

import { getDb, hasDatabaseUrl } from "./client";
import { projectEvidenceAssets, projects } from "./schema";

export type ProjectEvidenceAssetRecord = InferSelectModel<typeof projectEvidenceAssets>;

export function projectEvidenceAssetPublicPath(assetKey: string): string {
  return `/projects/assets/${assetKey}`;
}

export interface SetProjectEvidenceAssetInput {
  projectId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  data: Buffer;
}

export async function setProjectEvidenceAsset(
  input: SetProjectEvidenceAssetInput,
): Promise<{
  assetKey: string;
  assetUrl: string;
  assetMimeType: string;
  assetSizeBytes: number;
}> {
  const [record] = await getDb()
    .insert(projectEvidenceAssets)
    .values({
      projectId: input.projectId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      data: input.data,
    })
    .returning({ id: projectEvidenceAssets.id });

  if (!record) {
    throw new Error("Failed to store project evidence asset.");
  }

  return {
    assetKey: record.id,
    assetUrl: projectEvidenceAssetPublicPath(record.id),
    assetMimeType: input.mimeType,
    assetSizeBytes: input.sizeBytes,
  };
}

export async function getProjectEvidenceAssetFile(
  assetKey: string,
): Promise<ProjectEvidenceAssetRecord | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  try {
    const [record] = await getDb()
      .select()
      .from(projectEvidenceAssets)
      .where(eq(projectEvidenceAssets.id, assetKey))
      .limit(1);

    return record ?? null;
  } catch (error) {
    console.error("[db] project_evidence_assets read failed; treating as missing:", error);
    return null;
  }
}

export async function getPublicProjectEvidenceAssetFile(
  assetKey: string,
): Promise<ProjectEvidenceAssetRecord | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  try {
    const [row] = await getDb()
      .select({ asset: projectEvidenceAssets, project: projects })
      .from(projectEvidenceAssets)
      .innerJoin(projects, eq(projectEvidenceAssets.projectId, projects.id))
      .where(
        and(
          eq(projectEvidenceAssets.id, assetKey),
          eq(projects.status, "published"),
          eq(projects.portfolioVisibility, "public"),
        ),
      )
      .limit(1);

    if (!row) {
      return null;
    }

    const publicPath = projectEvidenceAssetPublicPath(assetKey);
    const isReferencedPublicEvidence = row.project.evidence.some(
      (item) =>
        item.visibility === "public" &&
        item.source === "upload" &&
        (item.assetKey === assetKey || item.assetUrl === publicPath),
    );

    return isReferencedPublicEvidence ? row.asset : null;
  } catch (error) {
    console.error("[db] public project_evidence_assets read failed; treating as missing:", error);
    return null;
  }
}

export async function deleteUnreferencedProjectEvidenceAssets(
  projectId: string,
  retainedAssetKeys: readonly string[],
): Promise<void> {
  const db = getDb();

  if (retainedAssetKeys.length === 0) {
    await db.delete(projectEvidenceAssets).where(eq(projectEvidenceAssets.projectId, projectId));
    return;
  }

  await db
    .delete(projectEvidenceAssets)
    .where(
      and(
        eq(projectEvidenceAssets.projectId, projectId),
        notInArray(projectEvidenceAssets.id, [...retainedAssetKeys]),
      ),
    );
}
