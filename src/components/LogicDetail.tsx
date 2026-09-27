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
        const isList = lines.length > 0 && lines.every((l) => /^\s*- /.test(l));

        if (isList) {
          // one level of nesting: an indented "  - " line belongs to the item above it
          const items: { text: string; sub: string[] }[] = [];
          for (const l of lines) {
            if (/^\s+- /.test(l) && items.length) items[items.length - 1].sub.push(l.trim().slice(2));
            else items.push({ text: l.trim().slice(2), sub: [] });
          }
          return (
            <ul key={bi} className="list-disc space-y-1.5 pl-5">
              {items.map((it, li) => (
                <li key={li}>
                  {parseInline(it.text, `${bi}-${li}`)}
                  {it.sub.length ? (
                    <ul className="mt-1 list-[circle] space-y-1 pl-5">
                      {it.sub.map((s, si) => (
                        <li key={si}>{parseInline(s, `${bi}-${li}-${si}`)}</li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          );
        }

        return <p key={bi}>{parseInline(block, `${bi}`)}</p>;
      })}
    </div>
  );
}
