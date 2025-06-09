import { Repository } from 'typeorm'
import { TransactionalContext } from './transactional-context'

export class TransactionalRepositoryProvider<T> {
  constructor(
    private transactionalEntityManager: TransactionalContext,
    private entity: T
  ) {}

  // @ts-ignore
  public getRepository(): Repository<T> {
    const manager = this.transactionalEntityManager.getManager()
    // @ts-ignore
    return manager.getRepository(this.entity)
  }
}
