import type { CreateContactSubmissionInput } from "@portfolio/validators";

import { getDb } from "./client";
import { contactSubmissions } from "./schema";

export async function createContactSubmission(
  input: CreateContactSubmissionInput,
): Promise<string> {
  const [record] = await getDb()
    .insert(contactSubmissions)
    .values(input)
    .returning({ id: contactSubmissions.id });

  if (!record) {
    throw new Error("Contact submission insert did not return a record.");
  }

  return record.id;
}
