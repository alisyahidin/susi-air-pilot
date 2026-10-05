import type { DateValue } from '@internationalized/date'

export interface DutyLegend {
  code: string
  label: string
  color: string
}

export interface ScheduleDay {
  id: string
  date: string
  status: 'upcoming' | 'completed'
  dutyType: string
  /** Short label for the day: the base airport on duty days, else the duty code */
  baseName: string
  baseColor: string
  countSchedules: number
  countLogbooks: number
}

export interface MonthSchedule {
  year: number
  month: number
  /** First and last month (YYYY-MM) that have duties; null when there are none */
  available: { from: string, to: string } | null
  legend: DutyLegend[]
  days: ScheduleDay[]
}

/**
 * The signed-in pilot's duties in the month `month` is in, refetched when it moves to another
 * month. Loads in the browser only, like every signed-in request.
 */
export function useMonthSchedule(month: Ref<DateValue>) {
  const { $api } = useNuxtApp()

  return useLazyAsyncData(
    'schedules',
    () => $api<MonthSchedule>('/schedules', { query: { year: month.value.year, month: month.value.month } }),
    { server: false, watch: [() => `${month.value.year}-${month.value.month}`] }
  )
}
