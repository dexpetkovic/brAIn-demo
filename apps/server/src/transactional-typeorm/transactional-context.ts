import { Injectable } from '@nestjs/common'
import { AsyncLocalStorage } from 'node:async_hooks'
import { EntityManager } from 'typeorm'
import { InjectEntityManager } from '@nestjs/typeorm'

@Injectable()
export class TransactionalContext {
  private entityManagerStore = new AsyncLocalStorage<EntityManager>()

  constructor(@InjectEntityManager() private entityManager: EntityManager) {}

  public getManager(): EntityManager {
    const fromStorage = this.entityManagerStore.getStore()
    return fromStorage ?? this.entityManager
  }

  public runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    const current = this.entityManagerStore.getStore()
    if (current) {
      return fn()
    }
    return this.entityManager.transaction((transactionalManager) => {
      return this.entityManagerStore.run(transactionalManager, fn)
    })
  }
}
