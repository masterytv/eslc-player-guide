import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditLink } from "@/components/EditLink";
import { Header } from "@/components/Header";
import { Markdown } from "@/components/Markdown";
import { loadGuide } from "@/lib/content";

type Params = Promise<{ slug: string }>;

async function findPage(slug: string) {
  const { guide } = await loadGuide();
  return guide.pages.find((p) => p.slug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const page = await findPage((await params).slug);
  return { title: page?.title ?? "Not found" };
}

export default async function GuidePage({ params }: { params: Params }) {
  const page = await findPage((await params).slug);
  if (!page) notFound();
  return (
    <>
      <Header title={page.title} eyebrow="More" back="/more" />
      <main className="main">
        <div className="h-row">
          <span />
          <EditLink href={`/admin/pages?item=${page.id}`} />
        </div>
        <Markdown source={page.body} />
      </main>
    </>
  );
}
