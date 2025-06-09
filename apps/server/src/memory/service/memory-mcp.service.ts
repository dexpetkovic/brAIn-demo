import { Injectable } from '@nestjs/common'
import { MemoryRepository } from '../repository/memory.repository'
import { MemoryEntity } from '../entity/memory.entity'

@Injectable()
export class MemoryMcpService {
  constructor(private readonly memoryRepository: MemoryRepository) {}

  async createMemory(
    userId: string,
    title: string,
    content: string,
    tags?: string[]
  ) {
    const memory = new MemoryEntity()
    memory.userId = userId
    memory.title = title
    memory.content = content
    memory.tags = tags ?? []
    return this.memoryRepository.save(memory)
  }

  async getMemories(userId: string) {
    return this.memoryRepository.findByUserId(userId)
  }

  async updateMemory(id: string, newContent: string) {
    const memory = await this.memoryRepository.findOneById(id)
    if (!memory) return null
    memory.content = newContent
    return this.memoryRepository.save(memory)
  }
}
