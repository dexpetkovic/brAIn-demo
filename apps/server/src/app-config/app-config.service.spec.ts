import { Test, TestingModule } from '@nestjs/testing'
import { AppConfigService, EnvConfig } from './app-config.service'
import { ConfigService } from '@nestjs/config'

describe.skip('AppConfigService', () => {
  const mockConfigService: Pick<ConfigService, 'get'> = {
    get: jest.fn()
  }
  let service: AppConfigService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppConfigService]
    })
      .useMocker((token) => {
        if (token === ConfigService) {
          return mockConfigService
        }
      })
      .compile()
    service = module.get<AppConfigService>(AppConfigService)
  })
  it('should provide valid config to server', () => {
    const env: Partial<EnvConfig> = {
      PORT: 4000,
      DB_URL: 'postgres://someUrl:5432/db',
      LOG_LEVEL: 'log'
    }
    mockConfigService.get = jest
      .fn()
      .mockImplementation(
        (key: string): unknown => env[key as keyof typeof env]
      )
    expect(service.getConfig()).toEqual(env)
  })
})
