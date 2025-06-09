import { Injectable } from '@nestjs/common'
import { TypeOrmBaseRepository } from '../../common/repo/type-orm-base-repository'
import { MemoryEntity } from '../entity/memory.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
export class MemoryRepository extends TypeOrmBaseRepository<
  MemoryEntity,
  'id'
> {
  constructor(@InjectRepository(MemoryEntity) repo: Repository<MemoryEntity>) {
    super(repo, 'id')
  }

  async findByUserId(userId: string): Promise<MemoryEntity[]> {
    return await this.repo.findBy({ userId })
  }

  public async saveAll(memories: Omit<MemoryEntity, 'id'>[]): Promise<void> {
    await this.repo.save(memories)
  }

  public async findOneById(id: string): Promise<MemoryEntity | undefined> {
    const memory = await this.repo.findOne({ where: { id } })
    if (!memory) return undefined
    return memory
  }
}
