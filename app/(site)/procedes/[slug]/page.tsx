import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SITE_PROCEDES, PROCEDE_DESCRIPTIONS, ProcedeId } from "@/lib/constants";
import { getVignette, getRealisations } from "@/lib/realisations";

export function generateStaticParams() {
  return Object.keys(SITE_PROCEDES).map((slug) => ({ slug }));
}

function getMeta(slug: string) {
  return (SITE_PROCEDES as Record<string, { label: string; color: string }>)[slug];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const meta = getMeta(slug);
  return { title: meta?.label ?? "Procédé" };
}

export default async function ProcedePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug as ProcedeId;
  const meta = getMeta(slug);
  if (!meta) notFound();

  const vignette = getVignette(slug);
  const realisations = getRealisations(slug);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <Link href="/procedes" className="text-sm text-muted hover:text-accent">
        ← Tous les procédés
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className="h-3 w-3 rounded-full" style={{ background: meta.color }} />
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-wide sm:text-4xl">
          {meta.label}
        </h1>
      </div>
      <p className="mt-4 max-w-2xl text-muted">{PROCEDE_DESCRIPTIONS[slug]}</p>

      <div className="mt-10 relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-line bg-[#e9e5dc]">
        {vignette ? (
          <Image src={vignette.image} alt={vignette.alt} fill sizes="100vw" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            Photo de couverture à venir
          </div>
        )}
      </div>

      <h2 className="mt-14 font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-wide">
        Réalisations
      </h2>
      {realisations.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Aucune réalisation publiée pour ce procédé pour l&apos;instant.</p>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {realisations.map((r) => (
            <div key={r.id} className="overflow-hidden rounded-lg border border-line">
              <div className="relative aspect-square">
                <Image src={r.image} alt={r.alt} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" />
              </div>
              {r.legende && <p className="p-2.5 text-xs text-muted">{r.legende}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
