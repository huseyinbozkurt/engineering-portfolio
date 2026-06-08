"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

interface RichTextFieldProps {
  label: string;
  name: string;
  defaultValue?: string | undefined;
  placeholder?: string | undefined;
  rows?: number | undefined;
  hint?: string | undefined;
}

type Mode = "write" | "preview";

/**
 * Markdown rich-text editor used for long-form content fields. The value is
 * plain markdown (the public site renders it with the same react-markdown
 * component), submitted through a field named `name` so it works with the
 * existing FormData-based server actions. The toolbar wraps/prefixes the
 * current textarea selection, and "Preview" renders the markdown live.
 */
export function RichTextField({
  label,
  name,
  defaultValue = "",
  placeholder,
  rows = 10,
  hint,
}: RichTextFieldProps) {
  const [value, setValue] = useState(defaultValue);
  const [mode, setMode] = useState<Mode>("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function wrapSelection(before: string, after: string, placeholderText: string) {
    const el = textareaRef.current;
    if (!el) {
      return;
    }

    const { selectionStart: start, selectionEnd: end } = el;
    const selected = value.slice(start, end) || placeholderText;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    setValue(next);

    requestAnimationFrame(() => {
      el.focus();
      const caret = start + before.length;
      el.setSelectionRange(caret, caret + selected.length);
    });
  }

  function prefixLines(prefix: string) {
    const el = textareaRef.current;
    if (!el) {
      return;
    }

    const { selectionStart: start, selectionEnd: end } = el;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const block = value.slice(lineStart, end);
    const prefixed = block
      .split("\n")
      .map((line) => (line.startsWith(prefix) ? line : prefix + line))
      .join("\n");
    const next = value.slice(0, lineStart) + prefixed + value.slice(end);
    setValue(next);

    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(lineStart, lineStart + prefixed.length);
    });
  }

  const tools: Array<{ label: string; title: string; run: () => void }> = [
    { label: "B", title: "Bold", run: () => wrapSelection("**", "**", "bold text") },
    { label: "I", title: "Italic", run: () => wrapSelection("_", "_", "italic text") },
    { label: "H2", title: "Heading", run: () => prefixLines("## ") },
    { label: "H3", title: "Subheading", run: () => prefixLines("### ") },
    { label: "List", title: "Bulleted list", run: () => prefixLines("- ") },
    { label: "1.", title: "Numbered list", run: () => prefixLines("1. ") },
    { label: "Quote", title: "Blockquote", run: () => prefixLines("> ") },
    { label: "Code", title: "Inline code", run: () => wrapSelection("`", "`", "code") },
    { label: "Link", title: "Link", run: () => wrapSelection("[", "](https://)", "label") },
  ];

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="ui-label">{label}</span>
        <div className="flex gap-0.5 rounded-lg border border-line bg-white/[0.03] p-0.5 text-xs">
          {(["write", "preview"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              className={
                mode === option
                  ? "rounded-md bg-white/10 px-3 py-1 font-medium capitalize text-ink"
                  : "rounded-md px-3 py-1 capitalize text-muted transition hover:text-ink"
              }
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-white/[0.03] transition focus-within:border-teal-300/50 focus-within:ring-2 focus-within:ring-teal-300/15">
        {mode === "write" ? (
          <>
            <div className="flex flex-wrap gap-1 border-b border-line bg-white/[0.02] p-1.5">
              {tools.map((tool) => (
                <button
                  key={tool.title}
                  type="button"
                  title={tool.title}
                  onClick={tool.run}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-muted transition hover:bg-white/10 hover:text-ink"
                >
                  {tool.label}
                </button>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              name={name}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              rows={rows}
              placeholder={placeholder}
              className="block w-full resize-y bg-transparent px-3 py-2 font-mono text-sm leading-6 text-ink outline-none placeholder:text-muted/70"
            />
          </>
        ) : (
          <>
            {/* Preserve the value for submission while the textarea is unmounted. */}
            <input type="hidden" name={name} value={value} />
            <div className="min-h-32 px-4 py-3 text-sm leading-6 text-muted [&_a]:text-teal-300 [&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_h3]:mt-3 [&_h3]:font-semibold [&_h3]:text-ink [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-5">
              {value.trim() ? (
                <ReactMarkdown>{value}</ReactMarkdown>
              ) : (
                <p className="text-muted/70">Nothing to preview yet.</p>
              )}
            </div>
          </>
        )}
      </div>

      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
