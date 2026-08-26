import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { SITE_PROCEDES, PROCEDE_DESCRIPTIONS, ProcedeId } from "@/lib/constants";
import { getVignette } from "@/lib/realisations";

export const metadata: Metadata = { title: "Procédés" };

export default function ProcedesIndexPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-wide sm:text-4xl">
        Nos procédés
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Sept procédés de traitement de surface, chacun adapté à une matière et un résultat recherché.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  <div className="flex h-full items-center justify-center text-xs text-muted">Photo à venir</div>
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
    </div>
  );
}
