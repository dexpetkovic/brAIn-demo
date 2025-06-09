import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post
} from '@nestjs/common'
import { Protected } from '../../common/decorators/protected'
import { WhatsappMessagesDto } from './dto/whatsapp-message.dto'
import { WhatsappService } from '../service/whatsapp.service'

@Controller('whatsapp')
export class WhatsappController {
  constructor(private whatsappService: WhatsappService) {}

  @HttpCode(HttpStatus.CREATED)
  @Protected({ apiAccess: 'ALLOW' })
  @Post('webhook')
  public async webhook(@Body() data: WhatsappMessagesDto): Promise<{
    status: string
    message: string
  }> {
    return this.whatsappService.handleWebhook(data)
  }
}
