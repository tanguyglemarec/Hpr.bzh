import { NextRequest, NextResponse } from "next/server";

// Proxy minimal vers l'API Anthropic : la clé API ne doit jamais partir au
// navigateur, donc tout appel au modèle passe par cette route serverless.
// Le client envoie exactement { messages, max_tokens } (même forme que
// l'API Anthropic) ; on y ajoute la clé et le modèle côté serveur et on
// retransmet la réponse telle quelle.

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-5";
const MAX_TOKENS_CAP = 4000;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "server_misconfigured", message: "ANTHROPIC_API_KEY absente côté serveur." },
      { status: 500 },
    );
  }

  let body: { messages?: unknown; max_tokens?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "missing_messages" }, { status: 400 });
  }

  const maxTokens = Math.min(Number(body.max_tokens) || 1000, MAX_TOKENS_CAP);

  const upstream = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
      max_tokens: maxTokens,
      messages: body.messages,
    }),
  });

  const data = await upstream.json().catch(() => null);
  return NextResponse.json(data ?? { error: "upstream_invalid_response" }, { status: upstream.status });
}
