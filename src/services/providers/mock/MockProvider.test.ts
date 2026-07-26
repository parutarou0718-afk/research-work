import { describe, expect, it } from "vitest"
import { createMockProvider, streamMockConversation } from "./MockProvider"

describe("MockProvider", () => {
  it("serves deterministic knowledge bases, a nested tree, and node content", async () => {
    const provider = createMockProvider()

    await provider.lifecycle.initialize()
    const knowledgeBases = await provider.knowledge.listKnowledgeBases()
    const tree = await provider.knowledge.getNodeTree()
    const node = await provider.knowledge.getNode("mock-node-methods")

    expect(provider.type).toBe("mock")
    expect(knowledgeBases).toHaveLength(3)
    expect(tree.roots[0]?.children[0]?.id).toBe("mock-node-methods")
    expect(node.content).toContain("Methods")

    await provider.lifecycle.dispose()
  })

  it("provides a finite mock conversation stream for later provider tests", async () => {
    const chunks = []
    for await (const chunk of streamMockConversation("mock-conversation-1")) {
      chunks.push(chunk)
    }

    expect(chunks.map((chunk) => chunk.content).join("")).toContain("mock")
    expect(chunks[chunks.length - 1]?.done).toBe(true)
  })
})
