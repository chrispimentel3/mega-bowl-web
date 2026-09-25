/** Renders mega/logic.py's `detail` field: plain paragraphs, `- ` bullet lists, and inline
 * `**bold**` / `` `code` `` — a small superset of InlineMarkdown.tsx for this one page's
 * hand-authored, developer-controlled content. Never used on user-generated text. */
function parseInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} className="rounded bg-ink/5 px-1 py-0.5 text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return <span key={key}>{part}</span>;
  });
}

export function LogicDetail({ text }: { text: string }) {
  const blocks = text.split("\n\n").filter(Boolean);

  return (
    <div className="space-y-3 text-sm text-ink">
      {blocks.map((block, bi) => {
        const lines = block.split("\n").filter(Boolean);
        const isList = lines.length > 0 && lines.every((l) => l.startsWith("- "));

        if (isList) {
          return (
            <ul key={bi} className="list-disc space-y-1.5 pl-5">
              {lines.map((line, li) => (
                <li key={li}>{parseInline(line.slice(2), `${bi}-${li}`)}</li>
              ))}
            </ul>
          );
        }

        return <p key={bi}>{parseInline(block, `${bi}`)}</p>;
      })}
    </div>
  );
}
