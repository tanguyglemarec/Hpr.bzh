import { USAGES } from "@/lib/tri/constants";
import { clampScore, extractJSON, formatDayFR } from "@/lib/tri/helpers";
import { GroupPost, Photo, PhotoAnalysis, PhotoGroup, UsageId } from "@/lib/tri/types";

type AnthropicContentBlock =
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "text"; text: string };

type AnthropicMessage = { role: "user"; content: AnthropicContentBlock[] };

async function callClaudeAPI(
  messages: AnthropicMessage[],
  maxTokens = 1000,
  attempt = 0,
): Promise<{ text: string; truncated: boolean }> {
  const response = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ max_tokens: maxTokens, messages }),
  });
  if (!response.ok) {
    // Sur volume, les erreurs 429 (rate limit) et 5xx (serveur surchargé) sont transitoires —
    // les rejouer automatiquement évite qu'un lot entier échoue juste parce que trop d'appels
    // sont partis en même temps. Backoff exponentiel + petit aléa pour ne pas re-cogner en chœur.
    const retryable = response.status === 429 || response.status >= 500;
    if (retryable && attempt < 3) {
      const delay = 800 * 2 ** attempt + Math.random() * 400;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return callClaudeAPI(messages, maxTokens, attempt + 1);
    }
    throw new Error(`api_${response.status}`);
  }
  const data = await response.json();
  const textBlock = (data.content || []).find((b: { type: string }) => b.type === "text");
  if (!textBlock) throw new Error("empty_response");
  return { text: textBlock.text as string, truncated: data.stop_reason === "max_tokens" };
}

const ANALYSIS_PROMPT = `Tu es à la fois directeur artistique, iconographe et responsable éditorial pour HPR, atelier de traitement de surface premium en Bretagne (sablage, microbillage, aérogommage, vaporblasting, thermolaquage, Cerakote, peinture liquide). Clients : aéronautique, horlogerie de luxe, restauration de véhicules de collection, industrie.

Analyse d'abord ce que montre objectivement la photo, puis évalue-la SÉPARÉMENT pour chaque canal. Une photo peut être excellente pour LinkedIn et faible pour Instagram ou pour le site. Ne compense jamais un mauvais cadrage par un sujet intéressant. N'invente ni procédé, ni secteur, ni certification.

Attention à ne jamais confondre thermolaquage et vaporblasting, deux procédés visuellement proches mais opposés dans leur résultat :
- Thermolaquage = peinture poudre cuite au four → la pièce ressort avec une COULEUR ajoutée (RAL, noir, blanc, teinte vive...), en finition mate, satinée ou brillante selon la poudre. Dès qu'une couleur non métallique recouvre la pièce, c'est du thermolaquage, jamais du vaporblasting — même si le rendu est mat.
- Vaporblasting = projection humide (eau + abrasif) qui décape et adoucit une surface → la pièce ressort en MÉTAL NU (alu, inox, laiton...), sans aucune couleur ajoutée, avec un aspect satiné/mat uniforme et souvent un léger reflet métallique humide. Si la surface montre encore la couleur naturelle du métal (gris alu, argenté, doré laiton...), c'est du vaporblasting ou un décapage (sablage/microbillage/aérogommage), jamais du thermolaquage.
En cas de doute persistant sur la surface seule, regarde le contexte (cabine de projection humide et pièce mouillée = vaporblasting ; cabine de peinture, four de cuisson, poudre, pistolet électrostatique = thermolaquage) avant de trancher.

Réponds UNIQUEMENT avec ce JSON, sans texte autour, sans balises markdown :
{
  "theme": "thermolaquage|sablage|vaporblasting|cerakote|restauration_vehicule|pieces_aero|finition_luxe|vie_atelier|avant_apres",
  "scores": {"authenticite":0-10,"qualite_visuelle":0-10,"contexte_pro":0-10,"potentiel_engagement":0-10,"coherence_marque":0-10},
  "verdict": "publier|peut_etre|eviter",
  "plateformes": ["linkedin_industrie ou linkedin_aero ou linkedin_luxe ou instagram ou facebook ou youtube, ..."],
  "retouche": {"niveau": "vert|orange|rouge", "problemes": ["cadrage|exposition|nettete|fond|bruit|contraste|couleur|reflet, ..."]},
  "legende": "légende courte en français, style direct, une phrase",
  "raison": "une phrase expliquant le verdict",
  "piece": "description courte et précise de la pièce/l'objet visible (3-6 mots) — ex: 'jante alliage 5 branches', 'culasse moteur 4 temps', 'garde-boue avant moto'. Assez spécifique pour distinguer deux pièces différentes du même type. Null si aucune pièce identifiable (vue d'atelier générale, détail abstrait...)",
  "lecture": {
    "secteur": "industrie|aeronautique|automobile_collection|moto|luxe_horlogerie|nautisme|autre|indetermine",
    "etape": "avant|preparation|pendant|apres|atelier|indetermine",
    "type_vue": "piece_entiere|detail_matiere|machine_procede|operateur|atelier|avant_apres|autre",
    "transformation_visible": true,
    "preuve_savoir_faire": "détail concret visible qui prouve le savoir-faire, ou null",
    "risques": ["client_identifiable|plaque_immatriculation|visage|document_confidentiel|marque_tiers|securite_atelier|environnement_devalorisant|aucun"]
  },
  "scores_usage": {
    "instagram_facebook": 0-10,
    "linkedin_industrie": 0-10,
    "linkedin_aero": 0-10,
    "linkedin_luxe": 0-10,
    "site_vignette": 0-10,
    "site_realisation": 0-10
  },
  "recommandation": {
    "meilleur_usage": "instagram_facebook|linkedin_industrie|linkedin_aero|linkedin_luxe|site_vignette|site_realisation",
    "angle_editorial": "angle précis à raconter sans inventer de fait",
    "role_dans_serie": "couverture|vue_ensemble|detail|preuve_procede|avant|apres|secondaire|a_ecarter"
  },
  "site": {
    "procede": "sablage|microbillage|aerogommage|vaporblasting|thermolaquage|cerakote|peinture_liquide ou null si aucun procédé n'est clairement identifiable sur la photo",
    "type_site": "vignette|realisation|aucun",
    "raison_site": "une phrase expliquant ce choix"
  }
}

Critères pour le champ "site" :
- "vignette" : photo iconique, propre, qui représente bien LE procédé en un coup d'œil — pour une page d'accueil avec un onglet/titre par procédé. Une seule vignette idéale par procédé, donc sois exigeant.
- "realisation" : photo d'un chantier ou d'une pièce finie qui illustre un résultat concret de ce procédé — pour la galerie de la page dédiée à ce procédé.
- "aucun" : photo pas assez qualitative, pas assez identifiable ou trop proche d'une image générique pour un usage site — même si elle peut convenir aux réseaux sociaux.
- Une vignette doit rester lisible en petit, accepter un recadrage horizontal et représenter immédiatement le procédé.
- Une réalisation doit montrer une pièce ou un résultat concret, avec une finition lisible et un environnement qui ne dévalorise pas le travail.

Barème des scores d'usage : 9-10 exceptionnel et immédiatement exploitable ; 7-8 bon ; 5-6 utile avec retouche ou contexte ; 3-4 faible ; 0-2 à écarter. Utilise toute l'échelle et sois exigeant.

Pour "piece" : décris l'objet physique précis, pas le contexte général. L'objectif est de pouvoir repérer si plusieurs photos montrent la même pièce physique (même chantier) ou des pièces différentes du même type.`;

async function fetchAnalysisJSON(photo: Photo): Promise<Partial<PhotoAnalysis> & Record<string, unknown>> {
  const message: AnthropicMessage = {
    role: "user",
    content: [
      { type: "image", source: { type: "base64", media_type: photo.mediaType, data: photo.base64 } },
      { type: "text", text: ANALYSIS_PROMPT },
    ],
  };
  let maxTokens = 2200;
  let lastError: unknown = new Error("empty_response");
  // La réponse (légendes + analyse détaillée) dépasse parfois le budget de tokens et arrive
  // tronquée, ce qui casse le JSON — indétectable autrement qu'en réessayant avec plus de marge.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { text, truncated } = await callClaudeAPI([message], maxTokens);
      if (truncated) throw new Error("truncated_response");
      return extractJSON<Partial<PhotoAnalysis> & Record<string, unknown>>(text);
    } catch (err) {
      lastError = err;
      maxTokens = 3600;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function analyzeOnePhoto(photo: Photo): Promise<PhotoAnalysis> {
  const json = await fetchAnalysisJSON(photo);
  const scores = (json.scores as Record<string, number>) || {};
  const vals = Object.values(scores).filter((v) => typeof v === "number");
  const score_global = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;

  const rawUsage = (json.scores_usage as Record<string, number>) || {};
  const scores_usage = Object.fromEntries(
    (Object.keys(USAGES) as UsageId[]).map((id) => [id, clampScore(rawUsage[id])]),
  ) as Record<UsageId, number>;

  const rawRecommandation = (json.recommandation as { meilleur_usage?: string; angle_editorial?: string; role_dans_serie?: string }) || {};
  const meilleur_usage = (rawRecommandation.meilleur_usage && rawRecommandation.meilleur_usage in USAGES
    ? rawRecommandation.meilleur_usage
    : (Object.entries(scores_usage).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "instagram_facebook")) as UsageId;

  const site = { ...(json.site as PhotoAnalysis["site"]) };
  if (!site.procede || Math.max(scores_usage.site_vignette, scores_usage.site_realisation) < 7) {
    site.type_site = "aucun";
    if (!site.procede) site.procede = null;
  } else if (site.type_site === "vignette" && scores_usage.site_vignette < 7 && scores_usage.site_realisation >= 7) {
    site.type_site = "realisation";
  }

  const plateformes = new Set((json.plateformes as PhotoAnalysis["plateformes"]) || []);
  if (scores_usage.instagram_facebook >= 7) {
    plateformes.add("instagram");
    plateformes.add("facebook");
  }
  (["linkedin_industrie", "linkedin_aero", "linkedin_luxe"] as const).forEach((id) => {
    if (scores_usage[id] >= 7) plateformes.add(id);
  });

  return {
    ...(json as PhotoAnalysis),
    plateformes: Array.from(plateformes),
    scores_usage,
    recommandation: { ...(json.recommandation as PhotoAnalysis["recommandation"]), meilleur_usage },
    site,
    score_global,
  };
}

function groupPromptText(day: string, count: number, platformsSet: string[], snippets: string[]): string {
  return `Tu écris des posts prêts à publier pour HPR, atelier de traitement de surface premium en Bretagne. Date : ${day}. ${count} photo(s) dans ce lot.
Style commun : direct, technique, sans blabla, "mode zéro bullshit" — phrases courtes, un vrai détail visible, pas de superlatifs creux. N'invente jamais une matière, une opération, un résultat, une norme, un client ou une certification.
Différenciation obligatoire :
- Instagram : impact visuel, matière, transformation et coulisses ; texte court, humain.
- Facebook : récit accessible, contexte local et résultat concret ; peu de jargon.
- LinkedIn Industrie : problème, procédé, contrainte et résultat observable.
- LinkedIn Aéro : précision, maîtrise du process et exigence ; aucune allégation réglementaire non fournie.
- LinkedIn Luxe : détail, régularité de finition et respect de la pièce.
- YouTube : description courte centrée sur ce que la séquence permet de voir.
Notes sur les photos du lot : ${snippets.join(" / ") || "aucune note"}

Génère un post pour CHACUNE de ces plateformes : ${platformsSet.join(", ")}.
Réponds UNIQUEMENT en JSON, sans texte autour, avec une clé par plateforme listée ci-dessus :
{
  "identifiant_plateforme": {"texte": "texte du post avec retours à la ligne", "hashtags": ["#...", "#..."]}
}`;
}

export async function generateGroupPostsFor(group: PhotoGroup): Promise<Record<string, GroupPost>> {
  const platformsSet = Array.from(new Set(group.photos.flatMap((p) => p.analysis?.plateformes || [])));
  if (!platformsSet.length) platformsSet.push("linkedin_industrie");
  const snippets = group.photos
    .slice(0, 6)
    .flatMap((p) => [p.analysis?.legende, p.analysis?.lecture?.preuve_savoir_faire, p.analysis?.recommandation?.angle_editorial])
    .filter((s): s is string => Boolean(s));
  const bestPhotos = [...group.photos]
    .sort((a, b) => (b.analysis?.score_global ?? 0) - (a.analysis?.score_global ?? 0))
    .slice(0, 3);

  const content: AnthropicContentBlock[] = [
    ...bestPhotos.map((p) => ({ type: "image" as const, source: { type: "base64" as const, media_type: p.mediaType, data: p.base64 } })),
    { type: "text", text: groupPromptText(formatDayFR(group.day), group.photos.length, platformsSet, snippets) },
  ];

  const { text } = await callClaudeAPI([{ role: "user", content }], 1000);
  return extractJSON<Record<string, GroupPost>>(text);
}
