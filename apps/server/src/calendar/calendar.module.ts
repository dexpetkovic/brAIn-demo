import { Module } from '@nestjs/common'
import { CalendarMcpProvider } from './provider/calendar-mcp.provider'
import { CalendarMcpService } from './service/calendar-mcp.service'
import { AppConfigModule } from '../app-config/app-config.module'
import { ParseDateProvider } from './provider/parse-date.provider'

@Module({
  imports: [AppConfigModule],
  providers: [CalendarMcpProvider, CalendarMcpService, ParseDateProvider],
  exports: [CalendarMcpProvider, ParseDateProvider]
})
export class CalendarModule {}
