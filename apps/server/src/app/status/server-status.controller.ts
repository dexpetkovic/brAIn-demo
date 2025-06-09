import { Controller, Get } from '@nestjs/common'

@Controller('status')
export class ServerStatusController {
  @Get()
  public check() {
    return {
      status: 'UP'
    }
  }
}
