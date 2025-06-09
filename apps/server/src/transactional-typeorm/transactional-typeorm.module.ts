import { DynamicModule, Module, Provider } from '@nestjs/common'
import {
  TypeOrmModule,
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions
} from '@nestjs/typeorm'
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type'
import { TransactionalContext } from './transactional-context'
import { repositoryFactoryToken } from './repository-factory-token'
import { TransactionalRepositoryProvider } from './transactional-repository-provider'

class TransactionalTypeormCoreModule {
  static forRoot(options: TypeOrmModuleOptions): DynamicModule {
    return {
      global: true,
      providers: [TransactionalContext],
      module: TransactionalTypeormCoreModule,
      imports: [TypeOrmModule.forRoot(options)],
      exports: [TypeOrmModule, TransactionalContext]
    }
  }

  static forRootAsync(options: TypeOrmModuleAsyncOptions): DynamicModule {
    return {
      global: true,
      providers: [TransactionalContext],
      module: TransactionalTypeormCoreModule,
      imports: [TypeOrmModule.forRootAsync(options)],
      exports: [TypeOrmModule, TransactionalContext]
    }
  }
}

@Module({})
export class TransactionalTypeormModule {
  static forRoot(options: TypeOrmModuleOptions): DynamicModule {
    return {
      module: TransactionalTypeormModule,
      imports: [TransactionalTypeormCoreModule.forRoot(options)],
      exports: [TransactionalTypeormCoreModule]
    }
  }

  static forRootAsync(options: TypeOrmModuleAsyncOptions): DynamicModule {
    return {
      module: TransactionalTypeormModule,
      imports: [TransactionalTypeormCoreModule.forRootAsync(options)],
      exports: [TransactionalTypeormCoreModule]
    }
  }

  static forFeature(entities?: EntityClassOrSchema[]): DynamicModule {
    const entityRepositoryFactories: Provider[] = (entities ?? []).map(
      (entity) => ({
        provide: repositoryFactoryToken(entity),
        inject: [TransactionalContext],
        useFactory: (transactionalEntityManager: TransactionalContext) => {
          return new TransactionalRepositoryProvider(
            transactionalEntityManager,
            entity
          )
        }
      })
    )
    return {
      providers: entityRepositoryFactories,
      module: TransactionalTypeormModule,
      imports: [TypeOrmModule.forFeature(entities)],
      exports: entityRepositoryFactories.concat([TypeOrmModule])
    }
  }
}
