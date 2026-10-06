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
  baseName: string
  baseColor: string
  countSchedules: number
  countLogbooks: number
}

export interface MonthSchedule {
  year: number
  month: number
  available: { from: string, to: string } | null
  legend: DutyLegend[]
  days: ScheduleDay[]
}

export function useMonthSchedule(month: Ref<DateValue>) {
  const { $api } = useNuxtApp()

  return useLazyAsyncData(
    'schedules',
    () => $api<MonthSchedule>('/schedules', { query: { year: month.value.year, month: month.value.month } }),
    { server: false, watch: [() => `${month.value.year}-${month.value.month}`] }
  )
}
