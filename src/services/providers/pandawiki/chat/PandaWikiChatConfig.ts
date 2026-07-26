import { load } from "@tauri-apps/plugin-store"

const STORE_NAME = "app-state.json"
const CONFIG_KEY = "pandaWikiChatConfig"

export interface PandaWikiChatConfig {
  endpointUrl: string
  model: string
  timeoutSeconds: number
  providerName: "pandawiki"
}

export const DEFAULT_PANDAWIKI_CHAT_CONFIG: PandaWikiChatConfig = {
  endpointUrl: "",
  model: "knowledge-base",
  timeoutSeconds: 90,
  providerName: "pandawiki",
}

function normalizeConfig(value: Partial<PandaWikiChatConfig> | null | undefined): PandaWikiChatConfig {
  const endpointUrl = typeof value?.endpointUrl === "string" ? value.endpointUrl.trim() : ""
  const model = typeof value?.model === "string" && value.model.trim()
    ? value.model.trim().slice(0, 120)
    : DEFAULT_PANDAWIKI_CHAT_CONFIG.model
  const timeoutSeconds = typeof value?.timeoutSeconds === "number" && Number.isFinite(value.timeoutSeconds)
    ? Math.min(120, Math.max(5, Math.round(value.timeoutSeconds)))
    : DEFAULT_PANDAWIKI_CHAT_CONFIG.timeoutSeconds
  return { endpointUrl, model, timeoutSeconds, providerName: "pandawiki" }
}

export function validatePandaWikiChatEndpoint(endpointUrl: string): string | null {
  try {
    const url = new URL(endpointUrl)
    if (url.protocol !== "https:" && url.protocol !== "http:") return "Endpoint must use HTTP or HTTPS."
    if (!url.pathname.endsWith("/chat/completions")) {
      return "Endpoint must be a complete OpenAI Chat Completions URL."
    }
    return null
  } catch {
    return "Enter a valid complete endpoint URL."
  }
}

export async function loadPandaWikiChatConfig(): Promise<PandaWikiChatConfig> {
  const store = await load(STORE_NAME, { autoSave: true, defaults: {} })
  return normalizeConfig(await store.get<Partial<PandaWikiChatConfig>>(CONFIG_KEY))
}

export async function savePandaWikiChatConfig(config: PandaWikiChatConfig): Promise<PandaWikiChatConfig> {
  const normalized = normalizeConfig(config)
  const endpointError = normalized.endpointUrl ? validatePandaWikiChatEndpoint(normalized.endpointUrl) : null
  if (endpointError) throw new Error(endpointError)
  const store = await load(STORE_NAME, { autoSave: true, defaults: {} })
  await store.set(CONFIG_KEY, normalized)
  await store.save()
  return normalized
}

export const __pandaWikiChatConfigTest = { normalizeConfig }
