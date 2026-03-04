import Link from "next/link";
import type { Route } from "next";
import type { ReactElement } from "react";

const links = [
  { href: "/", label: "Command" },
  { href: "/leads", label: "Leads" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/settings", label: "Settings" }
] as const satisfies ReadonlyArray<{ href: Route; label: string }>;

export function Sidebar(): ReactElement {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-kicker">Autonomous Growth</span>
        <h1>Web Design Agency OS</h1>
      </div>
      <nav>
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
