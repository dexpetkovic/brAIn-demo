import {
  parseISO,
  startOfDay,
  isBefore,
  isEqual,
  format,
  formatISO
} from 'date-fns'

export const timeUtil = {
  now: (): Date => {
    return new Date()
  },

  stringToDate(dateString: string): Date {
    return parseISO(dateString)
  },
  dateToString(date: Date): string {
    return formatISO(date)
  },
  isBeforeOrEqual(date1: Date, date2: Date): boolean {
    return (
      isEqual(startOfDay(date1), startOfDay(date2)) ||
      isBefore(startOfDay(date1), startOfDay(date2))
    )
  },

  formatDateToLocaleDateString(date: Date | string) {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!dateObj?.getTime() || isNaN(dateObj.getTime())) {
      return date as string
    }
    return format(dateObj, 'dd MMMM yyyy')
  },

  addMonthsToNow: (months: number): Date =>
    timeUtil.addMonthsToDate(timeUtil.now(), months),
  addMonthsToDate(date: Date, months: number): Date {
    const dateClone = new Date(date)
    dateClone.setMonth(dateClone.getMonth() + months)
    return dateClone
  }
}
