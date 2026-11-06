// Model provider for the Story-Keeper. Azure OpenAI (Foundry) is used when its three settings are present,
// otherwise Anthropic when ANTHROPIC_API_KEY is set, otherwise there is no model and the fixed template wording is used.
// Only the observation numbers and the instructions are sent. Never the child's name, audio or video.

export type LlmConfig =
  | { provider: "azure"; endpoint: string; apiKey: string; draftModel: string; criticModel: string }
  | { provider: "anthropic"; apiKey: string; draftModel: string; criticModel: string };

export type Role = "draft" | "critic";

export function llmConfig(env: Record<string, string | undefined> = process.env): LlmConfig | null {
  const endpoint = env.AZURE_OPENAI_ENDPOINT?.trim().replace(/\/+$/, "");
  const azureKey = env.AZURE_OPENAI_API_KEY?.trim();
  const deployment = env.AZURE_OPENAI_DEPLOYMENT?.trim();
  if (endpoint && azureKey && deployment) {
    // On Azure the "model" is the name of your deployment. A cheaper second deployment can review the parent notes.
    return { provider: "azure", endpoint, apiKey: azureKey, draftModel: deployment, criticModel: env.AZURE_OPENAI_CRITIC_DEPLOYMENT?.trim() || deployment };
  }
  const key = env.ANTHROPIC_API_KEY?.trim();
  if (key) return { provider: "anthropic", apiKey: key, draftModel: env.KEEPER_MODEL || "claude-sonnet-5-5", criticModel: env.KEEPER_CRITIC_MODEL || "claude-haiku-5-5" };
  return null;
}

function parseJson(text: string): any {
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a < 0 || b < a) throw new Error("no json in reply");
  return JSON.parse(text.slice(a, b + 1));
}

export async function askModel(cfg: LlmConfig, role: Role, system: string, user: string, deadline: number, maxTokens: number): Promise<any> {
  const left = deadline - Date.now();
  if (left < 3000) throw new Error("time budget used up");
  const model = role === "critic" ? cfg.criticModel : cfg.draftModel;
  const signal = AbortSignal.timeout(Math.min(12_000, left));
  if (cfg.provider === "azure") {
    // Azure OpenAI v1 API: the deployment name goes in "model". Reasoning models spend part of the limit thinking, so leave headroom.
    const r = await fetch(`${cfg.endpoint}/openai/v1/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", "api-key": cfg.apiKey },
      body: JSON.stringify({
        model,
        max_completion_tokens: maxTokens * 4,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      }),
      signal,
    });
    if (!r.ok) throw new Error(`llm ${r.status}`);
    const data = await r.json();
    return parseJson(String(data?.choices?.[0]?.message?.content ?? ""));
  }
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": cfg.apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
    signal,
  });
  if (!r.ok) throw new Error(`llm ${r.status}`);
  const data = await r.json();
  return parseJson((data.content || []).map((c: any) => c.text || "").join(""));
}
