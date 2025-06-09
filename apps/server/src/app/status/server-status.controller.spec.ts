import { Test, TestingModule } from '@nestjs/testing'
import { ServerStatusController } from './server-status.controller'

describe('ServerStatusController', () => {
  let controller: ServerStatusController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServerStatusController]
    }).compile()

    controller = module.get<ServerStatusController>(ServerStatusController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
