import type { AuthSession, LoginInput } from "@/types/wiki"

export interface AuthProvider {
  login(credentials: LoginInput): Promise<AuthSession>
  logout(): Promise<void>
  refreshToken(): Promise<string>
  getSession(): AuthSession | null
}
