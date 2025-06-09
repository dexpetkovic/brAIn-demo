import { Test, TestingModule } from '@nestjs/testing'
import { GeminiAiService } from './gemini-ai.service'
import { AppConfigService } from '../../app-config/app-config.service'
import { ConfigModule } from '@nestjs/config'

describe('GeminiAiService (integration)', () => {
  let service: GeminiAiService

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [GeminiAiService, AppConfigService]
    }).compile()

    service = module.get<GeminiAiService>(GeminiAiService)
  })

  it('should get a real response from Gemini', async () => {
    const prompt =
      "Save the memory to remind me tomorrow about my kid's public english class"
    const result = await service.getGeminiResponse('123', prompt)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
