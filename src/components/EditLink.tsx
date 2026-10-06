import Link from "next/link";
import { currentSession } from "@/lib/session";
import { Icon } from "./Icon";

/** A small "Edit" button that only staff see. */
export async function EditLink({ href, label = "Edit" }: { href: string; label?: string }) {
  const session = await currentSession();
  if (session?.role !== "admin") return null;
  return (
    <Link className="edit-link" href={href}>
      <Icon name="pencil" />
      {label}
    </Link>
  );
}
