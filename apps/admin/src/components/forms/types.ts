/** A selectable related record, rendered as a checkbox in relation pickers. */
export interface RelationOption {
  id: string;
  label: string;
  category?: string | null | undefined;
}

/** A server action bound to a form's `action` attribute. */
export type FormAction = (formData: FormData) => void | Promise<void>;
