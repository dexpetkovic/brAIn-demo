import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ACCESS_METADATA } from '../decorators/metadata'

import { AccessParams } from '../types/access-params'

import { Maybe } from '../types/maybe'
import {
  ApiWhatsappAccessService,
  AuthContext
} from '../../conversation/service/api-whatsapp-access.service'

export type AuthenticatedUser = {
  isSystemAdmin: boolean
}

@Injectable()
export class ExpressAuthenticationGuard implements CanActivate {
  constructor(
    private apiWhatsappAccessService: ApiWhatsappAccessService,
    private reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const accessMetadata = this.reflector.getAllAndOverride<AccessParams>(
      ACCESS_METADATA,
      [context.getHandler(), context.getClass()]
    )
    const request = context.switchToHttp().getRequest<Request>()
    try {
      const auth = this.handleAuth(request)
      if (!accessMetadata) {
        return true
      }
      if (!auth) {
        return false
      }
      if (!accessMetadata.apiAccess && auth.isApi) {
        return false
      }
      if (accessMetadata.apiAccess === 'ENSURE' && !auth.isApi) {
        return false
      }

      return true
    } catch (e) {
      return false
    }
  }

  private handleAuth(request: Request):
    | {
        isApi: boolean
        context: AuthenticatedUser
      }
    | undefined {
    const waSenderWebhookAuth = this.handleWaSenderWebhookAuth(request)
    if (waSenderWebhookAuth) {
      return {
        isApi: true,
        context: {
          isSystemAdmin: false
        }
      }
    }

    return undefined
  }

  private getHeaderValue(request: Request, headerName: string): Maybe<string> {
    if (!request.headers[headerName]) return undefined

    return request.headers[headerName] as string
  }

  private handleWaSenderWebhookAuth(request: Request): AuthContext | undefined {
    const keyFromHeader = this.getHeaderValue(request, 'x-webhook-signature')

    if (!keyFromHeader) return

    return this.apiWhatsappAccessService.getAuthContext({
      apiKey: keyFromHeader
    })
  }
}
