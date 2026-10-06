"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

const TABS: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/", label: "Today", icon: "today" },
  { href: "/schedule", label: "Schedule", icon: "schedule" },
  { href: "/team", label: "Team", icon: "team" },
  { href: "/venue", label: "Venue", icon: "venue" },
  { href: "/more", label: "More", icon: "more" },
];

export function TabBar() {
  const path = usePathname();
  return (
    <nav className="tabs" aria-label="Sections">
      {TABS.map((t) => {
        const current = t.href === "/" ? path === "/" : path === t.href || path.startsWith(`${t.href}/`);
        return (
          <Link key={t.href} href={t.href} className="tab" aria-current={current ? "page" : undefined}>
            <Icon name={t.icon} />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
