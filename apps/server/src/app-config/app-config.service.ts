import { Injectable, LogLevel } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { z } from 'zod'
import { errorFactory } from '../common/errors/error-factory'

export const AllLogLevels: Record<LogLevel, number> = {
  fatal: 6,
  error: 5,
  log: 4,
  warn: 3,
  debug: 2,
  verbose: 1
}
const configSchema = z.object({
  BASE_URL: z.string().url().default('http://localhost:3000'),
  LOG_LEVEL: z
    .enum(Object.keys(AllLogLevels) as [LogLevel, ...LogLevel[]])
    .default('log'),
  DB_URL: z.string().url().optional(),
  DATABASE_HOST: z.string().optional(),
  DATABASE_PORT: z.coerce.number().optional().default(5432),
  DATABASE_USERNAME: z.string().optional(),
  DATABASE_PASSWORD: z.string().optional(),
  DATABASE_DATABASE: z.string().optional(),
  DATABASE_RUN_MIGRATIONS: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  DATABASE_USE_SSL: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),
  PORT: z.coerce.number().positive().default(3000),

  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_KEY: z.string().optional(),
  AWS_ENDPOINT: z.string().url().optional(),
  AWS_REGION: z.string().default('eu-west-2'),
  AWS_BUCKET: z.string(),
  WHATSAPP_WEBHOOK_API_KEY: z.string(),
  GEMINI_API_KEY: z.string(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  WASENDER_API_URL: z
    .string()
    .url()
    .default('https://wasenderapi.com/api/send-message'),
  WASENDER_API_KEY: z.string(),
  GOOGLE_CALENDAR_ID: z.string(),
  GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL: z.string().email()
})

export type EnvConfig = z.infer<typeof configSchema> & {
  db:
    | { singleKey: true; url: string }
    | {
        singleKey: false
        host: string
        port: number
        username: string
        password: string
        database: string
      }
}

@Injectable()
export class AppConfigService {
  private config?: EnvConfig

  constructor(private configService: ConfigService) {}

  public getConfig(): EnvConfig {
    if (!this.config) {
      const envObject = Object.keys(configSchema.shape).reduce((acc, key) => {
        acc[key] = this.configService.get(key) as string
        return acc
      }, {})
      const parsedConfig = Object.freeze(configSchema.parse(envObject))
      if (parsedConfig.DB_URL) {
        this.config = {
          ...parsedConfig,
          db: { singleKey: true, url: parsedConfig.DB_URL }
        }
      } else {
        const dbProps = {
          singleKey: false,
          host: this.getOrThrow(parsedConfig.DATABASE_HOST, 'DB_HOST'),
          port: this.getOrThrow(parsedConfig.DATABASE_PORT, 'DB_PORT'),
          username: this.getOrThrow(
            parsedConfig.DATABASE_USERNAME,
            'DB_USERNAME,'
          ),
          password: this.getOrThrow(
            parsedConfig.DATABASE_PASSWORD,
            'DB_PASSWORD,'
          ),
          database: this.getOrThrow(
            parsedConfig.DATABASE_DATABASE,
            'DB_DATABASE'
          )
        } as const
        this.config = {
          ...parsedConfig,
          db: dbProps
        }
      }
    }
    return this.config
  }
  private getOrThrow<T>(opt: T | undefined, name: string): T {
    if (!opt) {
      throw errorFactory.envVariableUndefined(name)
    }
    return opt
  }
}
