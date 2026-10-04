import { CalendarDate } from '@internationalized/date'

export interface DutyType {
  code: string
  name: string
  base_color: string
}

export interface ScheduleEntry {
  type: string
  count_schedules: number
  count_logbooks: number
}

export interface MonthSchedule {
  year: number
  month: number
  entries: Record<number, ScheduleEntry>
}

/* ---------------- Dummy data, until GET /schedules?year=YYYY&month=MM is wired up ----------------
   Duty colours stand in for the API's base_color. The mock covers April to June 2026. */
export const SCHEDULE_TODAY = new CalendarDate(2026, 5, 15) // matches the topbar's "Fri, 15 May"
export const SCHEDULE_MIN = new CalendarDate(2026, 4, 1)
export const SCHEDULE_MAX = new CalendarDate(2026, 6, 30)

export const DUTY_TYPES: DutyType[] = [
  { code: 'DUTY', name: 'Flight duty', base_color: '#1D4ED8' },
  { code: 'RL', name: 'Rest leave', base_color: '#10B981' },
  { code: 'SCK', name: 'Sick', base_color: '#EF4444' },
  { code: 'TR', name: 'Training', base_color: '#8B5CF6' },
  { code: 'TX', name: 'Positioning', base_color: '#F59E0B' },
  { code: 'ADM', name: 'Admin', base_color: '#64748B' },
  { code: 'FER', name: 'Ferry flight', base_color: '#0EA5E9' },
  { code: 'MED', name: 'Medical', base_color: '#EC4899' },
  { code: 'REC', name: 'Recurrent', base_color: '#14B8A6' },
  { code: 'UL', name: 'Unpaid leave', base_color: '#A8A29E' }
]

// day:type:count_schedules:count_logbooks
const MOCK: Record<string, string> = {
  '2026-4': '1:DUTY:2:2 2:DUTY:3:3 3:DUTY:2:2 4:RL:0:0 5:RL:0:0 6:DUTY:3:3 7:DUTY:2:2 8:TX:1:1 9:DUTY:3:3 10:DUTY:2:2 11:RL:0:0 13:SCK:0:0 14:SCK:0:0 15:ADM:0:0 16:TR:1:1 17:TR:1:1 18:DUTY:2:2 19:RL:0:0 20:ADM:0:0 21:DUTY:2:2 22:DUTY:2:2 23:RL:0:0 24:RL:0:0 25:DUTY:2:2 26:FER:1:1 27:UL:0:0 28:DUTY:2:1 29:DUTY:2:2 30:RL:0:0',
  '2026-5': '1:DUTY:2:2 2:RL:0:0 3:DUTY:2:2 4:TR:1:1 5:TR:1:1 6:ADM:0:0 7:DUTY:2:2 8:DUTY:3:3 9:DUTY:3:3 10:DUTY:3:3 11:FER:2:2 12:DUTY:3:3 13:DUTY:3:2 14:DUTY:3:1 15:DUTY:3:1 16:DUTY:3:0 17:RL:0:0 18:DUTY:2:0 19:DUTY:3:0 20:MED:0:0 21:TX:1:0 22:DUTY:2:0 25:REC:1:0 26:REC:1:0 27:DUTY:2:0 28:DUTY:2:0 29:UL:0:0 30:UL:0:0',
  '2026-6': '1:DUTY:2:0 2:DUTY:3:0 3:DUTY:2:0 4:RL:0:0 5:RL:0:0 6:DUTY:2:0 7:DUTY:3:0 8:TX:1:0 9:DUTY:2:0 10:DUTY:2:0 11:RL:0:0 12:ADM:0:0 15:TR:1:0 16:TR:1:0 17:DUTY:2:0 18:DUTY:3:0 19:RL:0:0 22:DUTY:2:0 23:DUTY:2:0 24:FER:1:0 25:RL:0:0 26:UL:0:0 29:DUTY:2:0 30:DUTY:2:0'
}

export async function fetchSchedules(year: number, month: number): Promise<MonthSchedule> {
  if (import.meta.client) await new Promise(resolve => setTimeout(resolve, 450)) // simulate network latency

  const entries: Record<number, ScheduleEntry> = {}
  for (const token of (MOCK[`${year}-${month}`] ?? '').split(' ').filter(Boolean)) {
    const [day, type, schedules, logbooks] = token.split(':')
    entries[Number(day)] = { type: type!, count_schedules: Number(schedules), count_logbooks: Number(logbooks) }
  }
  return { year, month, entries }
}
/* ---------------- end of dummy data ---------------- */
