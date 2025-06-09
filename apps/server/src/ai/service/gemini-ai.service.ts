import { Injectable, Logger } from '@nestjs/common'
import { AppConfigService } from '../../app-config/app-config.service'

import {
  FunctionCallingConfigMode,
  GenerateContentResponse,
  GoogleGenAI,
  mcpToTool
} from '@google/genai'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'

const DEFAULT_PERSONA_DESCRIPTION = `
  You are a helpful and concise AI assistant serving as Customer Support Agent, replying in a WhatsApp chat. 

  NEVER ASK THE USER FOR THEIR USER ID.
  You will always get the userId in system instruction. Use that userId to query MCP client to get the user's data.

  Use list-memories from memory MCP client to get the user's data.
  Use create-memory from memory MCP client to create a new memory for the user. Infer the title from the message. Extract the content from the message. Extract the tags from the message.
  Use update-memory from memory MCP client to update a memory for the user.

  Do not use Markdown formatting. Keep your answers short, friendly, and easy to read. 
  If your response is longer than 3 lines, split it into multiple messages using \\n every 3 lines. 
  Each \\n means a new WhatsApp message. Avoid long paragraphs or unnecessary explanations.
  
  You are allowed to use emojis and emoticons to make your responses more engaging and friendly.
  Please use them when appropriate and do not use any emojis that may be considered offensive or inappropriate.

  You are allowed to use bullet points and lists to make your responses more readable.
  Please use them when appropriate and do not use any bullet points that may be considered offensive or inappropriate.

  You are allowed to use bold and italic text to make your responses more readable.
  Please use them when appropriate and do not use any bold or italic text that may be considered offensive or inappropriate.
  
  You are allowed to use links to make your responses more informative.
  Please use them when appropriate and do not use any links that may be considered offensive or inappropriate.
  
  You are allowed to use images to make your responses more engaging.
  Please use them when appropriate and do not use any images that may be considered offensive or inappropriate.

  Instead of saying "I'm having trouble processing that request with my AI brain. Please try again later."
  Say what exactly went wrong from your side.
  `

export type GeminiContentResponse = {
  parts: { text?: string }[]
  role: string
}

// Helper to extract concatenated text from all candidates/parts
export function extractGeminiResponseText(
  response: GenerateContentResponse
): string {
  if (!response?.candidates?.length) return ''
  return response.candidates
    .map(
      (candidate) =>
        candidate.content?.parts?.map((part) => part.text || '').join('\n') ||
        ''
    )
    .join('\n')
}

@Injectable()
export class GeminiAiService {
  private readonly logger = new Logger(GeminiAiService.name)
  private readonly geminiApiKey: string
  private readonly personaDescription: string
  private readonly genAI: GoogleGenAI | undefined
  private readonly memoryClient: Client

  constructor(private appConfigService: AppConfigService) {
    const config = this.appConfigService.getConfig()
    this.geminiApiKey = config.GEMINI_API_KEY
    this.personaDescription = DEFAULT_PERSONA_DESCRIPTION
    this.genAI = this.geminiApiKey
      ? new GoogleGenAI({ apiKey: this.geminiApiKey })
      : undefined

    this.memoryClient = new Client({
      name: 'brAIn Memory MCP Client',
      version: '1.0.0'
    })
  }

  async connectMemoryClient() {
    const transport = new SSEClientTransport(
      new URL(`${this.appConfigService.getConfig().BASE_URL}/sse`)
    )
    await this.memoryClient.connect(transport)
    this.logger.log('brAIn memory MCP client connected')
  }

  getPersonaDescription(userId: string): string {
    return (
      this.personaDescription +
      `You are talking to user with the following userId. Use that userId to query MCP client 
       to get the user's data: ${userId}`
    )
  }

  async getGeminiResponse(
    userId: string,
    messageText: string,
    conversationHistory?: any[]
  ): Promise<string> {
    if (!this.geminiApiKey || !this.genAI) {
      this.logger.error('Gemini API key is not configured.')
      return "Sorry, I'm having trouble connecting to my brain right now. Please try again later."
    }

    // Reconnect memory client.
    // Should not be needed as the client is connected in the main.ts file
    await this.connectMemoryClient()

    try {
      const chat = this.genAI.chats.create({
        model: this.appConfigService.getConfig().GEMINI_MODEL,
        history: conversationHistory,
        config: {
          systemInstruction: this.getPersonaDescription(userId),
          tools: [mcpToTool(this.memoryClient)],
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.AUTO
            }
          }
        }
      })

      this.logger.log(
        `Sending prompt to Gemini (system persona active): ${messageText.slice(
          0,
          200
        )}...`
      )

      const result = await chat.sendMessage({ message: { text: messageText } })

      const extractedResponse = extractGeminiResponseText(result)

      if (extractedResponse) {
        return extractedResponse
      } else {
        this.logger.error(
          `Gemini API (@google/genai) returned an empty or unexpected response: ${JSON.stringify(
            result
          )}`
        )
        return 'I received an empty or unexpected response from Gemini. Please try again.'
      }
    } catch (e: any) {
      this.logger.error(`Error calling Gemini API with @google/genai: ${e}`)
      return "I'm having trouble processing that request with my AI brain. Please try again later."
    }
  }
}
