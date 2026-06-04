interface FieldProps {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  type?: "text" | "number" | "url" | "date";
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
    <label className="grid gap-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        className="rounded-lg border border-line bg-white/[0.04] px-3 py-2 text-sm outline-none transition placeholder:text-muted/70 focus:border-teal-300/60"
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
    <label className="grid gap-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <textarea
        className="rounded-lg border border-line bg-white/[0.04] px-3 py-2 text-sm leading-6 outline-none transition placeholder:text-muted/70 focus:border-teal-300/60"
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
    <label className="grid gap-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <select
        className="rounded-lg border border-line bg-white/[0.04] px-3 py-2 text-sm outline-none transition focus:border-teal-300/60"
        name={name}
        defaultValue={defaultValue}
      >
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
    <label className="flex items-center gap-2 text-sm text-muted">
      <input
        className="size-4 rounded border-line bg-white/[0.05]"
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
      />
      <span>{label}</span>
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
    <fieldset className="rounded-lg border border-line bg-white/[0.025] p-4">
      <legend className="px-1 text-sm font-medium text-ink">{label}</legend>
      {options.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{emptyLabel}</p>
      ) : hasCategories ? (
        <div className="mt-3 grid gap-4">
          {groupedOptions.map((group) => (
            <div key={group.name} className="grid gap-2">
              <div className="flex items-center justify-between gap-3 border-b border-line/70 pb-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">
                  {group.name}
                </p>
                <span className="text-xs text-muted">{group.options.length}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.options.map((option) => (
                  <label key={option.id} className="flex items-center gap-2 text-sm text-muted">
                    <input
                      className="size-4 rounded border-line bg-white/[0.05]"
                      name={name}
                      type="checkbox"
                      value={option.id}
                      defaultChecked={selected.has(option.id)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {options.map((option) => (
            <label key={option.id} className="flex items-center gap-2 text-sm text-muted">
              <input
                className="size-4 rounded border-line bg-white/[0.05]"
                name={name}
                type="checkbox"
                value={option.id}
                defaultChecked={selected.has(option.id)}
              />
              <span>{option.label}</span>
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

export function SubmitButton({ label }: { label: string }) {
  return (
    <button
      className="rounded-lg bg-teal-200 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-100"
      type="submit"
    >
      {label}
    </button>
  );
}

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
    <fieldset className="grid gap-4 rounded-lg border border-line bg-white/[0.025] p-4">
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
