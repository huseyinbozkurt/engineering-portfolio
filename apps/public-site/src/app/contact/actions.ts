"use server";

import { hasDatabaseUrl } from "@portfolio/db";
import { createContactSubmission } from "@portfolio/db/contact";
import { createContactSubmissionSchema } from "@portfolio/validators";

import type { ContactFormState, ContactFormValues } from "./contact-form-state";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function valuesFromFormData(formData: FormData): ContactFormValues {
  return {
    name: text(formData, "name"),
    email: text(formData, "email"),
    message: text(formData, "message"),
    wantsResponse: formData.get("wantsResponse") === "on",
  };
}

export async function submitContactForm(
  previousState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const values = valuesFromFormData(formData);
  const parsed = createContactSubmissionSchema.safeParse(values);
  const version = previousState.version + 1;

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields before sending.",
      values,
      fieldErrors: parsed.error.flatten().fieldErrors,
      version,
    };
  }

  if (!hasDatabaseUrl()) {
    return {
      status: "error",
      message: "Contact submissions are not available until DATABASE_URL is configured.",
      values,
      fieldErrors: {},
      version,
    };
  }

  try {
    const submissionId = await createContactSubmission(parsed.data);

    return {
      status: "success",
      message: "Thanks. Your message has been sent.",
      values: {
        name: "",
        email: "",
        message: "",
        wantsResponse: false,
      },
      fieldErrors: {},
      version,
      submissionId,
    };
  } catch (error) {
    console.error("Contact submission failed", error);

    return {
      status: "error",
      message: "Something went wrong while sending your message. Please try again.",
      values,
      fieldErrors: {},
      version,
    };
  }
}
