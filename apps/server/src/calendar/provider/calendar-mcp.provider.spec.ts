import { CalendarMcpProvider } from './calendar-mcp.provider'
import { CalendarMcpService } from '../service/calendar-mcp.service'
import { AppConfigService } from '../../app-config/app-config.service'
import * as chrono from 'chrono-node'

jest.mock('chrono-node', () => ({
  parseDate: jest.fn()
}))

describe('CalendarMcpProvider', () => {
  let provider: CalendarMcpProvider
  let service: CalendarMcpService
  let appConfigService: AppConfigService

  beforeEach(() => {
    appConfigService = {
      getConfig: () => ({
        GOOGLE_CALENDAR_ID: 'test@calendar.com',
        GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL: 'service@test.com'
      })
    } as unknown as AppConfigService
    service = new CalendarMcpService(appConfigService)
    service.createEvent = jest.fn() // Mock the service method directly
    provider = new CalendarMcpProvider(service)
  })

  it('should parse natural language and create an event', async () => {
    ;(chrono.parseDate as jest.Mock)
      .mockReturnValueOnce(new Date('2025-06-25T10:00:00Z'))
      .mockReturnValueOnce(new Date('2025-06-25T11:00:00Z'))
    ;(service.createEvent as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Event created successfully.'
    })

    const result = await provider.createCalendarEvent({
      title: 'Test',
      description: 'Test event',
      startDateTime: 'tomorrow 10am',
      endDateTime: 'tomorrow 11am'
    })

    expect(chrono.parseDate).toHaveBeenCalledWith('tomorrow 10am')
    expect(chrono.parseDate).toHaveBeenCalledWith(
      'tomorrow 11am',
      expect.any(Date)
    )
    expect(result.content[0]!.text).toContain('Event created successfully')
  })

  it('should return an error for unparseable dates', async () => {
    ;(chrono.parseDate as jest.Mock).mockReturnValue(null)

    const serviceWithChrono = new CalendarMcpService(appConfigService)
    const providerWithChrono = new CalendarMcpProvider(serviceWithChrono)

    const result = await providerWithChrono.createCalendarEvent({
      title: 'Test',
      description: 'Test event',
      startDateTime: 'invalid date',
      endDateTime: 'another invalid date'
    })
    expect(result.content[0]!.text).toContain(
      'Could not understand the start time'
    )
  })

  it('should create an event with valid ISO 8601 dates', async () => {
    ;(service.createEvent as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Event created successfully.'
    })
    const result = await provider.createCalendarEvent({
      title: 'Test',
      description: 'Test event',
      startDateTime: '2025-06-25T10:00:00Z',
      endDateTime: '2025-06-25T11:00:00Z',
      attendees: ['test@example.com'],
      userEmail: 'user@example.com'
    })
    expect(result.content[0]!.text).toContain('Event created successfully')
  })

  it('should fail with non-ISO date strings', async () => {
    ;(service.createEvent as jest.Mock).mockResolvedValue({
      success: false,
      message: 'Failed to create calendar event.'
    })
    const result = await provider.createCalendarEvent({
      title: 'Test',
      description: 'Test event',
      startDateTime: 'tomorrow 10am',
      endDateTime: 'tomorrow 11am',
      attendees: ['test@example.com'],
      userEmail: 'user@example.com'
    })
    expect(result.content[0]!.text).toContain('Failed to create event')
  })

  it('should fail if required fields are missing', async () => {
    ;(service.createEvent as jest.Mock).mockResolvedValue({
      success: false,
      message: 'Failed to create calendar event.'
    })
    // @ts-expect-error
    const result = await provider.createCalendarEvent({
      title: 'Test',
      description: 'Test event',
      // missing startTime and endTime
      attendees: ['test@example.com'],
      userEmail: 'user@example.com'
    })
    expect(result.content[0]!.text).toContain('Failed to create event')
  })

  it('should fail if attendees is malformed', async () => {
    ;(service.createEvent as jest.Mock).mockResolvedValue({
      success: false,
      message: 'Failed to create calendar event.'
    })
    const result = await provider.createCalendarEvent({
      title: 'Test',
      description: 'Test event',
      startDateTime: '2025-06-25T10:00:00Z',
      endDateTime: '2025-06-25T11:00:00Z',
      attendees: 'not-an-array' as unknown as string[],
      userEmail: 'user@example.com'
    })
    expect(result.content[0]!.text).toContain('Failed to create event')
  })
})
