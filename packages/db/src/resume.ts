import { desc, type InferSelectModel } from "drizzle-orm";

import { getDb, hasDatabaseUrl } from "./client";
import { contactResume } from "./schema";

type ContactResumeRecord = InferSelectModel<typeof contactResume>;

/** File metadata without the binary payload — safe for page rendering. */
export type ContactResumeMeta = Omit<ContactResumeRecord, "data">;

const metaColumns = {
  id: contactResume.id,
  fileName: contactResume.fileName,
  fileType: contactResume.fileType,
  fileSize: contactResume.fileSize,
  uploadedAt: contactResume.uploadedAt,
};

/** Reads tolerate a missing/unreachable database like the other public readers. */
export async function getContactResumeMeta(): Promise<ContactResumeMeta | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  try {
    const [record] = await getDb()
      .select(metaColumns)
      .from(contactResume)
      .orderBy(desc(contactResume.uploadedAt))
      .limit(1);

    return record ?? null;
  } catch (error) {
    console.error("[db] contact_resume read failed; treating as missing:", error);
    return null;
  }
}

/** Full file including the payload — for download route handlers only. */
export async function getContactResumeFile(): Promise<ContactResumeRecord | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  try {
    const [record] = await getDb()
      .select()
      .from(contactResume)
      .orderBy(desc(contactResume.uploadedAt))
      .limit(1);

    return record ?? null;
  } catch (error) {
    console.error("[db] contact_resume read failed; treating as missing:", error);
    return null;
  }
}

export interface SetContactResumeInput {
  fileName: string;
  fileType: string;
  fileSize: number;
  data: Buffer;
}

/** Replaces the stored resume (single-row semantics). */
export async function setContactResume(input: SetContactResumeInput): Promise<void> {
  await getDb().transaction(async (tx) => {
    await tx.delete(contactResume);
    await tx.insert(contactResume).values({
      fileName: input.fileName,
      fileType: input.fileType,
      fileSize: input.fileSize,
      data: input.data,
    });
  });
}

export async function clearContactResume(): Promise<void> {
  await getDb().delete(contactResume);
}
