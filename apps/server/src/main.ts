import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as fs from 'fs'
import * as path from 'path'
import * as process from 'process'
import { AppModule } from './app/app.module'
import { NestExpressApplication } from '@nestjs/platform-express'
import { GeminiAiService } from './ai/service/gemini-ai.service'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.enableCors()
  app.useBodyParser('json', { limit: '5mb' })
  const config = new DocumentBuilder()
    .setTitle('BrAIn Platform API')
    .setDescription('BrAIn Platform API description')
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-webhook-signature',
        in: 'header',
        description: 'Signature for WhatsApp webhook'
      },
      'x-webhook-signature'
    )
    .build()

  const document = SwaggerModule.createDocument(app, config)
  fs.writeFileSync(
    path.join(process.cwd(), 'dist/swagger.json'),
    JSON.stringify(document)
  )
  SwaggerModule.setup('open-api', app, document)

  await app.listen(3000, '0.0.0.0')

  const geminiService = app.get(GeminiAiService)
  await geminiService.connectMemoryClient()
}

bootstrap().catch(console.error)
