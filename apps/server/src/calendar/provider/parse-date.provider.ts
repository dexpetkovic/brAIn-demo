import { Injectable } from '@nestjs/common'
import { Tool } from '@rekog/mcp-nest'
import { z } from 'zod'
import * as chrono from 'chrono-node'
import { DateTime } from 'luxon'

@Injectable()
export class ParseDateProvider {
  @Tool({
    name: 'parse-date-to-iso8601',
    description:
      'This is tool to help you specify dates and times in natural language. Converts a natural language date/time string to ISO 8601 format. Assumes CET timezone (Europe/Berlin) if not specified.',
    parameters: z.object({
      dateString: z
        .string()
        .describe(
          'The natural language date/time string to convert, e.g., "tomorrow at 10am".'
        )
    })
  })
  parseDateToIso8601({ dateString }: { dateString: string }) {
    const results = chrono.parse(dateString, new Date(), { forwardDate: true })
    if (!results.length || !results[0]) {
      return { iso8601: null, error: 'Could not parse date string.' }
    }

    const date = results[0].date()
    const dt = DateTime.fromJSDate(date, { zone: 'Europe/Berlin' })
    return { iso8601: dt.toISO() }
  }
}
