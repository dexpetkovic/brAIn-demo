import { Injectable } from '@nestjs/common'
import { MemoryMcpService } from '../service/memory-mcp.service'
import { z } from 'zod'
import { Tool } from '@rekog/mcp-nest'

@Injectable()
export class MemoryMcpProvider {
  constructor(private readonly memoryMcpService: MemoryMcpService) {}

  @Tool({
    name: 'list-memories',
    description:
      'Use this tool to get a list of memories for a given user. You will get the userId in system instruction.',
    parameters: z.object({
      userId: z.string()
    })
  })
  async listMemories({ userId }: { userId: string }) {
    const memories = await this.memoryMcpService.getMemories(userId)
    return {
      content: [
        {
          type: 'text',
          text: memories
            .map((memory) => `${memory.title}\n${memory.content}`)
            .join('\n\n')
        }
      ]
    }
  }

  @Tool({
    name: 'create-memory',
    description: 'Use this tool to create a new memory for a given user.',
    parameters: z.object({
      userId: z.string(),
      title: z.string(),
      content: z.string(),
      tags: z.array(z.string()).optional()
    })
  })
  async createMemory({
    userId,
    title,
    content,
    tags
  }: {
    userId: string
    title: string
    content: string
    tags: string[]
  }) {
    const memory = await this.memoryMcpService.createMemory(
      userId,
      title,
      content,
      tags
    )
    return {
      content: [
        {
          type: 'text',
          text: 'Memory created successfully. Summarise to user what you did.'
        }
      ]
    }
  }

  @Tool({
    name: 'update-memory',
    description:
      'Use this tool to update a memory for a given user. You will get the userId in system instruction.',
    parameters: z.object({
      userId: z.string(),
      newContent: z.string()
    })
  })
  async updateMemory({
    userId,
    newContent
  }: {
    userId: string
    newContent: string
  }) {
    const updated = await this.memoryMcpService.updateMemory(userId, newContent)
    return {
      content: [
        {
          type: 'text',
          text: updated
            ? 'Memory updated successfully. Summarise to user what you did.'
            : 'Failed to update memory. Please ask the user to try again.'
        }
      ]
    }
  }
}
