import { Injectable } from '@nestjs/common'
import { TypeOrmBaseRepository } from '../../common/repo/type-orm-base-repository'
import { MessageEntity } from '../entity/message'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
export class MessageRepository extends TypeOrmBaseRepository<
  MessageEntity,
  'id'
> {
  constructor(
    @InjectRepository(MessageEntity) repo: Repository<MessageEntity>
  ) {
    super(repo, 'id')
  }

  async findByUserId(userId: string): Promise<MessageEntity[]> {
    return await this.repo.findBy({ userId })
  }

  public async saveAll(messages: Omit<MessageEntity, 'id'>[]): Promise<void> {
    await this.repo.save(messages)
  }
}
