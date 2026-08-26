import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { SITE_PROCEDES, PROCEDE_DESCRIPTIONS, ProcedeId } from "@/lib/constants";
import { getVignette } from "@/lib/realisations";

export default function HomePage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">Bretagne</p>
          <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-6xl">
            Traitement de surface, précision d&apos;atelier.
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted sm:text-lg">
            Sablage, microbillage, aérogommage, vaporblasting, thermolaquage, Cerakote,
            peinture liquide — pour l&apos;industrie, l&apos;aéronautique, la restauration
            automobile et l&apos;horlogerie de luxe.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/realisations"
              className="inline-flex items-center gap-2 rounded bg-accent px-5 py-2.5 text-sm font-semibold text-white"
            >
              Voir nos réalisations <ArrowRight size={15} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded border border-line px-5 py-2.5 text-sm font-semibold text-foreground"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold uppercase tracking-wide">
            Nos procédés
          </h2>
          <Link href="/procedes" className="text-sm font-medium text-accent hover:underline">
            Tout voir
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(SITE_PROCEDES) as ProcedeId[]).map((id) => {
            const meta = SITE_PROCEDES[id];
            const vignette = getVignette(id);
            return (
              <Link
                key={id}
                href={`/procedes/${id}`}
                className="group overflow-hidden rounded-lg border border-line bg-panel transition-transform hover:-translate-y-0.5"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#e9e5dc]">
                  {vignette ? (
                    <Image
                      src={vignette.image}
                      alt={vignette.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted">
                      Photo à venir
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                    <span className="font-[family-name:var(--font-display)] text-base font-bold uppercase tracking-wide">
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted">{PROCEDE_DESCRIPTIONS[id]}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
