import type { Metadata } from "next";
import { AnthemLyrics } from "@/components/AnthemLyrics";
import { EditLink } from "@/components/EditLink";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { loadGuide } from "@/lib/content";

export const metadata: Metadata = { title: "National anthem" };

export default async function AnthemPage() {
  const { anthem } = (await loadGuide()).guide;
  return (
    <>
      <Header title="National anthem" eyebrow="More" back="/more" />
      <main className="main">
        <div className="card">
          <div className="h-row">
            {anthem.requirement ? <p className="eyebrow">{anthem.requirement}</p> : <span />}
            <EditLink href="/admin/anthem" />
          </div>
          {anthem.title ? <h3>{anthem.title}</h3> : null}
          {anthem.intro ? <p className="prose-p">{anthem.intro}</p> : null}
          {anthem.videoUrl ? (
            <div className="row-btns">
              <a className="pill-btn primary" href={anthem.videoUrl} target="_blank" rel="noopener noreferrer">
                <Icon name="anthem" />
                {anthem.videoLabel || "Watch the video"}
              </a>
            </div>
          ) : null}
        </div>
        {anthem.lines.length ? <AnthemLyrics lines={anthem.lines} /> : null}
        {anthem.credit ? <p className="meta">{anthem.credit}</p> : null}
      </main>
    </>
  );
}
