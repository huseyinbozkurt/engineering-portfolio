interface FieldProps {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  type?: "text" | "number" | "url" | "date" | "email";
  defaultValue?: string | undefined;
  hint?: string | undefined;
}

interface TextAreaProps {
  label: string;
  name: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
  defaultValue?: string | undefined;
  hint?: string | undefined;
}

interface SelectProps {
  label: string;
  name: string;
  options: Array<{ label: string; value: string }>;
  defaultValue?: string;
  hint?: string | undefined;
}

interface CheckboxGroupProps {
  label: string;
  name: string;
  options: Array<{ id: string; label: string; category?: string | null | undefined }>;
  emptyLabel: string;
  selectedIds?: readonly string[] | undefined;
}

/** Shared label, with a required marker and optional helper text. */
function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <span className="ui-label">
      {label}
      {required ? (
        <span className="ui-required" aria-hidden>
          *
        </span>
      ) : null}
    </span>
  );
}

export function Field({
  label,
  name,
  required = false,
  placeholder,
  type = "text",
  defaultValue,
  hint,
}: FieldProps) {
  return (
    <label className="ui-field">
      <FieldLabel label={label} required={required} />
      <input
        className="ui-input"
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
        defaultValue={defaultValue}
      />
      {hint ? <span className="ui-hint">{hint}</span> : null}
    </label>
  );
}

export function TextArea({
  label,
  name,
  required = false,
  rows = 5,
  placeholder,
  defaultValue,
  hint,
}: TextAreaProps) {
  return (
    <label className="ui-field">
      <FieldLabel label={label} required={required} />
      <textarea
        className="ui-input leading-6"
        name={name}
        placeholder={placeholder}
        required={required}
        rows={rows}
        defaultValue={defaultValue}
      />
      {hint ? <span className="ui-hint">{hint}</span> : null}
    </label>
  );
}

export function SelectField({ label, name, options, defaultValue, hint }: SelectProps) {
  return (
    <label className="ui-field">
      <FieldLabel label={label} />
      <select className="ui-select" name={name} defaultValue={defaultValue}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <span className="ui-hint">{hint}</span> : null}
    </label>
  );
}

/**
 * Standalone boolean control, rendered as a toggle switch (the underlying
 * element is still a native `input[type=checkbox]`, so form submission and the
 * `name`/`defaultChecked` contract are unchanged).
 */
export function Checkbox({
  label,
  name,
  defaultChecked = false,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex min-w-0 cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-white/[0.02] px-3.5 py-2.5">
      <span className="min-w-0 break-words text-sm font-medium text-ink">{label}</span>
      <span className="ui-switch">
        <input name={name} type="checkbox" defaultChecked={defaultChecked} />
        <span />
      </span>
    </label>
  );
}

export function CheckboxGroup({
  label,
  name,
  options,
  emptyLabel,
  selectedIds,
}: CheckboxGroupProps) {
  const selected = new Set(selectedIds ?? []);
  const hasCategories = options.some((option) => option.category);
  const groupedOptions = hasCategories ? groupOptionsByCategory(options) : [];

  return (
    <fieldset className="ui-fieldset">
      <legend className="ui-legend">{label}</legend>
      {options.length === 0 ? (
        <p className="text-sm text-muted">{emptyLabel}</p>
      ) : hasCategories ? (
        <div className="grid gap-4">
          {groupedOptions.map((group) => (
            <div key={group.name} className="grid min-w-0 gap-2">
              <div className="flex items-center justify-between gap-3 border-b border-line pb-1.5">
                <p className="ui-eyebrow min-w-0 break-words">{group.name}</p>
                <span className="text-xs tabular-nums text-muted/70">{group.options.length}</span>
              </div>
              <div className="grid min-w-0 gap-1.5 sm:grid-cols-2">
                {group.options.map((option) => (
                  <label key={option.id} className="ui-option">
                    <input
                      className="ui-checkbox"
                      name={name}
                      type="checkbox"
                      value={option.id}
                      defaultChecked={selected.has(option.id)}
                    />
                    <span className="min-w-0 break-words">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid min-w-0 gap-1.5 sm:grid-cols-2">
          {options.map((option) => (
            <label key={option.id} className="ui-option">
              <input
                className="ui-checkbox"
                name={name}
                type="checkbox"
                value={option.id}
                defaultChecked={selected.has(option.id)}
              />
              <span className="min-w-0 break-words">{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

function groupOptionsByCategory(
  options: Array<{ id: string; label: string; category?: string | null | undefined }>,
) {
  const groups = new Map<string, typeof options>();

  for (const option of options) {
    const category = option.category?.trim() || "Uncategorized";
    groups.set(category, [...(groups.get(category) ?? []), option]);
  }

  return Array.from(groups, ([name, groupOptions]) => ({
    name,
    options: groupOptions,
  })).sort((left, right) => {
    if (left.name === "Uncategorized") {
      return 1;
    }

    if (right.name === "Uncategorized") {
      return -1;
    }

    return left.name.localeCompare(right.name);
  });
}

// Re-exported so existing `import { SubmitButton } from "@/components/form-controls"`
// keeps working. The button itself lives in a client module because it reads the
// form-validity context to disable itself until the form is complete.
export { SubmitButton } from "@/components/submit-button";

export const statusOptions: Array<{ label: string; value: string }> = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

export function StatusSelect({ defaultValue = "draft" }: { defaultValue?: string | undefined }) {
  return (
    <SelectField label="Status" name="status" options={statusOptions} defaultValue={defaultValue} />
  );
}

export interface SeoDefaults {
  seoTitle: string | null;
  seoDescription: string | null;
  ogImage: string | null;
}

/**
 * Optional SEO / Open Graph overrides. All three submit empty strings when left
 * blank; the validators coerce those to null so nothing is persisted. Pass
 * `bare` to emit just the fields (no fieldset chrome) when the caller already
 * provides a grouping container such as a FormDisclosure.
 */
export function SeoFields({
  defaults,
  bare = false,
}: {
  defaults?: SeoDefaults | undefined;
  bare?: boolean;
}) {
  const fields = (
    <>
      <Field
        label="SEO title"
        name="seoTitle"
        placeholder="Optional — overrides the page title"
        defaultValue={defaults?.seoTitle ?? undefined}
      />
      <TextArea
        label="SEO description"
        name="seoDescription"
        rows={3}
        placeholder="Optional — meta description and social card text"
        defaultValue={defaults?.seoDescription ?? undefined}
      />
      <Field
        label="OG image URL"
        name="ogImage"
        type="url"
        placeholder="https://…"
        defaultValue={defaults?.ogImage ?? undefined}
      />
    </>
  );

  if (bare) {
    return fields;
  }

  return (
    <fieldset className="ui-fieldset gap-4">
      <legend className="ui-legend">SEO &amp; social</legend>
      {fields}
    </fieldset>
  );
}
