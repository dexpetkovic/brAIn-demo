import { Module, OnApplicationBootstrap, ValidationPipe } from '@nestjs/common'

import { AppConfigService } from '../app-config/app-config.service'
import { APP_GUARD, APP_PIPE } from '@nestjs/core'
import { ExpressAuthenticationGuard } from '../common/guards/authentication'
import { AppConfigModule } from '../app-config/app-config.module'
import { ServerStatusController } from './status/server-status.controller'
import { TypeOrmRootImport } from './module-imports/typeorm-root-import'

import { ConversationModule } from '../conversation/conversation.module'
import { AiModule } from '../ai/ai.module'
import { MemoryModule } from '../memory/memory.module'
import { CalendarModule } from '../calendar/calendar.module'

@Module({
  imports: [
    AppConfigModule,
    TypeOrmRootImport,
    ConversationModule,
    AiModule,
    MemoryModule,
    CalendarModule
  ],
  controllers: [ServerStatusController],
  providers: [
    AppConfigService,
    { provide: APP_GUARD, useClass: ExpressAuthenticationGuard },
    { provide: APP_PIPE, useClass: ValidationPipe }
  ],
  exports: [AppConfigService]
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private appConfigService: AppConfigService) {}

  onApplicationBootstrap() {}
}
