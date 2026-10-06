<script setup lang="ts">
const { data, status, refresh } = useHoursToLimit()
const failed = computed(() => status.value === 'error')
</script>

<template>
  <div class="relative grid grid-cols-2 gap-2">
    <template v-if="data">
      <ui-card v-for="limit in data.limits" :key="limit.period" class="flex flex-col min-w-0 items-start gap-2">
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
      <ui-card v-for="n in 4" :key="n" class="h-[221px]" :aria-label="failed ? undefined : 'Loading hours to limit'" :aria-hidden="failed || undefined">
        <div class="size-full rounded-xs bg-neutral-50" :class="{ 'animate-pulse': !failed }" />
      </ui-card>
      <ui-error-state
        v-if="failed"
        class="absolute inset-0 rounded-xl bg-white/85 backdrop-blur-[2px]"
        title="Couldn't load your hours to limit"
        description="Your daily, weekly, monthly and annual totals aren't available right now. Check your connection and try again."
        @retry="refresh()"
      />
    </template>
  </div>
</template>