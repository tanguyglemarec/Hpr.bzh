import {
  Crop, SunMedium, Focus, ImageOff, Waves, Contrast, Palette, Sun,
  Building2, Plane, Gem, Camera, Users, Video,
} from "lucide-react";
import { SITE_PROCEDES, SECTEURS } from "@/lib/constants";

export const COLORS = {
  void: "#131416",
  panel: "#1c1e22",
  panelRaised: "#24272c",
  line: "#33363d",
  textPrimary: "#eceae4",
  textMuted: "#8b8d93",
  accent: "#5b8a9e",
  vert: "#4a9b6e",
  orange: "#d99a3d",
  rouge: "#c85a4a",
} as const;

export const FONT_DISPLAY = "var(--font-display), sans-serif";
export const FONT_BODY = "var(--font-body), sans-serif";
export const FONT_MONO = "var(--font-mono), monospace";

export const THEMES = {
  thermolaquage: { label: "Thermolaquage", color: "#d98f2b" },
  sablage: { label: "Sablage", color: "#9a9ca3" },
  vaporblasting: { label: "Vaporblasting", color: "#5b8a9e" },
  cerakote: { label: "Cerakote", color: "#6ea3c9" },
  restauration_vehicule: { label: "Restauration véhicule", color: "#b5451b" },
  pieces_aero: { label: "Pièces aéro", color: "#6b7fd7" },
  finition_luxe: { label: "Finition luxe", color: "#c9a15a" },
  vie_atelier: { label: "Vie d'atelier", color: "#8a9481" },
  avant_apres: { label: "Avant / Après", color: "#4a9b6e" },
} as const;

export const PLATFORMS = {
  linkedin_industrie: { label: "LinkedIn · Industrie", icon: Building2, color: "#5b8a9e" },
  linkedin_aero: { label: "LinkedIn · Aéro", icon: Plane, color: "#6b7fd7" },
  linkedin_luxe: { label: "LinkedIn · Luxe", icon: Gem, color: "#c9a15a" },
  instagram: { label: "Instagram", icon: Camera, color: "#c9622a" },
  facebook: { label: "Facebook", icon: Users, color: "#4f7fb0" },
  youtube: { label: "YouTube", icon: Video, color: "#c85a4a" },
} as const;

export const RETOUCH_ISSUES = {
  cadrage: { label: "Cadrage", icon: Crop },
  exposition: { label: "Exposition", icon: SunMedium },
  nettete: { label: "Netteté", icon: Focus },
  fond: { label: "Fond", icon: ImageOff },
  bruit: { label: "Bruit", icon: Waves },
  contraste: { label: "Contraste", icon: Contrast },
  couleur: { label: "Balance couleur", icon: Palette },
  reflet: { label: "Reflet", icon: Sun },
} as const;

export const SITE_TYPES = {
  vignette: { label: "Vignette (accueil)" },
  realisation: { label: "Réalisation (galerie)" },
} as const;

export const VERDICT_META = {
  publier: { label: "PUBLIER", color: COLORS.vert },
  peut_etre: { label: "PEUT-ÊTRE", color: COLORS.orange },
  eviter: { label: "ÉVITER", color: COLORS.rouge },
} as const;

export const SCORE_LABELS: Record<string, string> = {
  authenticite: "Authenticité",
  qualite_visuelle: "Qualité visuelle",
  contexte_pro: "Contexte pro",
  potentiel_engagement: "Engagement",
  coherence_marque: "Cohérence marque",
};

export const USAGES = {
  instagram_facebook: { label: "Instagram / Facebook", short: "SOCIAL", color: "#d97849" },
  linkedin_industrie: { label: "LinkedIn · Industrie", short: "LI IND.", color: "#5b8a9e" },
  linkedin_aero: { label: "LinkedIn · Aéro", short: "LI AÉRO", color: "#6b7fd7" },
  linkedin_luxe: { label: "LinkedIn · Luxe", short: "LI LUXE", color: "#c9a15a" },
  site_vignette: { label: "Site · Vignette", short: "SITE HERO", color: "#4a9b6e" },
  site_realisation: { label: "Site · Réalisation", short: "SITE GAL.", color: "#72a987" },
} as const;

export { SITE_PROCEDES, SECTEURS };

export const ETAPES: Record<string, string> = {
  avant: "Avant traitement", preparation: "Préparation", pendant: "Procédé en cours",
  apres: "Résultat final", atelier: "Vie d'atelier", indetermine: "Étape indéterminée",
};

export const TYPES_VUE: Record<string, string> = {
  piece_entiere: "Pièce entière", detail_matiere: "Détail matière", machine_procede: "Machine / procédé",
  operateur: "Opérateur", atelier: "Vue d'atelier", avant_apres: "Avant / après", autre: "Autre",
};

export const RISQUES: Record<string, string> = {
  client_identifiable: "Client identifiable", plaque_immatriculation: "Plaque visible", visage: "Visage visible",
  document_confidentiel: "Document sensible", marque_tiers: "Marque tierce", securite_atelier: "Sécurité / EPI",
  environnement_devalorisant: "Environnement peu valorisant", aucun: "Aucun risque détecté",
};
