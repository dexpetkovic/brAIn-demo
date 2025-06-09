import { DeepPartial, ObjectLiteral, Repository } from 'typeorm'
import { Logger } from '@nestjs/common'

export abstract class TypeOrmBaseRepository<
  ENTITY extends ObjectLiteral,
  KEY_PROP extends keyof ENTITY,
  ID_VAL extends ENTITY[KEY_PROP] = ENTITY[KEY_PROP],
  GEN extends string | symbol | number = KEY_PROP
> {
  protected constructor(
    protected repo: Repository<ENTITY>,
    protected idKey: KEY_PROP
  ) {}
  private readonly logger = new Logger(TypeOrmBaseRepository.name)

  public async findOne(val: ID_VAL): Promise<ENTITY | undefined> {
    const findBy = { [this.idKey]: val } as Partial<ENTITY>
    const one = await this.repo.findOneBy(findBy)
    return one ?? undefined
  }

  public async findAll(params?: {
    relations: string[] | undefined
  }): Promise<ENTITY[]> {
    const { relations = undefined } = params ?? {}
    return this.repo.find({ relations })
  }

  public async save(obj: Omit<ENTITY, GEN>): Promise<ENTITY> {
    return this.repo.save(obj as ENTITY)
  }

  public async update(obj: DeepPartial<ENTITY>): Promise<ENTITY> {
    const preloaded = await this.repo.preload(obj)
    if (!preloaded) {
      throw new Error('entity for update does not exist')
    }
    return this.repo.save(preloaded)
  }

  public async delete(val: ID_VAL): Promise<boolean> {
    const findBy = { [this.idKey]: val } as Partial<ENTITY>
    const deleteResult = await this.repo.delete(findBy)
    return !!deleteResult.affected
  }
}
