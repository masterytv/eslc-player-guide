import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { loadGuide, loadTournaments } from "@/lib/content";
import { NewTournamentForm } from "./NewTournamentForm";

export const metadata: Metadata = { title: "Start the next tournament" };

export default async function NewTournamentPage() {
  const [{ list }, current] = await Promise.all([loadTournaments(), loadGuide()]);
  return (
    <>
      <Header title="Next tournament" eyebrow="Tournaments" back="/admin/tournaments" />
      <main className="main no-tabs">
        <p className="meta">
          It starts as a copy of an earlier tournament, with only the parts you tick below. Players won&rsquo;t see it until you make it
          live, so you can get it ready while the current one is still on.
        </p>
        <NewTournamentForm
          tournaments={list.map((t) => ({ id: t.id, name: t.name }))}
          from={current.id}
          timeZone={current.guide.event.timeZone}
          passcode={current.access.passcode}
        />
      </main>
    </>
  );
}
