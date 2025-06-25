import { Injectable } from '@nestjs/common'
import { google, calendar_v3 } from 'googleapis'
import * as chrono from 'chrono-node'
import { AppConfigService } from '../../app-config/app-config.service'

@Injectable()
export class CalendarMcpService {
  private calendar: calendar_v3.Calendar
  private calendarId: string
  private serviceAccountEmail: string

  constructor(private readonly appConfigService: AppConfigService) {
    const { GOOGLE_CALENDAR_ID, GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL } =
      this.appConfigService.getConfig()
    this.calendarId = GOOGLE_CALENDAR_ID
    this.serviceAccountEmail = GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL

    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/calendar']
    })

    this.calendar = google.calendar({ version: 'v3', auth })
  }

  async createEvent(eventDetails: {
    title: string
    description: string
    startDateTime: string
    endDateTime: string
    attendees?: string[]
    userEmail?: string
  }): Promise<{ success: boolean; message: string; data?: any }> {
    const { title, description, attendees = [], userEmail } = eventDetails

    const finalAttendees = attendees.slice()
    if (userEmail && !finalAttendees.includes(userEmail)) {
      finalAttendees.unshift(userEmail)
    }

    const parsedStartTime = chrono.parseDate(eventDetails.startDateTime)
    if (!parsedStartTime) {
      return {
        success: false,
        message: `Could not understand the start time: "${eventDetails.startDateTime}"`
      }
    }

    const parsedEndTime = chrono.parseDate(
      eventDetails.endDateTime,
      parsedStartTime
    )
    if (!parsedEndTime) {
      return {
        success: false,
        message: `Could not understand the end time: "${eventDetails.endDateTime}"`
      }
    }

    const event: calendar_v3.Params$Resource$Events$Insert['requestBody'] = {
      summary: title,
      description,
      start: {
        dateTime: parsedStartTime.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: parsedEndTime.toISOString(),
        timeZone: 'UTC'
      },
      attendees: finalAttendees.length
        ? finalAttendees.map((email) => ({ email }))
        : undefined
    }

    try {
      const response = await this.calendar.events.insert({
        calendarId: this.calendarId,
        requestBody: event,
        sendUpdates: 'all'
      })

      return {
        success: true,
        message: `Event created successfully.`,
        data: response.data
      }
    } catch (error) {
      console.error('Error creating calendar event:', error)
      return {
        success: false,
        message: 'Failed to create calendar event.',
        data: error
      }
    }
  }
}
