import type { LoginRequestDTO, LoginResponseDTO, UserDTO } from "../dto/AuthDTO"
import { PandaWikiApiError, PandaWikiClient } from "./client"

export class PandaWikiAuthApi {
  constructor(private readonly client: PandaWikiClient) {}

  login(account: string, password: string): Promise<LoginResponseDTO> {
    const request: LoginRequestDTO = { account, password }
    return this.client.post<LoginResponseDTO>("/api/v1/user/login", request)
  }

  getCurrentUser(): Promise<UserDTO> {
    return this.client.get<UserDTO>("/api/v1/user")
  }

  async refreshToken(): Promise<string> {
    throw new PandaWikiApiError("invalid-response", 0)
  }
}
