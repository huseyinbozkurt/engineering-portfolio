import type { ContactIntent } from "@portfolio/validators";

export interface ContactFormValues {
  intent: ContactIntent;
  name: string;
  email: string;
  company: string;
  roleTitle: string;
  techStack: string;
  problem: string;
  desiredOutcome: string;
  timeline: string;
  message: string;
  wantsResponse: boolean;
}

export interface ContactFormState {
  status: "idle" | "success" | "error";
  message: string;
  values: ContactFormValues;
  fieldErrors: Partial<Record<keyof ContactFormValues, string[]>>;
  version: number;
  submissionId?: string;
}

export const initialContactFormState: ContactFormState = {
  status: "idle",
  message: "",
  values: {
    intent: "technicalConsultation",
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
  version: 0,
};
