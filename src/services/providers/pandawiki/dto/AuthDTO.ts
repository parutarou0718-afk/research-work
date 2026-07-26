export interface LoginRequestDTO {
  account: string
  password: string
}

export interface LoginResponseDTO {
  token: string
}

export interface UserDTO {
  id: string
  account: string
  role: string
  is_token: boolean
  last_access?: string
  created_at: string
}
