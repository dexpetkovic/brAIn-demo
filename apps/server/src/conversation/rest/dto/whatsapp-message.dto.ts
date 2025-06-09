export class WhatsappMessageKeyDto {
  id!: string
  fromMe?: boolean
  remoteJid?: string
}

export class WhatsappExtendedTextMessageDto {
  text!: string
}

export class WhatsappMessageDto {
  id!: string
  remoteJid!: string
  key!: WhatsappMessageKeyDto
  message?: {
    conversation?: string
    extendedTextMessage?: WhatsappExtendedTextMessageDto
  }
  messageTimestamp?: {
    low: number
    high: number
    unsigned: boolean
  }
  status?: number
  labels?: string[]
  userReceipt?: string[]
  reactions?: string[]
  pollUpdates?: string[]
  eventResponses?: string[]
  statusMentions?: string[]
  messageAddOns?: string[]
  statusMentionSources?: string[]
  supportAiCitations?: string[]
  messageStubType?: string
  messageStubParameters?: string[]
}

export class WhatsappMessagesDto {
  data!: {
    messages: WhatsappMessageDto
  }
  event!: string
}
