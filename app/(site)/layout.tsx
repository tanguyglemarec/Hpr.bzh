import Link from "next/link";
import { SITE_PROCEDES } from "@/lib/constants";

const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/procedes", label: "Procédés" },
  { href: "/realisations", label: "Réalisations" },
  { href: "/contact", label: "Contact" },
];

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded border border-line bg-panel font-[family-name:var(--font-display)] text-lg font-extrabold text-accent">
              H
            </span>
            <span className="font-[family-name:var(--font-display)] text-lg font-bold uppercase tracking-wide">
              HPR
            </span>
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="text-foreground/80 transition-colors hover:text-accent">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-10 text-sm text-muted">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <p className="font-[family-name:var(--font-display)] text-base font-bold uppercase tracking-wide text-foreground">
                HPR
              </p>
              <p className="mt-2 max-w-xs">
                Atelier de traitement de surface en Bretagne.
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground">Procédés</p>
              <ul className="space-y-1.5">
                {Object.entries(SITE_PROCEDES).map(([id, p]) => (
                  <li key={id}>
                    <Link href={`/procedes/${id}`} className="hover:text-accent">
                      {p.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground">Contact</p>
              <p>
                <Link href="/contact" className="hover:text-accent">
                  Nous contacter
                </Link>
              </p>
            </div>
          </div>
          <p className="mt-8 border-t border-line pt-6 text-xs">
            © {new Date().getFullYear()} HPR. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
