<script setup lang="ts">
import { parseDate } from '@internationalized/date'

definePageMeta({
  validate: route => /^\d{4}-\d{2}-\d{2}$/.test(String(route.params.date))
})

const route = useRoute()
const label = computed(() => {
  try {
    const date = parseDate(String(route.params.date))
    return date.toDate('UTC').toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  } catch {
    return String(route.params.date)
  }
})
</script>

<template>
  <div class="flex-1 flex flex-col min-w-0 justify-center">
    <ui-card class="flex flex-col items-center min-w-0 gap-1 py-8! text-center">
      <div class="flex items-center justify-center rounded-full p-3 bg-background mb-3">
        <Icon name="lucide:clock" class="text-xl!" />
      </div>
      <h1 class="text-lg font-bold">Detail page coming soon</h1>
      <p class="text-text-secondary font-medium">Duty details for {{ label }} are not available yet.</p>
      <nuxt-link to="/schedules" class="mt-6">
        <ui-button color="white" class="flex items-center gap-2 w-full font-bold!">
          <Icon name="lucide:arrow-left" size="18" />
          Back to schedule
        </ui-button>
      </nuxt-link>
    </ui-card>
  </div>
</template>
