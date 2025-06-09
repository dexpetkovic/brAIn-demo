export const stringUtil = {
  camelToDash: (camelCaseString: string): string => {
    return camelCaseString.replace(/([a-zA-Z])(?=[A-Z])/g, '$1_').toLowerCase()
  },

  dashToCamel: (dashCaseString: string): string => {
    return dashCaseString.replace(/_([a-zA-Z])/g, (match, letter: string) =>
      letter.toUpperCase()
    )
  },

  convertObjectKeysToDashCase: (obj: unknown): unknown => {
    if (Array.isArray(obj)) {
      return obj.map(stringUtil.convertObjectKeysToDashCase)
    } else if (obj !== null && typeof obj === 'object') {
      return Object.entries(obj).reduce((result, [key, value]) => {
        const newKey = stringUtil.camelToDash(key)
        result[newKey] = stringUtil.convertObjectKeysToDashCase(value)
        return result
      }, {})
    } else {
      return obj
    }
  },

  convertObjectKeysToCamelCase: (obj: unknown): unknown => {
    if (Array.isArray(obj)) {
      return obj.map(stringUtil.convertObjectKeysToCamelCase)
    } else if (obj !== null && typeof obj === 'object') {
      return Object.entries(obj).reduce((result, [key, value]) => {
        const newKey = stringUtil.dashToCamel(key)
        result[newKey] = stringUtil.convertObjectKeysToCamelCase(value)
        return result
      }, {})
    } else {
      return obj
    }
  }
}
