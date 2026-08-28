import { ProcedeId, SecteurId } from "@/lib/constants";

export type Verdict = "publier" | "peut_etre" | "eviter";
export type ThemeId =
  | "thermolaquage"
  | "sablage"
  | "vaporblasting"
  | "cerakote"
  | "restauration_vehicule"
  | "pieces_aero"
  | "finition_luxe"
  | "vie_atelier"
  | "avant_apres";
export type PlatformId =
  | "linkedin_industrie"
  | "linkedin_aero"
  | "linkedin_luxe"
  | "instagram"
  | "facebook"
  | "youtube";
export type UsageId =
  | "instagram_facebook"
  | "linkedin_industrie"
  | "linkedin_aero"
  | "linkedin_luxe"
  | "site_vignette"
  | "site_realisation";
export type RetoucheIssue =
  | "cadrage"
  | "exposition"
  | "nettete"
  | "fond"
  | "bruit"
  | "contraste"
  | "couleur"
  | "reflet";
export type SiteTypeId = "vignette" | "realisation" | "aucun";
export type EtapeId = "avant" | "preparation" | "pendant" | "apres" | "atelier" | "indetermine";
export type TypeVueId =
  | "piece_entiere"
  | "detail_matiere"
  | "machine_procede"
  | "operateur"
  | "atelier"
  | "avant_apres"
  | "autre";
export type RisqueId =
  | "client_identifiable"
  | "plaque_immatriculation"
  | "visage"
  | "document_confidentiel"
  | "marque_tiers"
  | "securite_atelier"
  | "environnement_devalorisant"
  | "aucun";

export interface PhotoAnalysis {
  theme: ThemeId;
  scores: Record<string, number>;
  verdict: Verdict;
  plateformes: PlatformId[];
  retouche: { niveau: "vert" | "orange" | "rouge"; problemes: RetoucheIssue[] };
  legende: string;
  raison: string;
  piece: string | null;
  lecture: {
    secteur: SecteurId | "indetermine";
    etape: EtapeId;
    type_vue: TypeVueId;
    transformation_visible: boolean;
    preuve_savoir_faire: string | null;
    risques: RisqueId[];
  };
  scores_usage: Record<UsageId, number>;
  recommandation: { meilleur_usage: UsageId; angle_editorial: string; role_dans_serie: string };
  site: { procede: ProcedeId | null; type_site: SiteTypeId; raison_site: string };
  score_global: number;
}

export interface Photo {
  id: string;
  name: string;
  lastModified: number;
  captureDate: number | null;
  dateSource: "exif" | "fichier";
  importOrder: number;
  dataUrl: string;
  base64: string;
  mediaType: string;
  status: "pending" | "analyzing" | "done" | "error";
  error: string | null;
  analysis: PhotoAnalysis | null;
}

export type StorablePhoto = Omit<Photo, "base64">;

export interface PhotoGroup {
  key: string;
  day: string;
  theme: ThemeId;
  pieceLabel: string | null;
  photos: Photo[];
}

// Regroupement d'une même pièce à travers plusieurs dates (contrairement à PhotoGroup,
// limité à une seule journée) — sert à composer des avant/après.
export interface ProjectGroup {
  key: string;
  pieceLabel: string;
  theme: ThemeId;
  photos: Photo[];
  firstDay: string;
  lastDay: string;
}

export interface GroupPost {
  texte: string;
  hashtags: string[];
}

export type GroupPostsState =
  | { status: "idle"; posts: null }
  | { status: "loading"; posts: null }
  | { status: "error"; posts: null }
  | { status: "done"; posts: Record<string, GroupPost> };
