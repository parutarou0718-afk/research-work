export interface SessionStore {
  loadAccessToken(): Promise<string | null>
  saveAccessToken(token: string): Promise<void>
  clear(): Promise<void>
}

export function createMemorySessionStore(): SessionStore {
  let accessToken: string | null = null
  return {
    loadAccessToken: async () => accessToken,
    saveAccessToken: async (token) => { accessToken = token },
    clear: async () => { accessToken = null },
  }
}
