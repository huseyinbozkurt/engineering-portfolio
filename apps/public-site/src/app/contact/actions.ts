"use server";

import { hasDatabaseUrl } from "@portfolio/db";
import { createContactSubmission } from "@portfolio/db/contact";
import { createContactSubmissionSchema } from "@portfolio/validators";

import type { ContactFormState, ContactFormValues } from "./contact-form-state";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/**
 * Verify a Cloudflare Turnstile token server-side. When TURNSTILE_SECRET_KEY is
 * not configured (e.g. local development) verification is skipped so the form
 * keeps working; otherwise a missing or invalid token is rejected.
 */
async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return true;
  }
  if (!token) {
    return false;
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token }),
      },
    );
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error("Turnstile verification request failed", error);
    return false;
  }
}

/** Success-shaped state used to silently drop honeypot-tripped (bot) submissions. */
function droppedSubmissionState(version: number): ContactFormState {
  return {
    status: "success",
    message: "Thanks. Your message has been sent.",
    values: {
      intent: "hiring",
      name: "",
      email: "",
      company: "",
      roleTitle: "",
      techStack: "",
      problem: "",
      desiredOutcome: "",
      timeline: "",
      message: "",
      wantsResponse: true,
    },
    fieldErrors: {},
    version,
  };
}

function valuesFromFormData(formData: FormData): ContactFormValues {
  const message = text(formData, "message");
  const problem = text(formData, "problem") || message;

  return {
    intent: (text(formData, "intent") || "hiring") as ContactFormValues["intent"],
    name: text(formData, "name"),
    email: text(formData, "email"),
    company: text(formData, "company"),
    roleTitle: text(formData, "roleTitle"),
    techStack: text(formData, "techStack"),
    problem,
    desiredOutcome: text(formData, "desiredOutcome"),
    timeline: text(formData, "timeline"),
    message,
    wantsResponse:
      formData.get("wantsResponse") === "on" || text(formData, "wantsResponse") === "true",
  };
}

export async function submitContactForm(
  previousState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const version = previousState.version + 1;

  // Honeypot: humans never fill the hidden companyWebsite field. If it has a
  // value, silently treat the submission as handled without storing anything.
  if (text(formData, "companyWebsite").trim().length > 0) {
    return droppedSubmissionState(version);
  }

  const values = valuesFromFormData(formData);
  const parsed = createContactSubmissionSchema.safeParse(values);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields before sending.",
      values,
      fieldErrors: parsed.error.flatten().fieldErrors,
      version,
    };
  }

  // Cloudflare Turnstile check (no-op when no secret is configured).
  const turnstileValid = await verifyTurnstile(text(formData, "turnstileToken"));
  if (!turnstileValid) {
    return {
      status: "error",
      message: "Verification failed. Please try again.",
      values,
      fieldErrors: {},
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
        intent: "hiring",
        name: "",
        email: "",
        company: "",
        roleTitle: "",
        techStack: "",
        problem: "",
        desiredOutcome: "",
        timeline: "",
        message: "",
        wantsResponse: true,
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
