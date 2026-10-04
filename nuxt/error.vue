<script setup lang="ts">
import type { NuxtError } from '#app'

interface MaintenanceData {
  expectedAt?: string
}

const props = defineProps<{
  error: NuxtError<MaintenanceData | string>
}>()

const { isAuthenticated } = useAuth()

const status = computed(() => props.error.statusCode ?? 500)
const isNotFound = computed(() => status.value === 404)
const isMaintenance = computed(() => status.value === 503)

// Errors thrown during server rendering arrive with `data` serialized as a JSON string
const errorData = computed<MaintenanceData>(() => {
  const data = props.error.data
  if (typeof data !== 'string') return data ?? {}
  try {
    return JSON.parse(data)
  } catch {
    return {}
  }
})

const content = computed(() => {
  if (isNotFound.value) {
    return {
      icon: 'lucide:compass',
      title: 'Page not found',
      description: 'The page you are looking for does not exist or has been moved. Check the address, or go back to your dashboard.'
    }
  }
  if (isMaintenance.value) {
    return {
      icon: 'lucide:wrench',
      title: 'Down for maintenance',
      description: 'The Pilot App is temporarily unavailable while we carry out server maintenance. Your flight hours, documents and schedule are not affected.'
    }
  }
  return {
    icon: 'lucide:triangle-alert',
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Try again, or go back to your dashboard.'
  }
})

useHead({ title: () => `${content.value.title} | Susi Air` })

const goTo = (path: string) => clearError({ redirect: path })

const route = useRoute()
const checking = ref(false)
const lastRetryAt = useState<number | null>('error:maintenance-retry', () => null)
const stillDown = computed(() => isMaintenance.value && lastRetryAt.value !== null && Date.now() - lastRetryAt.value < 10_000)

async function retry() {
  if (checking.value) return
  checking.value = true
  lastRetryAt.value = Date.now()
  try {
    await clearError({ redirect: route.fullPath })
  } finally {
    checking.value = false
  }
}
</script>

<template>
  <!-- Maintenance blocks everything, so it never shows the avatar or navigation -->
  <layout-topbar :hide-avatar="isMaintenance" />

  <main class="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-5">
    <ui-card class="w-full flex flex-col items-center gap-4 px-6! py-10! text-center">
      <div class="flex items-center justify-center rounded-full p-3" :class="isMaintenance ? 'bg-warning-tint text-warning-ink' : 'bg-background text-text-primary'">
        <Icon :name="content.icon" size="32" />
      </div>
      <h1 class="text-lg font-bold">{{ content.title }}</h1>
      <p class="text-text-secondary font-medium">{{ content.description }}</p>

      <template v-if="isMaintenance">
        <dl class="w-full flex flex-col px-4 py-1 rounded-xl bg-background text-left">
          <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3">
            <dt class="text-[13px] font-semibold text-text-secondary">Status</dt>
            <dd><ui-badge color="warning">Maintenance in progress</ui-badge></dd>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3 border-t border-border">
            <dt class="text-[13px] font-semibold text-text-secondary">Expected back online</dt>
            <dd class="text-[13px] font-bold">{{ errorData.expectedAt ?? '[TIME AND DATE]' }}</dd>
          </div>
        </dl>

        <p v-if="stillDown" role="status" class="text-[13px] font-semibold text-warning-ink">
          Still under maintenance. Please try again in a few minutes.
        </p>

        <ui-button class="w-full mt-2 font-bold! flex items-center justify-center gap-2.5" :disabled="checking" :aria-busy="checking" @click="retry">
          <Icon :name="checking ? 'lucide:loader-circle' : 'lucide:rotate-cw'" size="18" :class="{ 'animate-spin': checking }" />
          {{ checking ? 'Checking…' : 'Try again' }}
        </ui-button>
      </template>

      <div v-else class="w-full flex flex-col gap-3 pt-2">
        <ui-button v-if="isAuthenticated" class="w-full font-bold!" @click="goTo('/')">Back to Home</ui-button>
        <ui-button v-else class="w-full font-bold!" @click="goTo('/login')">Go to Sign In</ui-button>
        <ui-button v-if="isAuthenticated" color="white" class="w-full font-bold!" @click="goTo('/schedules')">Go to Schedule</ui-button>
      </div>
    </ui-card>

    <p v-if="isMaintenance" class="text-sm font-medium text-text-secondary">© PT ASI Pudjiastuti Aviation</p>
  </main>

  <layout-navbar v-if="isAuthenticated && !isMaintenance" />
</template>
