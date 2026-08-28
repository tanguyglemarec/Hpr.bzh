import { USAGES } from "@/lib/tri/constants";
import { EtapeId, Photo, PhotoAnalysis, ProjectGroup, StorablePhoto, UsageId } from "@/lib/tri/types";

// dataUrl contient déjà le base64 (data:image/jpeg;base64,XXXX) — pas la peine de
// dupliquer la donnée en stockage, ça divise quasiment par deux le volume sauvegardé.
export function photoToStorable(photo: Photo): StorablePhoto {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { base64, ...rest } = photo;
  return rest;
}

export function photoFromStorable(stored: StorablePhoto): Photo {
  return { ...stored, base64: stored.dataUrl ? stored.dataUrl.split(",")[1] : "" };
}

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDayFR(isoDay: string): string {
  const [y, m, d] = isoDay.split("-");
  return `${d}/${m}/${y}`;
}

export function extractJSON<T = unknown>(text: string): T {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("json_not_found");
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

const ANALYSIS_ERROR_LABELS: Record<string, string> = {
  api_401: "Clé API Anthropic invalide.",
  api_413: "Photo trop lourde pour l'API.",
  api_429: "Limite de débit API atteinte, réessaie plus tard.",
  empty_response: "Réponse vide du modèle.",
  json_not_found: "Réponse du modèle illisible (pas de JSON).",
  truncated_response: "Réponse du modèle tronquée.",
};

export function describeAnalysisError(err: unknown): string {
  const code = err instanceof Error ? err.message : String(err);
  return ANALYSIS_ERROR_LABELS[code] || (code.startsWith("api_") ? `Erreur API (${code.slice(4)})` : "Analyse échouée");
}

export function clampScore(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(10, Math.round(n * 10) / 10)) : 0;
}

export function bestUsageFor(analysis: PhotoAnalysis | null | undefined): UsageId | null {
  const entries = Object.entries(analysis?.scores_usage || {}).filter(([id]) => id in USAGES) as [
    UsageId,
    number,
  ][];
  if (!entries.length) return null;
  return entries.sort((a, b) => clampScore(b[1]) - clampScore(a[1]))[0][0];
}

export function photoEditorialScore(photo: Photo): number {
  const scores = Object.values(photo.analysis?.scores_usage || {}).map(clampScore);
  return scores.length ? Math.max(...scores) : photo.analysis?.score_global || 0;
}

const STOPWORDS = new Set(["de", "du", "la", "le", "les", "un", "une", "en", "avec", "sans", "avant", "apres"]);

export function normalizePieceKey(piece: string | null | undefined, fallback: string): string {
  if (!piece) return fallback;
  const words = piece
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .slice(0, 4);
  return words.join("-") || fallback;
}

const ETAPE_ORDER: Record<EtapeId, number> = {
  avant: 0, preparation: 1, pendant: 2, apres: 3, atelier: 4, indetermine: 5,
};

// Regroupe les photos par pièce identique (description normalisée), toutes dates confondues,
// pour composer des séries avant/après — contrairement aux "séries" du jour (voir PhotoTriApp),
// un projet peut s'étaler sur plusieurs jours (dépose, traitement, livraison).
export function buildProjectGroups(photos: Photo[]): ProjectGroup[] {
  const map = new Map<string, ProjectGroup>();
  photos
    .filter((p) => p.status === "done" && p.analysis && p.analysis.piece)
    .forEach((p) => {
      const pieceKey = normalizePieceKey(p.analysis!.piece, "");
      if (!pieceKey) return;
      const day = dayKey(p.captureDate || p.lastModified);
      if (!map.has(pieceKey)) {
        map.set(pieceKey, {
          key: pieceKey, pieceLabel: p.analysis!.piece as string, theme: p.analysis!.theme,
          photos: [], firstDay: day, lastDay: day,
        });
      }
      const group = map.get(pieceKey)!;
      group.photos.push(p);
      if (day < group.firstDay) group.firstDay = day;
      if (day > group.lastDay) group.lastDay = day;
    });

  return Array.from(map.values())
    .filter((g) => g.photos.length > 1)
    .map((g) => ({
      ...g,
      photos: [...g.photos].sort((a, b) => {
        const etapeA = ETAPE_ORDER[a.analysis!.lecture.etape] ?? ETAPE_ORDER.indetermine;
        const etapeB = ETAPE_ORDER[b.analysis!.lecture.etape] ?? ETAPE_ORDER.indetermine;
        if (etapeA !== etapeB) return etapeA - etapeB;
        return (a.captureDate || a.lastModified) - (b.captureDate || b.lastModified);
      }),
    }))
    .sort((a, b) => (a.lastDay < b.lastDay ? 1 : -1));
}

// Choisit la meilleure paire avant/après d'un projet : priorité à l'étape détectée par
// l'analyse IA, sinon aux extrémités de la chronologie (premier/dernier cliché).
export function pickBeforeAfter(photos: Photo[]): { before: Photo | null; after: Photo | null } {
  if (!photos.length) return { before: null, after: null };
  const before =
    photos.find((p) => p.analysis?.lecture.etape === "avant") ||
    photos.find((p) => p.analysis?.recommandation?.role_dans_serie === "avant") ||
    photos[0];
  const after =
    [...photos].reverse().find((p) => p.analysis?.lecture.etape === "apres") ||
    [...photos].reverse().find((p) => p.analysis?.recommandation?.role_dans_serie === "apres") ||
    photos[photos.length - 1];
  return { before, after: after.id === before.id ? null : after };
}
