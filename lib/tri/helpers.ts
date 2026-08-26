import { USAGES } from "@/lib/tri/constants";
import { Photo, PhotoAnalysis, StorablePhoto, UsageId } from "@/lib/tri/types";

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
