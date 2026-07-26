export interface ConversationDTO {
  id: string
  kb_id: string
  subject: string
  updated_at: string
}

export interface StreamChunkDTO {
  conversation_id: string
  content: string
  done: boolean
}
