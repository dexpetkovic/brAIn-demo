import { Injectable } from '@nestjs/common'
import { z } from 'zod'
import { Tool } from '@rekog/mcp-nest'
import { CalendarMcpService } from '../service/calendar-mcp.service'

@Injectable()
export class CalendarMcpProvider {
  constructor(private readonly calendarMcpService: CalendarMcpService) {}

  @Tool({
    name: 'create-calendar-event',
    description: `Creates a calendar event and invites specified attendees. 
   If you do not know the user email, you must ask for it. 
   You must use the startDateTime and endDateTime parameters for start and end dates and times. 
   Use user input to infer time to your best ability. 
   You can use parse_date_to_iso8601 to convert natural language into the required ISO 8601 format for startDateTime and endDateTime.`,
    parameters: z.object({
      title: z.string().describe('The title of the calendar event.'),
      description: z.string().describe('A detailed description of the event.'),
      startDateTime: z
        .string()
        .describe(
          'The start date and time of the event. Can be natural language (e.g., "tomorrow at 10am"). Use the parse-date-to-iso8601 tool to convert natural language to ISO 8601 format.'
        ),
      endDateTime: z
        .string()
        .describe(
          'The end date and time of the event. Can be natural language (e.g., "in one hour"). Use the parse-date-to-iso8601 tool to convert natural language to ISO 8601 format.'
        ),
      attendees: z
        .array(z.string())
        .optional()
        .describe(
          'A list of attendee emails to invite. Only use if the user asks to create an event for someone else.'
        ),
      userEmail: z
        .string()
        .optional()
        .describe(
          "The user's email address. If not provided, you must ask the user for their email."
        )
    })
  })
  async createCalendarEvent(eventDetails: {
    title: string
    description: string
    startDateTime: string
    endDateTime: string
    attendees?: string[]
    userEmail?: string
  }) {
    console.log('createCalendarEvent', JSON.stringify(eventDetails, null, 2))
    const result = await this.calendarMcpService.createEvent(eventDetails)
    return {
      content: [
        {
          type: 'text',
          text: result.success
            ? result.message
            : `Failed to create event: ${result.message}`
        }
      ]
    }
  }
}
