<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  type ChartData,
  type ChartOptions,
  type Plugin
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import { Line } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Filler, annotationPlugin)

// Axis tick spacing for each range: a display choice, so it lives here rather than in the API
const STEPS: Record<SummaryRange, number> = { '1w': 10, '1m': 25, '3m': 100, '6m': 200, '1y': 300 }
const RANGE_KEYS = Object.keys(STEPS) as SummaryRange[]
const Y_AXIS_WIDTH = 44 // fixed so the HTML date row below lines up with the plot

// Canvas can't read CSS variables, so these mirror the theme tokens in tailwind.css
const COLORS = {
  info: '#22C5E8',
  danger: '#E63757',
  dangerInk: '#C01F42',
  dangerTint: '#FDEBEF',
  primary: '#0E2138',
  textSecondary: '#6B7280',
  grid: '#E8EBF0',
  white: '#FFFFFF'
}
const FONT = '"Plus Jakarta Sans", system-ui, sans-serif'

const range = ref<SummaryRange>('1w')
const { data: summary, status } = useFlightHoursSummary(range)
const loading = computed(() => status.value === 'pending')

const DAYS = computed(() => summary.value?.points.length ?? 15)
const TODAY_POS = computed(() => Math.max(0, summary.value?.points.findIndex(p => p.date === summary.value!.date) ?? 7))

// The day whose tooltip is shown; null until the pilot hovers, taps or focuses one
const active = ref<number | null>(null)
const chartRef = ref<{ chart?: ChartJS<'line'> }>()

// New data (first load or another range): no tooltip until the pilot picks a day again
watch(summary, () => { active.value = null })

// The highlight and tooltip are drawn by the overlay plugin, so repaint when the active day changes
watch(active, () => chartRef.value?.chart?.draw())

function selectRange(key: SummaryRange) {
  range.value = key
}

const fmt = (v: number) => v.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const fmtInt = (v: number) => v.toLocaleString('id-ID')
const weekday = (d: Date, style: 'narrow' | 'short') => d.toLocaleDateString('en-US', { weekday: style, timeZone: 'UTC' })
const monthDay = (d: Date) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' })

const limit = computed(() => summary.value?.limit ?? 0)
const values = computed(() => summary.value?.points.map(p => p.hours) ?? [])

// Over-limit values extend the axis instead of being clipped
const yMax = computed(() => {
  const step = STEPS[summary.value?.range ?? range.value]
  const max = Math.max(...values.value, 0)
  let y = summary.value?.max ?? step
  while (max > y) y += step
  return y
})

const points = computed(() =>
  (summary.value?.points ?? []).map((point, i) => {
    const date = new Date(`${point.date}T00:00:00Z`)
    return {
      value: point.hours,
      date,
      isToday: i === TODAY_POS.value,
      isProjected: point.projected,
      isOver: point.status === 'over',
      label: `${weekday(date, 'short')}, ${monthDay(date)}${point.projected ? ' (projected)' : ''}: ${fmt(point.hours)} hours`
    }
  })
)

const chartData = computed<ChartData<'line'>>(() => ({
  labels: points.value.map(p => monthDay(p.date)),
  datasets: [{
    data: values.value,
    borderColor: COLORS.info,
    borderWidth: 2.5,
    borderJoinStyle: 'round',
    tension: 0,
    fill: 'origin',
    backgroundColor: 'rgba(34, 197, 232, 0.14)',
    segment: {
      // Projected days: dashed, thinner and unfilled
      borderDash: ctx => (ctx.p0DataIndex >= TODAY_POS.value ? [5, 4] : undefined),
      borderWidth: ctx => (ctx.p0DataIndex >= TODAY_POS.value ? 2 : undefined),
      backgroundColor: ctx => (ctx.p0DataIndex >= TODAY_POS.value ? 'transparent' : undefined)
    },
    pointRadius: points.value.map(p => (p.isToday ? 7 : 5)),
    pointHoverRadius: points.value.map(p => (p.isToday ? 7 : 5)),
    pointBorderWidth: 2,
    pointHoverBorderWidth: 2,
    pointBackgroundColor: points.value.map(p => (p.isProjected ? COLORS.white : p.isOver ? COLORS.danger : COLORS.info)),
    pointBorderColor: points.value.map(p => (p.isProjected ? (p.isOver ? COLORS.danger : COLORS.info) : COLORS.white))
  }]
}))

// Draws what the core chart can't: the highlighted day column and the halo around today's point.
// It also reports the active point's position so the HTML tooltip can follow it.
const tooltipPos = ref<{ x: number, y: number } | null>(null)
const overlayPlugin: Plugin<'line'> = {
  id: 'trendOverlay',
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea } = chart
    const meta = chart.getDatasetMeta(0)
    const colWidth = chartArea.width / DAYS.value

    const activePoint = active.value === null ? undefined : meta.data[active.value]
    if (activePoint) {
      ctx.save()
      ctx.fillStyle = 'rgba(14, 33, 56, 0.05)'
      ctx.beginPath()
      ctx.roundRect(activePoint.x - colWidth / 2, chartArea.top, colWidth, chartArea.height, 8)
      ctx.fill()
      ctx.restore()
    }

    const today = meta.data[TODAY_POS.value]
    if (today) {
      ctx.save()
      ctx.fillStyle = points.value[TODAY_POS.value]?.isOver ? 'rgba(230, 55, 87, 0.22)' : 'rgba(34, 197, 232, 0.28)'
      ctx.beginPath()
      ctx.arc(today.x, today.y, 11, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  },
  afterDraw(chart) {
    const point = active.value === null ? undefined : chart.getDatasetMeta(0).data[active.value]
    if (!point) {
      tooltipPos.value = null
      return
    }
    const next = { x: Math.round(point.x), y: Math.round(point.y) }
    if (next.x !== tooltipPos.value?.x || next.y !== tooltipPos.value?.y) tooltipPos.value = next
  }
}

const chartOptions = computed<ChartOptions<'line'>>(() => {
  const limitValue = limit.value
  const step = STEPS[summary.value?.range ?? range.value]
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    layout: { padding: { top: 6 } },
    interaction: { mode: 'index', intersect: false },
    onHover: (_event, elements) => {
      const index = elements[0]?.index
      if (index !== undefined && index !== active.value) active.value = index
    },
    onClick: (_event, elements) => {
      const index = elements[0]?.index
      if (index !== undefined) active.value = index
    },
    scales: {
      x: {
        display: false,
        offset: true // centres each day in its own column, matching the date row
      },
      y: {
        min: 0,
        max: yMax.value,
        border: { display: false },
        afterFit: (scale) => { scale.width = Y_AXIS_WIDTH },
        // Always show the limit as a tick, even when it isn't a multiple of the step (e.g. 1,050)
        afterBuildTicks: (scale) => {
          const ticks = []
          for (let t = 0; t <= yMax.value; t += step) ticks.push({ value: t })
          if (!ticks.some(t => t.value === limitValue)) ticks.push({ value: limitValue })
          scale.ticks = ticks.sort((a, b) => a.value - b.value)
        },
        grid: {
          // The limit has its own dashed line, so hide the grid line under it
          color: ctx => (ctx.tick?.value === limitValue ? 'transparent' : COLORS.grid),
          drawTicks: false
        },
        ticks: {
          padding: 10,
          color: ctx => (ctx.tick.value === limitValue ? COLORS.dangerInk : COLORS.textSecondary),
          font: ctx => ({ family: FONT, size: 11, weight: ctx.tick?.value === limitValue ? 800 : 600 }),
          callback: value => fmtInt(Number(value))
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      annotation: {
        annotations: {
          overLimit: {
            type: 'box',
            yMin: limitValue,
            yMax: yMax.value,
            backgroundColor: 'rgba(230, 55, 87, 0.05)',
            borderWidth: 0,
            drawTime: 'beforeDatasetsDraw'
          },
          limitLine: {
            type: 'line',
            yMin: limitValue,
            yMax: limitValue,
            borderColor: COLORS.danger,
            borderWidth: 2,
            borderDash: [6, 4],
            drawTime: 'beforeDatasetsDraw',
            label: {
              display: true,
              content: `Limit ${fmtInt(limitValue)} h`,
              position: 'end',
              // Under the line, inside the plot
              yAdjust: 12,
              backgroundColor: COLORS.dangerTint,
              color: COLORS.dangerInk,
              font: { family: FONT, size: 11, weight: 700 },
              padding: { x: 8, y: 2 },
              borderRadius: 999
            }
          },
          todayLine: {
            type: 'line',
            xMin: TODAY_POS.value,
            xMax: TODAY_POS.value,
            borderColor: 'rgba(14, 33, 56, 0.4)',
            borderWidth: 1,
            borderDash: [3, 3],
            drawTime: 'beforeDatasetsDraw'
          }
        }
      }
    }
  }
})

const tooltip = computed(() => {
  const i = active.value
  const point = i === null ? undefined : points.value[i]
  const pos = tooltipPos.value
  if (i === null || !point) return { visible: false, left: 0, top: 0, transform: '', date: '', value: '', note: '', isOver: false }
  const gap = Math.round(Math.abs(limit.value - point.value) * 10) / 10
  // Keep the tooltip inside the chart near the edges, and below the point when it sits near the top
  const shiftX = i <= 3 ? '-15%' : i >= DAYS.value - 4 ? '-85%' : '-50%'
  const shiftY = pos && pos.y < 84 ? '18px' : 'calc(-100% - 16px)'
  return {
    visible: !!pos,
    left: pos?.x ?? 0,
    top: pos?.y ?? 0,
    transform: `translate(${shiftX}, ${shiftY})`,
    date: `${weekday(point.date, 'short')}, ${monthDay(point.date)} ${point.date.getUTCFullYear()}${point.isToday ? ' · Today' : point.isProjected ? ' · Projected' : ''}`,
    value: fmt(point.value),
    note: `${fmt(gap)} h ${point.isOver ? 'over' : 'under'} limit`,
    isOver: point.isOver
  }
})

</script>

<template>
  <ui-card class="flex flex-col gap-4">
    <div class="flex flex-col gap-3">
      <div class="flex items-end justify-between gap-4">
        <div>
          <template v-if="summary">
            <p class="text-xl leading-8 font-extrabold tabular-nums">
              {{ fmt(summary.today.hours) }} <span class="text-[15px] font-bold text-text-secondary">h</span>
            </p>
            <p class="text-sm font-medium text-text-secondary">Rolling {{ summary.windowDays }}-day total as of today</p>
          </template>
          <template v-else>
            <span class="block h-9 w-24 rounded-md bg-background animate-pulse" />
            <span class="block h-4 w-44 mt-0.5 rounded-md bg-background animate-pulse" />
          </template>
        </div>
        <ui-badge v-if="summary" :color="summary.todayBadge.color" variant="icon" class="text-sm!">{{ summary.todayBadge.label }}</ui-badge>
      </div>

      <div role="group" aria-label="Chart range" class="flex gap-0.5 p-0.5 h-11 rounded-xl bg-track">
        <button
          v-for="key in RANGE_KEYS"
          :key="key"
          type="button"
          :aria-pressed="key === range"
          class="flex-1 rounded-[10px] text-[13px] font-bold cursor-pointer transition-colors"
          :class="key === range ? 'bg-primary text-white shadow-xs' : 'text-neutral-700 hover:bg-neutral-100'"
          @click="selectRange(key)"
        >
          {{ key }}
        </button>
      </div>
    </div>

    <p v-if="status === 'error' && !summary" class="text-text-secondary font-medium">Couldn't load your flight hours trend.</p>
    <div v-else-if="!summary" class="h-[251px] rounded-xl bg-background animate-pulse" aria-label="Loading flight hours trend" />
    <div v-else class="flex flex-col gap-2.5 transition-opacity" :class="{ 'opacity-50': loading }" :aria-busy="loading">
      <div class="relative h-[206px]" @mouseleave="active = null">
        <ClientOnly>
          <Line
            ref="chartRef"
            :data="chartData"
            :options="chartOptions"
            :plugins="[overlayPlugin]"
            role="img"
            :aria-label="`Rolling ${summary.windowDays}-day flight hours for ${points.length} days around today, against a ${fmtInt(summary.limit)} hour limit`"
          />
        </ClientOnly>

        <div
          v-if="tooltip.visible"
          role="status"
          class="absolute z-10 pointer-events-none whitespace-nowrap flex flex-col gap-0.5 px-3 py-2.5 rounded-[10px] bg-primary text-white shadow-lg"
          :style="{ left: `${tooltip.left}px`, top: `${tooltip.top}px`, transform: tooltip.transform }"
        >
          <span class="text-xs font-semibold text-[#A9B4C4]">{{ tooltip.date }}</span>
          <span class="text-lg font-extrabold tabular-nums">{{ tooltip.value }} h</span>
          <span class="text-xs font-bold" :class="tooltip.isOver ? 'text-[#FF9DB0]' : 'text-[#7EE0C0]'">{{ tooltip.note }}</span>
        </div>
      </div>

      <!-- Date row; each day is also a keyboard target that shows its tooltip -->
      <div class="grid grid-cols-15 ml-11" @focusout="(event: FocusEvent) => { if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) active = null }">
        <button
          v-for="(point, i) in points"
          :key="i"
          type="button"
          :aria-label="point.label"
          class="flex flex-col items-center gap-0.5 rounded-md cursor-pointer"
          @click="active = i"
          @focus="active = i"
        >
          <span class="text-[10px] font-semibold text-text-secondary">{{ weekday(point.date, 'narrow') }}</span>
          <span
            class="flex items-center justify-center min-w-[18px] h-[18px] px-0.5 rounded-full text-[10px] font-bold tabular-nums"
            :class="point.isToday ? 'bg-primary text-white' : 'text-text-primary'"
          >
            {{ point.date.getUTCDate() }}
          </span>
        </button>
      </div>
    </div>

    <div class="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-text-secondary">
      <span class="flex items-center gap-1.5"><span class="w-[18px] border-t-[3px] border-info rounded-xs" />Flown</span>
      <span class="flex items-center gap-1.5"><span class="w-[18px] border-t-2 border-dashed border-info" />Projected</span>
      <span class="flex items-center gap-1.5"><span class="w-[18px] border-t-2 border-dashed border-danger" />Regulatory limit</span>
      <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-danger" />Over limit</span>
      <span class="flex items-center gap-1.5"><span class="size-3.5 rounded-full bg-primary" />Today</span>
    </div>
  </ui-card>
</template>
