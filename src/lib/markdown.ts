// A deliberately small text format for the editable pages, easy to type on a phone:
//   ## Heading       starts a new card
//   - item           bullet list
//   1. step          numbered list
//   !! text          red warning
//   > text           grey note
//   **bold**, [label](https://link)
// Anything else is a paragraph. Blank lines separate blocks.

export type Inline = { t: "text"; v: string } | { t: "bold"; v: string } | { t: "link"; v: string; href: string };
export type Block =
  | { kind: "p"; inline: Inline[] }
  | { kind: "ul"; items: Inline[][] }
  | { kind: "ol"; start: number; items: Inline[][] }
  | { kind: "warn"; inline: Inline[] }
  | { kind: "note"; inline: Inline[] };
export type Section =
  | { kind: "card"; heading: string | null; blocks: Block[] }
  | { kind: "warn"; inline: Inline[] }
  | { kind: "note"; inline: Inline[] };

const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i;

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    if (m.index > last) out.push({ t: "text", v: src.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ t: "bold", v: m[1] });
    else if (SAFE_HREF.test(m[3])) out.push({ t: "link", v: m[2], href: m[3] });
    else out.push({ t: "text", v: m[0] });
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push({ t: "text", v: src.slice(last) });
  return out;
}

export function parsePage(src: string): Section[] {
  const sections: Section[] = [];
  let card: Extract<Section, { kind: "card" }> | null = null;
  let para: string[] = [];
  let list: Inline[][] | null = null;
  let steps: { start: number; items: Inline[][] } | null = null;

  const flushPara = () => {
    if (para.length) {
      ensureCard().blocks.push({ kind: "p", inline: parseInline(para.join("\n")) });
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      ensureCard().blocks.push({ kind: "ul", items: list });
      list = null;
    }
    if (steps) {
      ensureCard().blocks.push({ kind: "ol", ...steps });
      steps = null;
    }
  };
  const ensureCard = () => {
    if (!card) {
      card = { kind: "card", heading: null, blocks: [] };
      sections.push(card);
    }
    return card;
  };

  for (const raw of src.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) {
      flushPara();
      flushList();
      continue;
    }
    if (trimmed.startsWith("## ") || trimmed === "##") {
      flushPara();
      flushList();
      card = { kind: "card", heading: trimmed.replace(/^##\s*/, ""), blocks: [] };
      sections.push(card);
      continue;
    }
    if (trimmed.startsWith("!!")) {
      flushPara();
      flushList();
      sections.push({ kind: "warn", inline: parseInline(trimmed.replace(/^!!\s*/, "")) });
      card = null;
      continue;
    }
    if (trimmed.startsWith(">")) {
      flushPara();
      flushList();
      sections.push({ kind: "note", inline: parseInline(trimmed.replace(/^>\s*/, "")) });
      card = null;
      continue;
    }
    if (/^[-*•]\s+/.test(trimmed)) {
      flushPara();
      if (steps) flushList();
      list ??= [];
      list.push(parseInline(trimmed.replace(/^[-*•]\s+/, "")));
      continue;
    }
    const step = /^(\d{1,3})[.)]\s+/.exec(trimmed);
    if (step) {
      flushPara();
      if (list) flushList();
      // Numbering carries on from the number typed, so steps split by a blank line still read 1, 2, 3.
      steps ??= { start: Number(step[1]), items: [] };
      steps.items.push(parseInline(trimmed.slice(step[0].length)));
      continue;
    }
    flushList();
    para.push(trimmed);
  }
  flushPara();
  flushList();
  return sections.filter((s) => s.kind !== "card" || s.heading || s.blocks.length);
}
