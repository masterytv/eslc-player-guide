"use client";

import { useState } from "react";
import { Icon } from "./Icon";

export function CopyButton({ text, label = "Copy", done = "Copied" }: { text: string; label?: string; done?: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("done");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2200);
  };
  return (
    <button className="pill-btn" onClick={copy} type="button">
      <Icon name="copy" />
      <span aria-live="polite">{state === "done" ? done : state === "failed" ? "Press and hold to copy" : label}</span>
    </button>
  );
}
