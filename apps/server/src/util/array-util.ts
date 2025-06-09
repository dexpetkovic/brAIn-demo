export const arrayUtil = {
  chunked: <T>(arr: T[], chunkSize: number): T[][] => {
    return arr.reduce((res, item) => {
      if (res.length < 1) {
        res.push([item])
        return res
      }
      const lastChunk = res[res.length - 1]!
      if (lastChunk.length < chunkSize) {
        lastChunk.push(item)
      } else {
        res.push([item])
      }

      return res
    }, [] as T[][])
  },
  mapped: <T, K>(entries: T[], keyMapper: (item: T) => K): Map<K, T> => {
    return entries.reduce((map, item) => {
      map.set(keyMapper(item), item)
      return map
    }, new Map<K, T>())
  },
  grouped: <T, K>(entries: T[], keyMapper: (item: T) => K): Map<K, T[]> => {
    return entries.reduce((map, item) => {
      const key = keyMapper(item)
      const existingEntry = map.get(key)
      if (!existingEntry) {
        map.set(key, [item])
      } else {
        existingEntry.push(item)
      }
      return map
    }, new Map<K, T[]>())
  }
}
