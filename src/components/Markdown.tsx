import { Fragment } from "react";
import { parsePage, type Block, type Inline } from "@/lib/markdown";
import { Icon } from "./Icon";

function Inlines({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.t === "bold" ? (
          <strong key={i}>{p.v}</strong>
        ) : p.t === "link" ? (
          <a key={i} href={p.href} {...(/^https?:/i.test(p.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {p.v}
          </a>
        ) : (
          <Fragment key={i}>{p.v}</Fragment>
        ),
      )}
    </>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "p":
      return (
        <p>
          <Inlines parts={block.inline} />
        </p>
      );
    case "key":
      return (
        <p className="key">
          <Inlines parts={block.inline} />
        </p>
      );
    case "banner":
      return (
        <p className="banner">
          <Inlines parts={block.inline} />
        </p>
      );
    case "point":
      return (
        <div className="pt">
          {block.label ? <h4>{block.label}</h4> : null}
          {block.blocks.map((b, i) => (
            <BlockView key={i} block={b} />
          ))}
        </div>
      );
    case "ul":
      return (
        <ul className="bul">
          {block.items.map((item, i) => (
            <li key={i}>
              <Inlines parts={item} />
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="steps" start={block.start}>
          {block.items.map((item, i) => (
            <li key={i}>
              <span className="n" aria-hidden="true">
                {block.start + i}
              </span>
              <span>
                <Inlines parts={item} />
              </span>
            </li>
          ))}
        </ol>
      );
    default:
      return null;
  }
}

/** With `contents`, long pages start with a list of their cards' headings that jumps to each one. */
export function Markdown({ source, contents = false }: { source: string; contents?: boolean }) {
  const sections = parsePage(source);
  if (!sections.length) return <p className="meta">Nothing here yet.</p>;
  const parts = sections.flatMap((s, i) => (s.kind === "card" && s.heading ? [{ i, heading: s.heading }] : []));
  const anchor = (i: number) => `part-${i + 1}`;
  return (
    <div className="prose">
      {contents && parts.length > 2 ? (
        <details className="toc">
          <summary>
            Jump to <span className="meta">{parts.length} parts</span>
          </summary>
          <ol>
            {parts.map((p) => (
              <li key={p.i}>
                <a href={`#${anchor(p.i)}`}>{p.heading}</a>
              </li>
            ))}
          </ol>
        </details>
      ) : null}
      {sections.map((s, i) =>
        s.kind === "card" ? (
          <div className="card" key={i} id={contents && s.heading ? anchor(i) : undefined}>
            {s.heading ? <h3>{s.heading}</h3> : null}
            {s.blocks.map((b, j) => (
              <BlockView key={j} block={b} />
            ))}
          </div>
        ) : s.kind === "warn" ? (
          <p className="warn" key={i}>
            <Icon name="warn" />
            <span>
              <Inlines parts={s.inline} />
            </span>
          </p>
        ) : (
          <p className="info" key={i}>
            <Icon name="info" />
            <span>
              <Inlines parts={s.inline} />
            </span>
          </p>
        ),
      )}
    </div>
  );
}
