import "@/app/globals.css";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Web Design Agency OS",
  description: "Autonomous AI workflow for discovering, closing, and delivering web redesign clients."
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <div className="app-shell">
          <Sidebar />
          <main>
            <header className="topbar">
              <p>Pipeline Control Center</p>
              <ThemeToggle />
            </header>
            <section>{children}</section>
          </main>
        </div>
      </body>
    </html>
  );
}
