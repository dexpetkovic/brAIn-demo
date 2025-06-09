import { Test, TestingModule } from '@nestjs/testing'
import { GeminiAiService } from './gemini-ai.service'
import { AppConfigService } from '../../app-config/app-config.service'

jest.mock('@modelcontextprotocol/sdk/client/index.js', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      connect: jest.fn()
    }))
  }
})

describe('GeminiAiService', () => {
  let service: GeminiAiService
  let mockGenAI: {
    chats: {
      create: () => {
        sendMessage: () => Promise<{
          candidates: { content: { parts: { text: string }[] } }[]
        }>
      }
    }
  }
  let mockAppConfig: {
    getConfig: () => { GEMINI_API_KEY: string; BASE_URL: string }
  }

  beforeEach(async () => {
    mockGenAI = {
      chats: {
        create: jest.fn().mockReturnValue({
          sendMessage: jest.fn().mockResolvedValue({
            candidates: [{ content: { parts: [{ text: 'Hello world!' }] } }]
          })
        })
      }
    }

    mockAppConfig = {
      getConfig: jest.fn().mockReturnValue({
        GEMINI_API_KEY: 'fake-key',
        BASE_URL: 'http://localhost'
      })
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiAiService,
        { provide: AppConfigService, useValue: mockAppConfig }
      ]
    })
      .overrideProvider(GeminiAiService)
      .useValue(new GeminiAiService(mockAppConfig as AppConfigService))
      .compile()

    service = module.get<GeminiAiService>(GeminiAiService)
    // Patch genAI directly for test
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ;(service as any).genAI = mockGenAI
  })

  it('should return extracted response', async () => {
    const result = await service.getGeminiResponse('123', 'Hi')
    expect(result).toBe('Hello world!')
  })

  it('should handle missing API key', async () => {
    // You can't access or modify a private property directly in your test.
    // So we use a type assertion to any to bypass TypeScript's access control:
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ;(service as unknown as any).geminiApiKey = undefined
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ;(service as unknown as any).genAI = undefined
    const result = await service.getGeminiResponse('123', 'Hi')
    expect(result).toMatch(/API key issue/)
  })

  it('should handle error from sendMessage', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ;(service as any).genAI.chats.create = jest.fn().mockReturnValue({
      sendMessage: jest.fn().mockRejectedValue(new Error('fail'))
    })
    const result = await service.getGeminiResponse('123', 'Hi')
    expect(result).toMatch(/trouble processing/)
  })
})
