<script setup lang="ts">
import { type DateValue, isSameDay, isSameMonth, parseDate } from '@internationalized/date'
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarNext,
  CalendarPrev,
  CalendarRoot
} from 'reka-ui'
import type { ScheduleDay } from '~/composables/useSchedules'
import UiButton from '~/components/ui/button/index.vue'

const today = parseDate(useToday())

const placeholder = shallowRef<DateValue>(today)

const { data: schedule, status } = useMonthSchedule(placeholder)
const loading = computed(() => status.value === 'pending')

const entries = computed<Record<number, ScheduleDay>>(() =>
  schedule.value?.year === placeholder.value.year && schedule.value?.month === placeholder.value.month
    ? Object.fromEntries(schedule.value.days.map(day => [Number(day.date.slice(8)), day]))
    : {}
)

const legend = computed(() => schedule.value?.legend ?? [])

const monthLabel = computed(() =>
  placeholder.value.toDate('UTC').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
)
const isCurrentMonth = computed(() => isSameMonth(placeholder.value, today))
const isFutureMonth = computed(() => placeholder.value.compare(today) > 0 && !isCurrentMonth.value)

const dutyLabels = computed(() => Object.fromEntries(legend.value.map(type => [type.code, type.label])))

function inkOn(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b! > 0.21 ? '#0E2138' : '#FFFFFF'
}

function dayInfo(date: DateValue) {
  const entry = entries.value[date.day]
  const remaining = entry ? Math.max(0, entry.countSchedules - entry.countLogbooks) : 0
  const color = entry?.baseColor || '#9AA3B0'
  const isToday = isSameDay(date, today)
  const isPast = date.compare(today) <= 0
  const weekday = date.toDate('UTC').toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
  return {
    entry,
    remaining,
    isToday,
    isPast,
    pillStyle: { backgroundColor: color, color: inkOn(color) },
    label: `${weekday}${isToday ? ', today' : ''}, ${entry ? `${dutyLabels.value[entry.dutyType] ?? entry.dutyType} (${entry.baseName}), ${remaining ? `${remaining} remaining` : 'logbook complete'}` : 'no duty'}`
  }
}

const dutyDays = computed(() => Object.keys(entries.value).length)
const summary = computed(() => {
  if (isFutureMonth.value) return { color: 'primary', text: 'No entries due yet' } as const
  const due = Object.entries(entries.value)
    .filter(([day]) => placeholder.value.set({ day: Number(day) }).compare(today) <= 0)
    .reduce((sum, [, e]) => sum + Math.max(0, e.countSchedules - e.countLogbooks), 0)
  if (due > 0) return { color: 'warning', text: `${due} logbook ${due === 1 ? 'entry' : 'entries'} remaining` } as const
  return { color: 'success', text: 'Logbook up to date' } as const
})

function openDate(date: DateValue | DateValue[] | undefined) {
  if (date && !Array.isArray(date)) navigateTo(`/schedules/${date.toString()}`)
}
</script>

<template>
  <CalendarRoot
    v-slot="{ grid, weekDays }"
    v-model:placeholder="placeholder"
    :week-starts-on="1"
    weekday-format="short"
    locale="en-US"
    prevent-deselect
    class="flex flex-col gap-4"
    @update:model-value="openDate"
  >
    <div class="flex items-center justify-between gap-x-0 gap-y-3">
      <div class="flex items-baseline gap-x-2 gap-y-1">
        <h1 class="text-lg leading-8 font-bold tracking-[-0.01em]">Schedule</h1>
        <span aria-live="polite" class="font-bold text-text-secondary line-clamp-1">{{ monthLabel }}</span>
      </div>
      <div class="flex items-center gap-1">
        <ui-button v-if="!isCurrentMonth" color="white" class="h-8! font-bold" @click="placeholder = today">
          Today
        </ui-button>
        <CalendarPrev :as="UiButton" color="white" class="flex items-center justify-center p-0! size-8!" aria-label="Previous month">
          <Icon name="lucide:chevron-left" size="20" />
        </CalendarPrev>
        <CalendarNext :as="UiButton" color="white" class="flex items-center justify-center p-0! size-8!" aria-label="Next month">
          <Icon name="lucide:chevron-right" size="20" />
        </CalendarNext>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2 min-h-7">
      <span v-if="loading" class="flex items-center gap-2 h-7 text-sm font-bold text-text-secondary">
        <Icon name="lucide:loader-circle" size="16" class="animate-spin" />
        Loading schedule…
      </span>
      <template v-else>
        <span class="flex items-center h-7 px-3 rounded-full bg-white border border-border text-sm font-bold">{{ dutyDays }} scheduled days</span>
        <ui-badge :color="summary.color">{{ summary.text }}</ui-badge>
      </template>
    </div>

    <ui-card class="px-1! py-2!">
      <CalendarGrid
        v-for="month in grid"
        :key="month.value.toString()"
        class="w-full table-fixed border-separate border-spacing-1 transition-opacity duration-200"
        :class="{ 'opacity-35': loading }"
      >
        <CalendarGridHead>
          <CalendarGridRow>
            <CalendarHeadCell v-for="day in weekDays" :key="day" class="h-7 px-1 text-left text-xs font-bold text-text-secondary">
              {{ day }}
            </CalendarHeadCell>
          </CalendarGridRow>
        </CalendarGridHead>
        <CalendarGridBody>
          <CalendarGridRow v-for="(week, i) in month.rows" :key="i">
            <CalendarCell v-for="date in week" :key="date.toString()" :date="date" class="p-0">
              <CalendarCellTrigger
                v-if="isSameMonth(date, month.value)"
                v-slot="{ dayValue }"
                :day="date"
                :month="month.value"
                :aria-label="dayInfo(date).label"
                class="schedule-day"
                :class="{
                  'schedule-day--duty': dayInfo(date).entry,
                  'schedule-day--today': dayInfo(date).isToday
                }"
              >
                <span
                  class="self-center flex items-center justify-center shrink-0 min-w-7 h-7 px-1 rounded-full text-[16px] font-extrabold tracking-[-0.01em] tabular-nums"
                  :class="dayInfo(date).isToday ? 'bg-primary text-white' : dayInfo(date).entry ? 'text-text-primary' : 'text-text-secondary'"
                >
                  {{ dayValue }}
                </span>
                <span
                  v-if="dayInfo(date).entry"
                  class="flex items-center justify-center shrink-0 h-4.5 px-0.5 rounded-md overflow-hidden text-[9.5px] font-extrabold tracking-[0.02em]"
                  :style="dayInfo(date).pillStyle"
                >
                  {{ dayInfo(date).entry!.baseName }}
                </span>
                <!-- Logbook detail: small and worded, under the duty, so it can't be read as a date -->
                <template v-if="dayInfo(date).entry">
                  <span v-if="!dayInfo(date).remaining" class="flex items-center justify-center shrink-0 h-4 text-success-ink">
                    <Icon name="lucide:check" size="12" />
                  </span>
                  <span
                    v-else
                    class="flex items-center justify-center shrink-0 h-4 rounded-[5px] text-[9.5px] font-extrabold whitespace-nowrap tabular-nums"
                    :class="dayInfo(date).isPast ? 'bg-warning-tint text-warning-ink' : 'text-text-secondary'"
                  >
                    {{ dayInfo(date).remaining }} left
                  </span>
                </template>
                <span v-else class="text-center text-[10px] leading-4.5 font-semibold text-text-secondary">Off</span>
              </CalendarCellTrigger>
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </ui-card>

    <div class="space-y-2">
      <p class="font-bold text-lg">Duty types</p>
      <ui-card class="flex flex-col gap-4">
        <ul class="grid grid-cols-2 gap-x-4 gap-y-3">
          <li v-if="status !== 'success'" v-for="(_, index) in [... new Array(10)]" :key="index" class="flex items-center gap-1.5 h-5">
            <span class="size-3.5 shrink-0 rounded-sm bg-neutral-50 animate-pulse" />
            <span class="h-3.5 w-8/12 shrink-0 rounded-sm bg-neutral-50 animate-pulse" />
          </li>
          <li v-else v-for="type in legend" :key="type.code" class="flex items-start gap-1.5 text-[13px] h-5">
            <span class="size-3.5 shrink-0 rounded-sm mt-0.5" :style="{ backgroundColor: type.color }" />
            <span class="font-extrabold">{{ type.code }}</span>
            <span class="font-medium text-text-secondary">{{ type.label }}</span>
          </li>
        </ul>
        <div class="border-t border-track" />
        <ul class="grid grid-cols-1 gap-x-4 gap-y-2.5 text-[13px] font-semibold text-text-secondary">
          <li class="flex items-center gap-2">
            <span class="flex items-center justify-center shrink-0 size-5 rounded-full bg-success-tint text-success-ink"><Icon name="lucide:check" size="12" /></span>
            Logbook complete
          </li>
          <li class="flex items-center gap-2">
            <span class="flex items-center justify-center shrink-0 size-5 rounded-full bg-warning text-text-primary text-xs font-extrabold">2</span>
            Logbook entries remaining
          </li>
          <li class="flex items-center gap-2">
            <span class="flex items-center justify-center shrink-0 size-5 rounded-full bg-track text-text-primary text-xs font-extrabold">2</span>
            Upcoming duties
          </li>
          <li class="flex items-center gap-2">
            <span class="shrink-0 size-5 rounded-md border border-dashed border-neutral-400 bg-background" />
            No duty scheduled
          </li>
          <li class="flex items-center gap-2">
            <span class="shrink-0 size-5 rounded-md border-2 border-primary bg-white" />
            Today
          </li>
        </ul>
      </ui-card>
    </div>
  </CalendarRoot>
</template>

<style scoped lang="scss">
@reference "../../assets/css/tailwind.css";

.schedule-day {
  @apply flex flex-col items-stretch gap-1 min-w-0 h-21 px-1 py-[5px] rounded-[10px] overflow-hidden cursor-pointer outline-none transition-shadow;
  @apply bg-background border border-dashed border-neutral-300;

  &--duty {
    @apply bg-white border-solid border-border;
  }

  &--today {
    @apply border-2 border-solid border-primary;
  }

  &:hover {
    @apply ring-1 ring-primary/20;
  }

  &:active {
    @apply ring-primary/40;
  }

  &:focus-visible {
    @apply outline-2 outline-offset-2 outline-primary;
  }
}
</style>
