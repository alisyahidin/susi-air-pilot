export interface PilotMe {
  name: string
  imageUrl: string
  totalFlightHours: number
}

export function usePilotMe() {
  const { $api } = useNuxtApp()

  return useLazyAsyncData('pilot-me', () => $api<PilotMe>('/pilot/me'), {
    server: false,
    transform: pilot => ({
      ...pilot,
      formattedTotalFlightHours: pilot.totalFlightHours.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    })
  })
}
