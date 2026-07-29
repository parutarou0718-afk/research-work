export interface DocumentDTO {
  id: string
  kb_id: string
  name: string
  status: string
  updated_at: string
}

export interface UploadStatusDTO {
  status: string
}

/** Authenticated object upload response from /api/v1/file/upload. */
export interface PandaWikiObjectUploadDTO {
  key: string
  filename: string
}

/** The recursive parser response is intentionally kept as a transport shape. */
export interface PandaWikiCrawlerChildDTO {
  value?: {
    id?: string
    title?: string
    file?: boolean
    file_type?: string
  }
  children?: PandaWikiCrawlerChildDTO[]
}

export interface PandaWikiCrawlerParseDTO {
  id: string
  docs: PandaWikiCrawlerChildDTO
}

export interface PandaWikiCrawlerExportDTO {
  task_id: string
}

export interface PandaWikiCrawlerResultDTO {
  status: string
  content?: string
}

export interface PandaWikiNodeCreateDTO {
  id: string
}
