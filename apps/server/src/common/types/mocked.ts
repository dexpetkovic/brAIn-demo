import { Public } from './public'

export type Mocked<T> = {
  [K in keyof Public<T>]: T[K] extends jest.MockableFunction
    ? jest.Mock<ReturnType<T[K]>, Parameters<T[K]>>
    : never
}
