import { describe, expect, it } from "vitest"
import { validateProviderLoginInput } from "./ProviderLogin"

describe("ProviderLogin validation", () => {
  it("requires a valid server URL, account, and password before submitting", () => {
    expect(validateProviderLoginInput({ serverUrl: "", account: "alice", password: "password" })).toBe("Server address is required")
    expect(validateProviderLoginInput({ serverUrl: "not a url", account: "alice", password: "password" })).toBe("Server address must be an http or https URL")
    expect(validateProviderLoginInput({ serverUrl: "https://wiki.example", account: "", password: "password" })).toBe("Account is required")
    expect(validateProviderLoginInput({ serverUrl: "https://wiki.example", account: "alice", password: "" })).toBe("Password is required")
  })

  it("accepts a complete login request", () => {
    expect(validateProviderLoginInput({ serverUrl: "https://wiki.example", account: "alice", password: "password" })).toBeNull()
  })
})
