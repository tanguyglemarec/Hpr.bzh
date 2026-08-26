# HPR.bzh

Site vitrine HPR (atelier de traitement de surface, Bretagne) + outil interne
de tri et de préparation des photos de production.

## Structure

- `app/(site)` — site public : accueil, `/procedes`, `/procedes/[slug]`,
  `/realisations`, `/contact`.
- `app/outils/tri` — outil interne de tri photo (analyse IA, génération de
  posts réseaux sociaux, sélection des visuels pour le site). Protégé par un
  mot de passe partagé, voir plus bas.
- `app/api/claude` — proxy serverless vers l'API Anthropic : c'est la seule
  route qui détient la clé API, jamais exposée au navigateur.
- `app/api/login` — pose le cookie de session de l'outil interne après
  vérification du mot de passe.
- `proxy.ts` (middleware) — protège `/outils/*` et `/api/claude` derrière le
  mot de passe.
- `lib/tri` — logique de l'outil de tri (constantes métier, EXIF, stockage
  IndexedDB, appels IA).
- `lib/constants.ts`, `lib/realisations.ts` — vocabulaire métier et données
  des réalisations, partagés entre le site et l'outil.
- `data/realisations.json` — manifeste des photos publiées sur le site (voir
  « Alimenter les réalisations du site » ci-dessous).

## Variables d'environnement

Copier `.env.example` en `.env.local` et renseigner :

- `ANTHROPIC_API_KEY` — obligatoire pour que l'outil de tri fonctionne.
- `ANTHROPIC_MODEL` — optionnel, modèle Claude utilisé (défaut :
  `claude-sonnet-5`).
- `ADMIN_PASSWORD` — mot de passe partagé pour accéder à `/outils`. Sans
  cette variable, l'accès est bloqué en production (autorisé en local pour
  ne pas gêner le développement).

## Développement local

```bash
npm install
npm run dev
```

Le site est sur `http://localhost:3000`, l'outil de tri sur
`http://localhost:3000/outils/tri`.

## Utilisation sur Mac + iPad, sans hébergement

Pas besoin de déployer sur Vercel/Netlify pour utiliser l'outil de tri : il
peut tourner directement sur un Mac et être utilisé depuis l'iPad, tant que
les deux appareils sont sur le même réseau Wi-Fi. L'analyse IA a toujours
besoin d'internet (elle appelle l'API Claude), mais rien n'a besoin d'être
mis en ligne publiquement.

1. Sur le Mac, une seule fois :
   ```bash
   npm install
   cp .env.example .env.local
   # puis renseigner ANTHROPIC_API_KEY et ADMIN_PASSWORD dans .env.local
   npm run build
   ```
2. Pour démarrer (à chaque session de travail) :
   ```bash
   npm run start:lan
   ```
   (`start:lan` sert la version optimisée buildée à l'étape précédente — plus
   stable pour un usage répété que `dev:lan`, qui recompile à la volée et
   convient surtout pour tester des modifications de code.)
3. Trouver l'adresse IP locale du Mac : réglages Wi-Fi → Détails → adresse IP,
   ou dans le Terminal :
   ```bash
   ipconfig getifaddr en0
   ```
4. Sur l'iPad, dans Safari (même Wi-Fi) : ouvrir
   `http://<adresse-ip-du-mac>:3000/outils/tri`, se connecter avec le mot de
   passe (`ADMIN_PASSWORD`).
5. Toucher l'icône de partage puis « Sur l'écran d'accueil » : l'outil
   s'ouvre ensuite en plein écran, avec sa propre icône, comme une vraie
   appli.

À la première connexion, macOS peut demander d'autoriser les connexions
entrantes pour Node — accepter. Si l'iPad ne voit pas le Mac, vérifier que le
réseau Wi-Fi n'isole pas les appareils entre eux (fréquent sur certains
réseaux d'entreprise ou invités).

## Déploiement (Vercel ou Netlify)

Le projet est un Next.js standard (App Router) : `app/api/claude` et
`app/api/login` se déploient automatiquement comme fonctions serverless sur
Vercel et Netlify, sans configuration supplémentaire.

1. Connecter le dépôt sur Vercel ou Netlify.
2. Renseigner les variables d'environnement (`ANTHROPIC_API_KEY`,
   `ANTHROPIC_MODEL` si besoin, `ADMIN_PASSWORD`) dans les réglages du
   projet.
3. Déployer — build command `next build`, pas de configuration
   supplémentaire nécessaire.

## Alimenter les réalisations du site

1. Utiliser l'outil `/outils/tri` pour analyser un lot de photos, puis
   l'onglet « Site » pour choisir une vignette et des réalisations par
   procédé.
2. Télécharger la sélection (bouton « Télécharger la sélection ») : les
   fichiers sont nommés `site-<procede>-<type>.jpg`.
3. Déposer ces fichiers dans `public/images/realisations/`.
4. Ajouter une entrée correspondante dans `data/realisations.json` :

```json
{
  "id": "thermolaquage-1",
  "procede": "thermolaquage",
  "type": "realisation",
  "image": "/images/realisations/site-thermolaquage-realisation-1.jpg",
  "alt": "Description courte pour l'accessibilité",
  "legende": "Légende optionnelle affichée sous la photo"
}
```

`type` vaut `"vignette"` (une seule par procédé, page d'accueil) ou
`"realisation"` (plusieurs, galerie de la page procédé).

## Notes de sécurité

- La clé Anthropic ne quitte jamais le serveur : le client appelle
  `/api/claude`, qui ajoute la clé et le modèle avant de relayer vers
  l'API Anthropic.
- `/outils` et `/api/claude` sont protégés par un mot de passe partagé
  (cookie de session signé par hash, pas de mot de passe en clair côté
  client). Pensé pour un usage d'équipe interne, pas pour des données
  sensibles à fort enjeu.
- Les photos importées dans l'outil de tri sont stockées uniquement dans
  l'IndexedDB du navigateur de la personne qui les importe (persistance
  locale, rien n'est envoyé à un serveur HPR).
