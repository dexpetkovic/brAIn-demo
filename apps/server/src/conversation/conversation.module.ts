import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MessageEntity } from './entity/message'
import { AppConfigModule } from '../app-config/app-config.module'
import { WhatsappController } from './rest/whatsapp.controller'
import { ApiWhatsappAccessService } from './service/api-whatsapp-access.service'
import { WhatsappService } from './service/whatsapp.service'
import { ConversationService } from './service/conversation.service'
import { MessageRepository } from './repository/message.repository'
import { GeminiAiService } from '../ai/service/gemini-ai.service'

@Module({
  imports: [TypeOrmModule.forFeature([MessageEntity]), AppConfigModule],
  providers: [
    ApiWhatsappAccessService,
    WhatsappService,
    ConversationService,
    MessageRepository,
    GeminiAiService
  ],
  controllers: [WhatsappController],
  exports: [ApiWhatsappAccessService, WhatsappService]
})
export class ConversationModule {}
