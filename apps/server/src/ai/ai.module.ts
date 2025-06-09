import { Module } from '@nestjs/common'

import { GeminiAiService } from './service/gemini-ai.service'
import { AppConfigModule } from '../app-config/app-config.module'

@Module({
  imports: [AppConfigModule],
  providers: [GeminiAiService],
  controllers: [],
  exports: [GeminiAiService]
})
export class AiModule {}
