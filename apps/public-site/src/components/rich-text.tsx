import ReactMarkdown from "react-markdown";

interface RichTextProps {
  value: string;
}

export function RichText({ value }: RichTextProps) {
  if (!value.trim()) {
    return null;
  }

  return (
    <div className="rich-text">
      <ReactMarkdown>{value}</ReactMarkdown>
    </div>
  );
}
