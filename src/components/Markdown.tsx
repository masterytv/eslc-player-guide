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
    default:
      return null;
  }
}

export function Markdown({ source }: { source: string }) {
  const sections = parsePage(source);
  if (!sections.length) return <p className="meta">Nothing here yet.</p>;
  return (
    <div className="prose">
      {sections.map((s, i) =>
        s.kind === "card" ? (
          <div className="card" key={i}>
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
