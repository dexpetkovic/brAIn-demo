import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MemoryEntity } from './entity/memory.entity'
import { AppConfigModule } from '../app-config/app-config.module'
import { MemoryRepository } from './repository/memory.repository'
import { McpModule } from '@rekog/mcp-nest'
import { MemoryMcpProvider } from './provider/memory-mcp.provider'
import { MemoryMcpService } from './service/memory-mcp.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([MemoryEntity]),
    AppConfigModule,
    McpModule.forRoot({
      name: 'Memory MCP Server',
      version: '1.0.0'
    })
  ],
  providers: [MemoryRepository, MemoryMcpProvider, MemoryMcpService],
  controllers: [],
  exports: [MemoryRepository]
})
export class MemoryModule {}
