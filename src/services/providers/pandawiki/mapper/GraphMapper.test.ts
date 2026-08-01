import { describe, expect, it } from "vitest"
import { mapEntityDto } from "./GraphMapper"

describe("mapEntityDto", () => {
  it("preserves the optional server entity summary", () => {
    expect(mapEntityDto({
      id: "entity-1",
      name: "Rint Sybesma",
      type: "person",
      summary: "该实体的摘要仅由服务器在可见来源范围内提供。",
      attributes: { affiliation: "Leiden University" },
    })).toEqual({
      id: "entity-1",
      name: "Rint Sybesma",
      type: "person",
      summary: "该实体的摘要仅由服务器在可见来源范围内提供。",
      attributes: { affiliation: "Leiden University" },
    })
  })

  it("keeps an empty server summary optional for the inspector empty state", () => {
    expect(mapEntityDto({ id: "entity-1", name: "Rint Sybesma", type: "person", summary: "" })).toEqual({
      id: "entity-1",
      name: "Rint Sybesma",
      type: "person",
      summary: "",
      attributes: {},
    })
  })
})
