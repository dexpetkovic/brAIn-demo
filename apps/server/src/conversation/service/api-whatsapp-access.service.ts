import { Injectable } from '@nestjs/common'
import { AppConfigService } from '../../app-config/app-config.service'

@Injectable()
export class ApiWhatsappAccessService {
  constructor(private appConfigService: AppConfigService) {}

  private isWebhookSignatureValid(signature: string) {
    const webhookSecret =
      this.appConfigService.getConfig().WHATSAPP_WEBHOOK_API_KEY
    if (!signature || !webhookSecret || signature !== webhookSecret)
      return false
    return true
  }

  public getAuthContext(params: GetAuthContextParam): AuthContext {
    if (!this.isWebhookSignatureValid(params.apiKey)) {
      throw new Error('Invalid signature')
    }
    return {
      isApi: true
    }
  }
}

export type GetAuthContextParam = {
  apiKey: string
}

export type AuthContext = {
  isApi: boolean
}
