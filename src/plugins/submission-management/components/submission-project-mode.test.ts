import { describe, expect, it } from "vitest"
import { shouldUseManualSubmissionReference } from "./submission-project-mode"

describe("shouldUseManualSubmissionReference", () => {
  it("uses a manual paper reference for a PandaWiki project without a local path", () => {
    expect(shouldUseManualSubmissionReference({
      id: "pandawiki:server:kb",
      name: "Remote knowledge",
      source: "pandawiki",
      connectionId: "server",
      knowledgeBaseId: "kb",
      scopeKey: "pandawiki:server:kb",
    })).toBe(true)
  })

  it("keeps the local document picker for local projects", () => {
    expect(shouldUseManualSubmissionReference({
      id: "local-1",
      name: "Local project",
      source: "local",
      path: "C:/project",
    })).toBe(false)
  })
})
