import { NestFactory } from '@nestjs/core'
import { AppModule } from './app/app.module'
import { DataSource } from 'typeorm'
import { getDataSourceToken } from '@nestjs/typeorm'

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const dataSource = app.get(getDataSourceToken())
  await app.close()
  return new DataSource(dataSource.options)
}

const config = bootstrap()
export default config
