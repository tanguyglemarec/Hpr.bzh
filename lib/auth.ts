// Authentification minimale pour l'outil interne : un seul mot de passe
// partagé (ADMIN_PASSWORD), pas de compte utilisateur. Suffisant pour un
// outil d'équipe qui consomme une API payante et ne doit pas rester ouvert
// publiquement, sans le coût d'un vrai système d'auth.

export const ADMIN_COOKIE = "hpr_admin_session";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Le cookie ne contient jamais le mot de passe en clair : uniquement le hash
// attendu, recalculé côté serveur à chaque requête pour comparaison.
export async function expectedSessionValue(): Promise<string | null> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return sha256Hex(password);
}

export async function isAuthorized(cookieValue: string | undefined): Promise<boolean> {
  const expected = await expectedSessionValue();
  if (!expected) {
    // Pas de mot de passe configuré : on bloque en production, on laisse
    // passer en développement local pour ne pas gêner le travail sur l'outil.
    return process.env.NODE_ENV !== "production";
  }
  return cookieValue === expected;
}
