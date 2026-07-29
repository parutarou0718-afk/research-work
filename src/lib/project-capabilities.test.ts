import { describe, expect, it } from "vitest"
import type { PandaWikiVirtualProject } from "@/domain/projects"
import {
  isPandaWikiChatSettingsAvailable,
  isViewAvailable,
  usesPandaWikiChatSurface,
} from "./project-capabilities"

const remote: PandaWikiVirtualProject = {
  id: "pandawiki:server:kb-1",
  source: "pandawiki",
  name: "Remote KB",
  connectionId: "server",
  knowledgeBaseId: "kb-1",
  scopeKey: "server:kb-1",
  capabilities: {
    readKnowledge: true, search: false, chat: false, editNode: false,
    upload: false, conversationHistory: false, graph: false, filesystem: false,
  },
}

describe("project capability policy", () => {
  it("keeps settings and plugins available for remote projects", () => {
    expect(isViewAvailable(remote, "settings")).toBe(true)
    expect(isViewAvailable(remote, "plugin")).toBe(true)
  })

  it("hides filesystem-only views for remote projects", () => {
    expect(isViewAvailable(remote, "sources")).toBe(false)
    expect(isViewAvailable(remote, "graph")).toBe(false)
    expect(isViewAvailable(remote, "review")).toBe(false)
  })

  it("routes a chat-capable PandaWiki project to the remote chat surface", () => {
    const chatProject: PandaWikiVirtualProject = {
      ...remote,
      capabilities: { ...remote.capabilities, chat: true },
    }

    expect(usesPandaWikiChatSurface(chatProject)).toBe(true)
    expect(usesPandaWikiChatSurface(remote)).toBe(false)
  })

  it("shows PandaWiki chat configuration only for remote projects", () => {
    expect(isPandaWikiChatSettingsAvailable(remote)).toBe(true)
    expect(isPandaWikiChatSettingsAvailable(null)).toBe(false)
  })
})
