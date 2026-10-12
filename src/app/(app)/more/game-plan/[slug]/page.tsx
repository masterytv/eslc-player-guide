import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditLink } from "@/components/EditLink";
import { Header } from "@/components/Header";
import { Markdown } from "@/components/Markdown";
import { loadGuide } from "@/lib/content";

type Params = Promise<{ slug: string }>;

async function findPage(slug: string) {
  const { guide } = await loadGuide();
  return guide.playbook.find((p) => p.slug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const page = await findPage((await params).slug);
  return { title: page?.title ?? "Not found" };
}

export default async function GamePlanPage({ params }: { params: Params }) {
  const page = await findPage((await params).slug);
  if (!page) notFound();
  return (
    <>
      <Header title={page.title} eyebrow="Game plan" back="/more" />
      <main className="main gp">
        {/* Laid out like the coaches' slides: a cover, then a card per slide. */}
        <section className="gp-cover">
          <div>
            <h2>{page.summary || page.title}</h2>
            {page.coach ? <p>{page.coach}</p> : null}
          </div>
          <EditLink href={`/admin/playbook?item=${page.id}`} />
        </section>
        <Markdown source={page.body} contents />
      </main>
    </>
  );
}
