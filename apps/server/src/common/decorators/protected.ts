import { applyDecorators, SetMetadata } from '@nestjs/common'
import { ACCESS_METADATA } from './metadata'
import { ApiBearerAuth } from '@nestjs/swagger'
import { AccessParams } from '../types/access-params'

export const Protected = (accessParams: AccessParams = {}) =>
  applyDecorators(SetMetadata(ACCESS_METADATA, accessParams), ApiBearerAuth())
