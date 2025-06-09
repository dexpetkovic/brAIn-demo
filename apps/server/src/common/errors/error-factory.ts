export const errorFactory = {
  envVariableUndefined: (name: string) =>
    new Error(`${name} not allowed to be empty`)
}
