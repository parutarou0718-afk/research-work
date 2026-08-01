import { describe, expect, it } from "vitest"
import { DEFAULT_PLUGIN_EXPORT_PREFERENCES } from "./preferences"

describe("plugin export preferences", () => {
  it("defaults to portable report formats without a fixed folder", () => {
    expect(DEFAULT_PLUGIN_EXPORT_PREFERENCES.defaultDirectory).toBe("")
    expect(DEFAULT_PLUGIN_EXPORT_PREFERENCES.formats).toEqual(["docx", "pdf"])
  })
})
