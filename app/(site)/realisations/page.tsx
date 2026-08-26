import Image from "next/image";
import type { Metadata } from "next";
import { SITE_PROCEDES } from "@/lib/constants";
import { getAllRealisations } from "@/lib/realisations";

export const metadata: Metadata = { title: "Réalisations" };

export default function RealisationsPage() {
  const realisations = getAllRealisations();

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-wide sm:text-4xl">
        Réalisations
      </h1>
      <p className="mt-3 max-w-xl text-muted">Un aperçu de nos chantiers, tous procédés confondus.</p>

      {realisations.length === 0 ? (
        <p className="mt-10 text-sm text-muted">
          Aucune réalisation publiée pour l&apos;instant — revenez bientôt.
        </p>
      ) : (
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {realisations.map((r) => (
            <div key={r.id} className="overflow-hidden rounded-lg border border-line">
              <div className="relative aspect-square">
                <Image src={r.image} alt={r.alt} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span className="text-xs font-medium" style={{ color: SITE_PROCEDES[r.procede]?.color }}>
                  {SITE_PROCEDES[r.procede]?.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
