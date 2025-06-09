export const promiseUtil = {
  runAllSequentiallyWithResult: <T, U>(
    arr: T[],
    provider: (arg: T) => Promise<U>
  ): Promise<U[]> => {
    return arr.reduce(
      (res$, el) => {
        return res$.then((resArray) => {
          return provider(el).then((elRes) => {
            resArray.push(elRes)
            return resArray
          })
        })
      },
      Promise.resolve([] as U[])
    )
  },
  runAllSequentially: <T>(
    arr: T[],
    provider: (arg: T) => Promise<void>
  ): Promise<void> => {
    return arr.reduce((res$, el) => {
      return res$.then(() => {
        return provider(el)
      })
    }, Promise.resolve())
  },
  delay: (millis: number) => new Promise((res) => setTimeout(res, millis))
}
