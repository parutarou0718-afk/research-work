import { describe, expect, it } from "vitest"
import { buildQuickIdeaCaptureInput } from "./quick-idea-capture"

describe("quick idea capture", () => {
  it("turns one-line capture text into an idea capture input", () => {
    expect(buildQuickIdeaCaptureInput("  RLD may encode event-chain direction  ", new Date("2026-07-19T12:00:00Z"))).toEqual({
      title: "RLD may encode event-chain direction",
      content: "RLD may encode event-chain direction",
      tags: [],
      now: new Date("2026-07-19T12:00:00Z"),
    })
  })

  it("uses a compact title for long quick captures", () => {
    const input = buildQuickIdeaCaptureInput(
      "This is a much longer research thought about resultative complements, event chains, and possible semantic directionality.",
      new Date("2026-07-19T12:00:00Z"),
    )

    expect(input.title.length).toBeLessThanOrEqual(80)
    expect(input.title).toMatch(/\.\.\.$/)
    expect(input.title).toContain("resultative complements")
    expect(input.content).toContain("possible semantic directionality")
  })

  it("rejects empty quick captures", () => {
    expect(() => buildQuickIdeaCaptureInput("   \n  ")).toThrow("Quick capture text is required.")
  })
})
