import { Injectable, Logger } from '@nestjs/common'
import { MessageRepository } from '../repository/message.repository'
import { MessageEntity } from '../entity/message'

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name)

  constructor(private readonly messageRepository: MessageRepository) {}

  async loadConversationHistory(userId: string): Promise<MessageEntity[]> {
    try {
      const messages = await this.messageRepository.findByUserId(userId)
      return messages
    } catch (err: any) {
      this.logger.error(
        `Unexpected error loading history from DB for user ${userId}: ${err}`
      )
      return []
    }
  }

  async saveConversationHistory(
    userId: string,
    messages: Omit<MessageEntity, 'id'>[]
  ): Promise<void> {
    try {
      await this.messageRepository.saveAll(messages)
    } catch (err: any) {
      this.logger.error(
        `Error saving conversation history to DB for user ${userId}: ${err}`
      )
    }
  }

  splitMessage(text: string, maxLines = 5, maxCharsPerLine = 100): string[] {
    const lines: string[] = []
    for (const paragraph of text.split('\n')) {
      let line = ''
      for (const word of paragraph.split(' ')) {
        if ((line + (line ? ' ' : '') + word).length > maxCharsPerLine) {
          if (line) lines.push(line)
          line = word
        } else {
          line += (line ? ' ' : '') + word
        }
      }
      if (line) lines.push(line)
    }
    const chunks: string[] = []
    for (let i = 0; i < lines.length; i += maxLines) {
      chunks.push(lines.slice(i, i + maxLines).join('\n'))
    }
    return chunks
  }
}
