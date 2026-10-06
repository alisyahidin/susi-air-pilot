type LimitPeriod = 'daily' | 'weekly' | 'monthly' | 'annual'
type LimitStatus = 'within' | 'approaching' | 'at_limit' | 'over'

export interface HoursToLimit {
  date: string
  limits: {
    period: LimitPeriod
    windowDays: number
    hours: number
    limit: number
    remaining: number
    status: LimitStatus
  }[]
}

const PERIODS: Record<LimitPeriod, { title: string, window: string }> = {
  daily: { title: 'Daily', window: 'Today' },
  weekly: { title: 'Weekly', window: 'Rolling 7 days' },
  monthly: { title: 'Monthly', window: 'Rolling 30 days' },
  annual: { title: 'Annual', window: 'Rolling 365 days' }
}

const STATUSES = {
  within: { color: 'success', label: 'Within limit', icon: 'lucide:check' },
  approaching: { color: 'warning', label: 'Approaching limit', icon: 'lucide:triangle-alert' },
  at_limit: { color: 'danger', label: 'At limit', icon: 'lucide:circle-alert' },
  over: { color: 'danger', label: 'Over limit', icon: 'lucide:circle-alert' }
} as const

const formatHours = (hours: number) => hours.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export function useHoursToLimit() {
  const { $api } = useNuxtApp()
  const today = useToday()

  return useLazyAsyncData(
    `hours-to-limit-${today}`,
    () => $api<HoursToLimit>('/flight-hours/limits', { query: { date: today } }),
    {
      server: false,
      transform: data => ({
        ...data,
        limits: data.limits.map(limit => ({
          ...limit,
          ...PERIODS[limit.period],
          badge: STATUSES[limit.status],
          formattedHours: formatHours(limit.hours),
          formattedLimit: limit.limit.toLocaleString('id-ID'),
          remainingText: limit.remaining >= 0
            ? `${formatHours(limit.remaining)} hours remaining`
            : `${formatHours(-limit.remaining)} hours over limit`
        }))
      })
    }
  )
}

export type SummaryRange = '1w' | '1m' | '3m' | '6m' | '1y'

export interface FlightHoursSummary {
  date: string
  range: SummaryRange
  windowDays: number
  limit: number
  max: number
  today: { hours: number, remaining: number, status: LimitStatus }
  points: { date: string, hours: number, status: LimitStatus, projected: boolean }[]
}

export function useFlightHoursSummary(range: Ref<SummaryRange>) {
  const { $api } = useNuxtApp()
  const today = useToday()

  return useLazyAsyncData(
    `flight-hours-summary-${today}`,
    () => $api<FlightHoursSummary>('/flight-hours/summary', { query: { range: range.value, date: today } }),
    {
      server: false,
      watch: [range],
      transform: data => ({ ...data, todayBadge: STATUSES[data.today.status] })
    }
  )
}
