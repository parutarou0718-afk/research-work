import type { ConversationChunk, ConversationModel } from "@/types/wiki"
import type { ConversationDTO, StreamChunkDTO } from "../dto/ConversationDTO"

export function mapConversationDto(dto: ConversationDTO): ConversationModel {
  return {
    id: dto.id,
    knowledgeBaseId: dto.kb_id,
    title: dto.subject,
    updatedAt: dto.updated_at,
  }
}

export function fromStreamChunk(dto: StreamChunkDTO): ConversationChunk {
  return {
    conversationId: dto.conversation_id,
    content: dto.content,
    done: dto.done,
  }
}
