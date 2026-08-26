// Vocabulaire métier partagé entre le site vitrine et l'outil de tri interne
// (repris de l'outil de tri photo pour rester cohérent entre les deux).

export const SITE_PROCEDES = {
  sablage: { label: 'Sablage', color: '#9a9ca3' },
  microbillage: { label: 'Microbillage', color: '#c2c6cc' },
  aerogommage: { label: 'Aérogommage', color: '#e8c07d' },
  vaporblasting: { label: 'Vaporblasting', color: '#5b8a9e' },
  thermolaquage: { label: 'Thermolaquage', color: '#d98f2b' },
  cerakote: { label: 'Cerakote', color: '#6ea3c9' },
  peinture_liquide: { label: 'Peinture liquide', color: '#8a7cc9' },
} as const;

export type ProcedeId = keyof typeof SITE_PROCEDES;

export const SECTEURS = {
  industrie: 'Industrie',
  aeronautique: 'Aéronautique',
  automobile_collection: 'Automobile de collection',
  moto: 'Moto',
  luxe_horlogerie: 'Luxe / Horlogerie',
  nautisme: 'Nautisme',
  autre: 'Autre',
} as const;

export type SecteurId = keyof typeof SECTEURS;

// Placeholder — une phrase courte et honnête par procédé, à remplacer par
// vos propres textes. Aucune allégation (norme, certification, délai...)
// n'a été inventée : uniquement une description du principe du procédé.
export const PROCEDE_DESCRIPTIONS: Record<ProcedeId, string> = {
  sablage: "Projection abrasive pour décaper une surface jusqu'au support sain, avant traitement ou finition.",
  microbillage: 'Projection de microbilles pour un décapage plus doux, sans attaquer la géométrie de la pièce.',
  aerogommage: 'Décapage par projection à basse pression, adapté aux surfaces et matières sensibles.',
  vaporblasting: "Traitement par projection humide, pour un rendu de surface fin et régulier.",
  thermolaquage: 'Application de peinture poudre cuite au four, pour une finition résistante et durable.',
  cerakote: 'Revêtement céramique appliqué en fine couche, pour la résistance et la précision de finition.',
  peinture_liquide: 'Application de peinture liquide, pour les finitions et teintes qui le nécessitent.',
};

// Secteurs mis en avant sur le site — reflète les usages identifiés par l'outil de tri.
export const SECTEURS_MIS_EN_AVANT: SecteurId[] = [
  'industrie',
  'aeronautique',
  'automobile_collection',
  'moto',
  'luxe_horlogerie',
  'nautisme',
];
