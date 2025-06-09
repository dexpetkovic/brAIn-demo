import { AppConfigService } from '../../app-config/app-config.service'
import { AppConfigModule } from '../../app-config/app-config.module'
import { TransactionalTypeormModule } from '../../transactional-typeorm/transactional-typeorm.module'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
export type ConnectionParams =
  | { singleKey: true; url: string }
  | {
      singleKey: false
      host: string
      port: number
      username: string
      password: string
      database: string
    }
export const typeOrmModuleOptions = ({
  runMigrations,
  connectionParams
}: {
  runMigrations: boolean
  connectionParams: ConnectionParams
}): TypeOrmModuleOptions => ({
  autoLoadEntities: true,
  type: 'postgres',
  url: connectionParams.singleKey ? connectionParams.url : undefined,
  host: !connectionParams.singleKey ? connectionParams.host : undefined,
  port: !connectionParams.singleKey ? connectionParams.port : undefined,
  username: !connectionParams.singleKey ? connectionParams.username : undefined,
  password: !connectionParams.singleKey ? connectionParams.password : undefined,
  database: !connectionParams.singleKey ? connectionParams.database : undefined,
  migrations: ['dist/**/migration/*.js'],
  migrationsTableName: 'migrations',
  migrationsTransactionMode: 'all',
  migrationsRun: runMigrations,
  synchronize: false
})
export const TypeOrmRootImport = TransactionalTypeormModule.forRootAsync({
  inject: [AppConfigService],
  imports: [AppConfigModule],
  useFactory: (appConfigService: AppConfigService) => {
    const { db: connectionParams, DATABASE_RUN_MIGRATIONS: runMigrations } =
      appConfigService.getConfig()
    return typeOrmModuleOptions({ runMigrations, connectionParams })
  }
})
