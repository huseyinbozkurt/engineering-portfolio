import { desc, eq, type InferSelectModel } from "drizzle-orm";

import { getDb, hasDatabaseUrl } from "./client";
import { siteImages, siteSettings } from "./schema";

export type SiteImageRecord = InferSelectModel<typeof siteImages>;

export function siteImagePublicPath(imageId: string): string {
  return `/brand/logo/${imageId}`;
}

export async function getSiteImageFile(imageId: string): Promise<SiteImageRecord | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  try {
    const [record] = await getDb()
      .select()
      .from(siteImages)
      .where(eq(siteImages.id, imageId))
      .limit(1);

    return record ?? null;
  } catch (error) {
    console.error("[db] site_images read failed; treating as missing:", error);
    return null;
  }
}

export async function getPublicBrandLogoImageFile(
  imageId: string,
): Promise<SiteImageRecord | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  try {
    const [settings] = await getDb()
      .select({ brandLogoImageId: siteSettings.brandLogoImageId })
      .from(siteSettings)
      .orderBy(desc(siteSettings.updatedAt), desc(siteSettings.createdAt))
      .limit(1);

    if (!settings?.brandLogoImageId || settings.brandLogoImageId !== imageId) {
      return null;
    }

    return getSiteImageFile(imageId);
  } catch (error) {
    console.error("[db] public site_images read failed; treating as missing:", error);
    return null;
  }
}
