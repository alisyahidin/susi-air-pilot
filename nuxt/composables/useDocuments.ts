type DocumentStatus = 'valid' | 'expiring' | 'expired'

export interface PilotDocuments {
  date: string
  documents: {
    id: string
    label: string
    expiryDate: string
    daysRemaining: number
    status: DocumentStatus
  }[]
}

const STATUSES = {
  valid: { color: 'success', label: 'Valid' },
  expiring: { color: 'warning', label: 'Expiring soon' },
  expired: { color: 'danger', label: 'Expired' }
} as const

const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? '' : 's'}`

const formatDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })

function remainingText(days: number) {
  if (days < 0) return `Expired ${plural(-days, 'day')} ago`
  if (days === 0) return 'Expired today'
  if (days < 60) return `${plural(days, 'day')} left`
  const years = Math.floor(days / 365)
  const months = Math.floor((days % 365) / 30)
  return `${[years && `${years} yr`, months && `${months} mo`].filter(Boolean).join(' ')} left`
}

export function useDocuments() {
  const { $api } = useNuxtApp()

  return useLazyAsyncData(
    'documents',
    () => $api<PilotDocuments>('/documents'),
    {
      server: false,
      transform: data => ({
        ...data,
        documents: data.documents.map(document => ({
          ...document,
          badge: STATUSES[document.status],
          expiryText: `${document.status === 'expired' ? 'Expired' : 'Expires'} ${formatDate(document.expiryDate)}`,
          remainingText: remainingText(document.daysRemaining)
        }))
      })
    }
  )
}
