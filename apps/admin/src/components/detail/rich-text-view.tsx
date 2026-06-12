import ReactMarkdown from "react-markdown";

interface RichTextViewProps {
  value: string;
  /** Tightens spacing/sizing for compact contexts like stack cards. */
  dense?: boolean;
}

/**
 * Read-only markdown renderer for the admin detail pages. Mirrors how the
 * public site renders the same fields (`react-markdown`) so the admin preview
 * matches what visitors see, using the admin's dark prose tokens.
 */
export function RichTextView({ value, dense = false }: RichTextViewProps) {
  if (!value.trim()) {
    return <p className="text-sm italic text-muted/60">Nothing here yet.</p>;
  }

  return (
    <div
      className={`rich-text leading-7 text-muted [&_a]:text-accent-300 [&_a]:underline-offset-4 hover:[&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-4 [&_blockquote]:text-muted/90 [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-3 [&_strong]:text-ink [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 ${
        dense ? "text-sm [&_p]:my-2" : ""
      }`}
    >
      <ReactMarkdown>{value}</ReactMarkdown>
    </div>
  );
}
