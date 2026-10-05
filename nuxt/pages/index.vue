<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const { user } = useAuth()
const { data: pilot, status: pilotStatus } = usePilotMe()
const { data: hoursToLimit, status: hoursToLimitStatus } = useHoursToLimit()
const { data: documents, status: documentsStatus } = useDocuments()
</script>

<template>
  <div class="space-y-4">
    <div>
      <p class="text-sm font-medium text-text-secondary">Welcome back,</p>
      <h1 class="text-lg font-bold">{{ user?.name }}</h1>
    </div>
    <ui-card class="flex items-center gap-4 bg-primary!">
      <div class="flex items-center justify-center rounded-full p-3 bg-navy-600">
        <Icon name="lucide:clock" class="text-xl! text-white" />
      </div>
      <div>
        <p class="text-neutral-200">Total flight hours</p>
        <p v-if="pilot" class="text-xl font-bold text-white tabular-nums">
          {{ pilot.formattedTotalFlightHours }} <span class="text-neutral-200 text-base">h</span>
        </p>
        <p v-else-if="pilotStatus === 'error'" class="text-sm font-semibold text-neutral-200">Couldn't load your flight hours</p>
        <span v-else class="block h-8 w-24 mt-1 rounded-md bg-navy-600 animate-pulse" aria-label="Loading flight hours" />
      </div>
    </ui-card>

    <!-- Hours to Limit -->
    <div class="space-y-2">
      <p class="font-bold text-lg">Hours to Limit</p>
      <p v-if="hoursToLimitStatus === 'error'" class="text-text-secondary font-medium">Couldn't load your hours to limit.</p>
      <div v-else class="grid grid-cols-2 gap-2">
        <template v-if="hoursToLimit">
          <ui-card v-for="limit in hoursToLimit.limits" :key="limit.period" class="flex flex-col min-w-0 items-start gap-2">
            <div>
              <p class="text-[16px] font-bold">{{ limit.title }}</p>
              <p class="text-text-secondary font-medium">{{ limit.window }}</p>
            </div>
            <ui-badge :color="limit.badge.color" variant="icon" :icon="limit.badge.icon">{{ limit.badge.label }}</ui-badge>
            <div>
              <p class="text-xl font-extrabold tabular-nums">{{ limit.formattedHours }} <span class="text-text-secondary text-base">h</span></p>
              <p class="text-text-secondary font-medium">of {{ limit.formattedLimit }} hour limit</p>
            </div>
            <div class="w-full space-y-2">
              <ui-progress :value="limit.hours" :max="limit.limit" :color="limit.badge.color" :label="`${limit.title} hours`" />
              <p class="font-semibold">{{ limit.remainingText }}</p>
            </div>
          </ui-card>
        </template>
        <template v-else>
          <ui-card v-for="n in 4" :key="n" class="h-[221px]" aria-label="Loading hours to limit">
            <div class="animate-pulse size-full rounded-xs bg-neutral-50" />
          </ui-card>
        </template>
      </div>
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
        <button type="button" class="flex items-center gap-0.5 -mr-1.5 h-11 pl-3 pr-1.5 rounded-full text-[13px] font-bold cursor-pointer hover:bg-neutral-50 active:bg-neutral-100">
          View all
          <Icon name="lucide:chevron-right" size="16" />
        </button>
      </div>
      <p v-if="documentsStatus === 'error'" class="text-text-secondary font-medium">Couldn't load your documents.</p>
      <ui-card v-else class="p-2!">
        <ul v-if="documents">
          <li
            v-for="doc in documents.documents"
            :key="doc.id"
            class="flex items-center justify-between gap-3 px-2 py-3 not-first:border-t not-first:border-border"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span class="flex items-center justify-center shrink-0 size-9 rounded-[10px] bg-background text-text-secondary">
                <Icon name="lucide:file-text" size="18" />
              </span>
              <div class="min-w-0">
                <p class="font-bold">{{ doc.label }}</p>
                <p class="text-sm font-medium text-text-secondary">{{ doc.expiryText }}</p>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1 shrink-0">
              <ui-badge :color="doc.badge.color">{{ doc.badge.label }}</ui-badge>
              <p class="text-sm font-semibold tabular-nums">{{ doc.remainingText }}</p>
            </div>
          </li>
        </ul>
        <ul v-else aria-label="Loading documents">
          <li v-for="n in 5" :key="n" class="flex items-center gap-3 px-2 py-3 not-first:border-t not-first:border-border">
            <span class="shrink-0 size-[46px] rounded-[10px] bg-neutral-50 animate-pulse" />
            <span class="flex-1 h-[46px] rounded-md bg-neutral-50 animate-pulse" />
          </li>
        </ul>
      </ui-card>
    </div>
  </div>
</template>