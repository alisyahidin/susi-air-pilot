<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const { user } = useAuth()
const { data: pilot, status: pilotStatus } = usePilotMe()
</script>

<template>
  <div class="space-y-4">
    <div>
      <p class="text-sm font-medium text-text-secondary">Welcome back,</p>
      <h1 class="text-lg font-bold">{{ user?.name }}</h1>
    </div>
    <ui-card class="relative flex items-center gap-4 bg-primary! overflow-hidden">
      <div class="flex items-center justify-center rounded-full p-3 bg-navy-600">
        <Icon name="lucide:plane-takeoff" class="text-xl! text-white" />
      </div>
      <div>
        <p class="text-neutral-200">Total flight hours</p>
        <p v-if="pilot" class="text-xl font-bold text-white tabular-nums">
          {{ pilot.formattedTotalFlightHours }} <span class="text-neutral-200 text-base">h</span>
        </p>
        <p v-else-if="pilotStatus === 'error'" class="text-sm font-semibold text-neutral-200">Couldn't load your flight hours</p>
        <span v-else class="block h-8 w-24 mt-1 rounded-md bg-navy-600 animate-pulse" aria-label="Loading flight hours" />
      </div>
      <Icon name="ic:baseline-airplanemode-active" class="absolute -right-4 -bottom-7/10 rotate-60 text-[164px]! text-white opacity-10" />
    </ui-card>

    <!-- Hours to Limit -->
    <div class="space-y-2">
      <p class="font-bold text-lg">Hours to Limit</p>
      <home-hours-to-limit />
    </div>

    <!-- Flight Hours Trend -->
    <div class="space-y-2">
      <p class="font-bold text-lg">Flight Hours Trend</p>
      <home-flight-hours-trend />
    </div>

    <!-- My Documents -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <p class="font-bold text-lg">My Documents</p>
        <button type="button" class="flex items-center gap-0.5 -mr-1.5 h-9 pl-3 pr-1.5 rounded-full text-[13px] font-bold cursor-pointer hover:bg-neutral-50 active:bg-neutral-100">
          View all
          <Icon name="lucide:chevron-right" size="16" />
        </button>
      </div>
      <home-documents />
    </div>
  </div>
</template>