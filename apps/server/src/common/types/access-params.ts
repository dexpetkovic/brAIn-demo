export type ApiAccessType = 'ALLOW' | 'ENSURE'
export type AccessParams = Partial<{
  apiAccess: ApiAccessType
}>
