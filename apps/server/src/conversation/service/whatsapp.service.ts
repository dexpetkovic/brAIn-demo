import { Injectable, Logger } from '@nestjs/common'
import {
  GeminiAiService,
  GeminiContentResponse
} from '../../ai/service/gemini-ai.service'
import { ConversationService } from './conversation.service'
import axios from 'axios'
import { AppConfigService } from '../../app-config/app-config.service'
import { MessageEntity } from '../entity/message'
import { AxiosError } from 'axios'
import { WhatsappMessagesDto } from '../rest/dto/whatsapp-message.dto'

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name)

  constructor(
    private readonly geminiAiService: GeminiAiService,
    private readonly conversationService: ConversationService,
    private readonly appConfigService: AppConfigService
  ) {}

  public async handleWebhook(
    data: WhatsappMessagesDto
  ): Promise<{ status: string; message: string }> {
    try {
      if (
        data?.event === 'messages.upsert' &&
        data?.data &&
        data.data?.messages
      ) {
        const messageInfo = data.data.messages

        this.logger.log(
          'ReceivedmessageInfo:',
          JSON.stringify(messageInfo, null, 2)
        )
        // Ignore self-sent messages
        if (messageInfo?.key?.fromMe) {
          this.logger.log(`Ignoring self-sent message: ${messageInfo?.key?.id}`)
          return { status: 'success', message: 'Self-sent message ignored' }
        }
        const senderNumber = messageInfo?.key?.remoteJid ?? ''

        let incomingMessageText: string | undefined = undefined
        let messageType = 'unknown'

        // Extract message content
        if (messageInfo?.message) {
          const msgContentObj = messageInfo.message
          if ('conversation' in msgContentObj) {
            incomingMessageText = msgContentObj.conversation
            messageType = 'text'
          } else if (
            'extendedTextMessage' in msgContentObj &&
            msgContentObj.extendedTextMessage?.text
          ) {
            incomingMessageText = msgContentObj.extendedTextMessage.text
            messageType = 'text'
          }
        }

        if (messageInfo?.messageStubType) {
          const stubParams = messageInfo.messageStubParameters || []
          this.logger.log(
            `Received system message of type ${
              messageInfo.messageStubType
            } from ${senderNumber}. Stub params: ${JSON.stringify(stubParams)}`
          )
          return { status: 'success', message: 'System message processed' }
        }

        if (!senderNumber) {
          this.logger.warn(
            'Webhook received message without sender information.'
          )
          return { status: 'error', message: 'Incomplete sender data' }
        }

        // We will use the sender number as a key to store the conversation history
        const safeSenderId = senderNumber.replace(/[^a-zA-Z0-9]/g, '_')
        if (messageType === 'text' && incomingMessageText) {
          this.logger.log(
            `Processing text message from ${senderNumber} (${safeSenderId}): ${incomingMessageText}`
          )

          const conversationHistory =
            await this.conversationService.loadConversationHistory(safeSenderId)
          // Pass the history to Gemini to get a reply
          const geminiReply = await this.geminiAiService.getGeminiResponse(
            safeSenderId,
            incomingMessageText,
            this.mapWhatsappMessagesToGeminiHistory(conversationHistory)
          )

          if (geminiReply) {
            // Split the response into chunks and send them sequentially
            // const messageChunks =
            //   this.conversationService.splitMessage(geminiReply);
            const messageChunks = [geminiReply]
            for (let i = 0; i < messageChunks.length; i++) {
              const chunk = messageChunks[i] || ''
              if (!chunk) break

              const isSent = await this.sendWhatsappMessage(
                senderNumber,
                chunk,
                'text'
              )
              if (!isSent) {
                this.logger.error(
                  `Failed to send message chunk to ${senderNumber}`
                )
                break
              }

              if (i < messageChunks.length - 1) {
                const delay = Math.random() * (1.5 - 0.55) + 0.55
                await new Promise((resolve) =>
                  setTimeout(resolve, delay * 1000)
                )
              }
            }
            // Save the new exchange to history
            await this.conversationService.saveConversationHistory(
              safeSenderId,
              [
                {
                  sender: 'user',
                  userId: safeSenderId,
                  message: incomingMessageText,
                  messageStubType: 'text',
                  messageStubParameters: [],
                  receivedAt: new Date()
                },
                {
                  sender: 'model',
                  userId: safeSenderId,
                  message: geminiReply,
                  messageStubType: 'text',
                  messageStubParameters: [],
                  receivedAt: new Date()
                }
              ]
            )
          }
        } else if (incomingMessageText) {
          this.logger.log(
            `Received '${messageType}' message from ${senderNumber}. No text content. Full data: ${JSON.stringify(
              messageInfo
            )}`
          )
        } else if (messageType !== 'unknown') {
          this.logger.log(
            `Received '${messageType}' message from ${senderNumber}. No text content. Full data: ${JSON.stringify(
              messageInfo
            )}`
          )
        } else {
          this.logger.warn(
            `Received unhandled or incomplete message from ${senderNumber}. Data: ${JSON.stringify(
              messageInfo
            )}`
          )
        }
      } else if (data?.event) {
        this.logger.log(
          `Received event '${
            data.event
          }' which is not 'messages.upsert'. Data: ${JSON.stringify(data).slice(
            0,
            200
          )}`
        )
      }
      return { status: 'success', message: 'Webhook processed' }
    } catch (e: any) {
      this.logger.error(`Error processing webhook: ${e}`)
      return { status: 'error', message: 'Internal server error' }
    }
  }

  private async sendWhatsappMessage(
    recipientNumber: string,
    messageContent: string,
    messageType: string = 'text',
    mediaUrl?: string
  ): Promise<boolean> {
    const apiToken = this.appConfigService.getConfig().WASENDER_API_KEY
    const apiUrl = this.appConfigService.getConfig().WASENDER_API_URL

    // Sanitize recipient_number to remove "@s.whatsapp.net"
    const formattedRecipient = recipientNumber.includes('@s.whatsapp.net')
      ? recipientNumber.split('@')[0]
      : recipientNumber

    const payload: {
      to: string
      text?: string
      imageUrl?: string
      videoUrl?: string
      audioUrl?: string
      documentUrl?: string
    } = { to: formattedRecipient ?? '' }

    if (messageType === 'text') {
      payload.text = messageContent
    } else if (messageType === 'image' && mediaUrl) {
      payload.imageUrl = mediaUrl
      if (messageContent) payload.text = messageContent
    } else if (messageType === 'video' && mediaUrl) {
      payload.videoUrl = mediaUrl
      if (messageContent) payload.text = messageContent
    } else if (messageType === 'audio' && mediaUrl) {
      payload.audioUrl = mediaUrl
    } else if (messageType === 'document' && mediaUrl) {
      payload.documentUrl = mediaUrl
      if (messageContent) payload.text = messageContent
    } else {
      // The next line captures all cases of non-text messages
      if (messageType !== 'text') {
        this.logger.error(
          `Media URL is required for message type '${messageType}'.`
        )
        return false
      }
      this.logger.error(
        `Unsupported message type or missing content/media_url: ${messageType}`
      )
      return false
    }
    this.logger.debug(
      `Attempting to send WhatsApp message. Payload: ${JSON.stringify(payload)}`
    )
    try {
      const response = await axios.post(apiUrl, payload, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      })
      this.logger.log(
        `Message sent to ${recipientNumber}. Response: ${JSON.stringify(
          response.data
        )}`
      )
      return true
    } catch (e: unknown) {
      const err = e as AxiosError
      const statusCode = err.response?.status ?? 'N/A'
      const responseText =
        err.response?.data ?? err.response?.statusText ?? 'N/A'
      this.logger.error(
        `Error sending WhatsApp message to ${recipientNumber} (Status: ${statusCode}): ${err.message}. Response: ${JSON.stringify(
          responseText
        )}`
      )
      if (statusCode === 422) {
        this.logger.error(
          'WaSenderAPI 422 Error: This often means an issue with the payload (e.g., device_id, "to" format, or message content/URL). Check the payload logged above and WaSenderAPI docs.'
        )
      }
      return false
    }
  }

  mapWhatsappMessagesToGeminiHistory(
    messages: MessageEntity[]
  ): GeminiContentResponse[] {
    return messages.map((msg) => ({
      role: msg.sender,
      parts: [{ text: msg.message }]
    }))
  }
}
