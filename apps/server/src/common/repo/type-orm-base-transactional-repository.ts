import { DeepPartial, ObjectLiteral } from 'typeorm'
import { TransactionalRepositoryProvider } from '../../transactional-typeorm/transactional-repository-provider'

export abstract class TypeOrmBaseTransactionalRepository<
  ENTITY extends ObjectLiteral,
  KEY_PROP extends keyof ENTITY,
  ID_VAL extends ENTITY[KEY_PROP] = ENTITY[KEY_PROP],
  GEN extends string | symbol | number = KEY_PROP
> {
  protected constructor(
    protected repo: TransactionalRepositoryProvider<ENTITY>,
    protected idKey: KEY_PROP
  ) {}

  public async findOne(val: ID_VAL): Promise<ENTITY | undefined> {
    const findBy = { [this.idKey]: val } as Partial<ENTITY>
    const one = await this.repo.getRepository().findOneBy(findBy)
    return one ?? undefined
  }

  public async findAll(params?: {
    relations: string[] | undefined
  }): Promise<ENTITY[]> {
    const { relations = undefined } = params ?? {}
    return this.repo.getRepository().find({ relations })
  }

  public async save(obj: Omit<ENTITY, GEN>): Promise<ENTITY> {
    return this.repo.getRepository().save(obj as ENTITY)
  }

  public async update(obj: DeepPartial<ENTITY>): Promise<ENTITY> {
    // @ts-ignore
    if (!obj[this.idKey]) {
      throw new Error('entity for update does not exist')
    }
    const preloaded = await this.repo.getRepository().preload(obj)
    if (!preloaded) {
      throw new Error('entity for update does not exist')
    }
    return this.repo.getRepository().save(preloaded)
  }

  public async delete(val: ID_VAL): Promise<boolean> {
    const findBy = { [this.idKey]: val } as Partial<ENTITY>
    const deleteResult = await this.repo.getRepository().delete(findBy)
    return !!deleteResult.affected
  }
}
