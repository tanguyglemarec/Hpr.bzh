import realisationsData from "@/data/realisations.json";
import { ProcedeId } from "@/lib/constants";

export type RealisationEntry = {
  id: string;
  procede: ProcedeId;
  type: "vignette" | "realisation";
  image: string; // chemin sous /public, ex: /images/realisations/thermolaquage-1.jpg
  alt: string;
  legende?: string;
};

const ALL: RealisationEntry[] = realisationsData as RealisationEntry[];

export function getVignette(procede: ProcedeId): RealisationEntry | undefined {
  return ALL.find((r) => r.procede === procede && r.type === "vignette");
}

export function getRealisations(procede: ProcedeId): RealisationEntry[] {
  return ALL.filter((r) => r.procede === procede && r.type === "realisation");
}

export function getAllRealisations(): RealisationEntry[] {
  return ALL.filter((r) => r.type === "realisation");
}
