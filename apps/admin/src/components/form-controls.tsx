interface FieldProps {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  type?: "text" | "number" | "url" | "date" | "email";
  defaultValue?: string | undefined;
}

interface TextAreaProps {
  label: string;
  name: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
  defaultValue?: string | undefined;
}

interface SelectProps {
  label: string;
  name: string;
  options: Array<{ label: string; value: string }>;
  defaultValue?: string;
}

interface CheckboxGroupProps {
  label: string;
  name: string;
  options: Array<{ id: string; label: string; category?: string | null | undefined }>;
  emptyLabel: string;
  selectedIds?: readonly string[] | undefined;
}

export function Field({
  label,
  name,
  required = false,
  placeholder,
  type = "text",
  defaultValue,
}: FieldProps) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="ui-label">{label}</span>
      <input
        className="ui-input"
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
        defaultValue={defaultValue}
      />
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
}: TextAreaProps) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="ui-label">{label}</span>
      <textarea
        className="ui-input leading-6"
        name={name}
        placeholder={placeholder}
        required={required}
        rows={rows}
        defaultValue={defaultValue}
      />
    </label>
  );
}

export function SelectField({ label, name, options, defaultValue }: SelectProps) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="ui-label">{label}</span>
      <select className="ui-select" name={name} defaultValue={defaultValue}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

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
    <label className="flex min-w-0 items-center gap-2 text-sm text-muted">
      <input
        className="size-4 shrink-0 rounded border-line bg-white/[0.05] accent-teal-300"
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
      />
      <span className="min-w-0 break-words">{label}</span>
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
    <fieldset className="ui-card min-w-0 p-4">
      <legend className="px-1 text-sm font-medium text-ink">{label}</legend>
      {options.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{emptyLabel}</p>
      ) : hasCategories ? (
        <div className="mt-3 grid gap-4">
          {groupedOptions.map((group) => (
            <div key={group.name} className="grid min-w-0 gap-2">
              <div className="flex items-center justify-between gap-3 border-b border-line pb-1.5">
                <p className="min-w-0 break-words text-xs font-semibold uppercase tracking-wide text-amber-200/90">
                  {group.name}
                </p>
                <span className="text-xs text-muted">{group.options.length}</span>
              </div>
              <div className="grid min-w-0 gap-2 sm:grid-cols-2">
                {group.options.map((option) => (
                  <label
                    key={option.id}
                    className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted transition hover:bg-white/[0.03]"
                  >
                    <input
                      className="size-4 shrink-0 rounded border-line bg-white/[0.05] accent-teal-300"
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
        <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">
          {options.map((option) => (
            <label
              key={option.id}
              className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted transition hover:bg-white/[0.03]"
            >
              <input
                className="size-4 shrink-0 rounded border-line bg-white/[0.05] accent-teal-300"
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
 * blank; the validators coerce those to null so nothing is persisted.
 */
export function SeoFields({ defaults }: { defaults?: SeoDefaults | undefined }) {
  return (
    <fieldset className="ui-card grid gap-4 p-4">
      <legend className="px-1 text-sm font-medium text-ink">SEO &amp; social</legend>
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
    </fieldset>
  );
}
