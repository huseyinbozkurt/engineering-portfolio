export interface ContactFormValues {
  name: string;
  email: string;
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
    name: "",
    email: "",
    message: "",
    wantsResponse: false,
  },
  fieldErrors: {},
  version: 0,
};
