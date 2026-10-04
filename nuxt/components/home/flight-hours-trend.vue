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

type RangeKey = '1w' | '1m' | '3m' | '6m' | '1y'

/* ---------------- Dummy data, until GET /flight-hours/summary?range= is wired up ----------------
   The chart shows 15 days centred on today: 7 flown, today, 7 projected.
   Each point is the rolling total over the range's window, ending on that day. */
const TODAY = new Date(Date.UTC(2026, 4, 15)) // matches the topbar's "Fri, 15 May"
const OLD_PATTERN = [3.4, 0, 4.2, 2.9, 0, 0, 3.8, 4.6, 0, 2.6, 0]
const RECENT = [
  0, 0, 4.1, 0, 0, 3.5, 4.3, 0, 0, 3.2, 0, 0, 2.9, 4.1, 0,
  3.6, 0, 4.9, 0, 0, 0, 5.4, 7.1, 6.3, 6.9, 4.8, 6.2, 5.8, 5.4, 5.6,
  6.0, 0, 5.5, 6.2, 0, 4.0, 5.0
]
const DAILY = [...Array.from({ length: 372 }, (_, i) => OLD_PATTERN[i % 11]!), ...RECENT]
const TODAY_INDEX = 372 + 29

function rolling(index: number, days: number) {
  let sum = 0
  for (let k = index - days + 1; k <= index; k++) sum += DAILY[k] ?? 0
  return Math.round(sum * 10) / 10
}
/* ---------------- end of dummy data ---------------- */

const RANGES: Record<RangeKey, { days: number, limit: number, yMax: number, step: number }> = {
  '1w': { days: 7, limit: 40, yMax: 45, step: 10 },
  '1m': { days: 30, limit: 100, yMax: 125, step: 25 },
  '3m': { days: 90, limit: 300, yMax: 325, step: 100 },
  '6m': { days: 180, limit: 600, yMax: 625, step: 200 },
  '1y': { days: 365, limit: 1050, yMax: 1200, step: 300 }
}
const RANGE_KEYS = Object.keys(RANGES) as RangeKey[]
const CAUTION = 0.8 // at 80% of the limit a value counts as approaching it
const DAYS = 15
const TODAY_POS = 7
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

const range = ref<RangeKey>('1w')
const active = ref(TODAY_POS)
const chartRef = ref<{ chart?: ChartJS<'line'> }>()

// The highlight and tooltip are drawn by the overlay plugin, so repaint when the active day changes
watch(active, () => chartRef.value?.chart?.draw())

function selectRange(key: RangeKey) {
  range.value = key
  active.value = TODAY_POS
}

const fmt = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const fmtInt = (v: number) => v.toLocaleString('en-US')
const dateAt = (pos: number) => new Date(TODAY.getTime() + (pos - TODAY_POS) * 86_400_000)
const weekday = (d: Date, style: 'narrow' | 'short') => d.toLocaleDateString('en-US', { weekday: style, timeZone: 'UTC' })
const monthDay = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })

const config = computed(() => RANGES[range.value])
const values = computed(() =>
  Array.from({ length: DAYS }, (_, i) => rolling(TODAY_INDEX + i - TODAY_POS, config.value.days))
)

// Over-limit values extend the axis instead of being clipped
const yMax = computed(() => {
  const max = Math.max(...values.value)
  let y = config.value.yMax
  while (max > y) y += config.value.step
  return y
})

const points = computed(() =>
  values.value.map((value, i) => {
    const date = dateAt(i)
    const isProjected = i > TODAY_POS
    return {
      value,
      date,
      isToday: i === TODAY_POS,
      isProjected,
      isOver: value > config.value.limit,
      label: `${weekday(date, 'short')}, ${monthDay(date)}${isProjected ? ' (projected)' : ''}: ${fmt(value)} hours`
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
      borderDash: ctx => (ctx.p0DataIndex >= TODAY_POS ? [5, 4] : undefined),
      borderWidth: ctx => (ctx.p0DataIndex >= TODAY_POS ? 2 : undefined),
      backgroundColor: ctx => (ctx.p0DataIndex >= TODAY_POS ? 'transparent' : undefined)
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
    const colWidth = chartArea.width / DAYS

    const activePoint = meta.data[active.value]
    if (activePoint) {
      ctx.save()
      ctx.fillStyle = 'rgba(14, 33, 56, 0.05)'
      ctx.beginPath()
      ctx.roundRect(activePoint.x - colWidth / 2, chartArea.top, colWidth, chartArea.height, 8)
      ctx.fill()
      ctx.restore()
    }

    const today = meta.data[TODAY_POS]
    if (today) {
      ctx.save()
      ctx.fillStyle = points.value[TODAY_POS]!.isOver ? 'rgba(230, 55, 87, 0.22)' : 'rgba(34, 197, 232, 0.28)'
      ctx.beginPath()
      ctx.arc(today.x, today.y, 11, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  },
  afterDraw(chart) {
    const point = chart.getDatasetMeta(0).data[active.value]
    if (!point) return
    const next = { x: Math.round(point.x), y: Math.round(point.y) }
    if (next.x !== tooltipPos.value?.x || next.y !== tooltipPos.value?.y) tooltipPos.value = next
  }
}

const chartOptions = computed<ChartOptions<'line'>>(() => {
  const { limit, step } = config.value
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
          if (!ticks.some(t => t.value === limit)) ticks.push({ value: limit })
          scale.ticks = ticks.sort((a, b) => a.value - b.value)
        },
        grid: {
          // The limit has its own dashed line, so hide the grid line under it
          color: ctx => (ctx.tick?.value === limit ? 'transparent' : COLORS.grid),
          drawTicks: false
        },
        ticks: {
          padding: 10,
          color: ctx => (ctx.tick.value === limit ? COLORS.dangerInk : COLORS.textSecondary),
          font: ctx => ({ family: FONT, size: 11, weight: ctx.tick?.value === limit ? 800 : 600 }),
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
            yMin: limit,
            yMax: yMax.value,
            backgroundColor: 'rgba(230, 55, 87, 0.05)',
            borderWidth: 0,
            drawTime: 'beforeDatasetsDraw'
          },
          limitLine: {
            type: 'line',
            yMin: limit,
            yMax: limit,
            borderColor: COLORS.danger,
            borderWidth: 2,
            borderDash: [6, 4],
            drawTime: 'beforeDatasetsDraw',
            label: {
              display: true,
              content: `Limit ${fmtInt(limit)} h`,
              position: 'end',
              yAdjust: -12,
              backgroundColor: COLORS.dangerTint,
              color: COLORS.dangerInk,
              font: { family: FONT, size: 11, weight: 700 },
              padding: { x: 8, y: 2 },
              borderRadius: 999
            }
          },
          todayLine: {
            type: 'line',
            xMin: TODAY_POS,
            xMax: TODAY_POS,
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
  const point = points.value[i]!
  const pos = tooltipPos.value
  const gap = Math.round(Math.abs(config.value.limit - point.value) * 10) / 10
  // Keep the tooltip inside the chart near the edges, and below the point when it sits near the top
  const shiftX = i <= 3 ? '-15%' : i >= 11 ? '-85%' : '-50%'
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

const todayValue = computed(() => values.value[TODAY_POS]!)
const todayStatus = computed(() => {
  const ratio = todayValue.value / config.value.limit
  if (ratio > 1) return { color: 'danger', label: 'Over limit' } as const
  if (ratio === 1) return { color: 'danger', label: 'At limit' } as const
  if (ratio >= CAUTION) return { color: 'warning', label: 'Approaching limit' } as const
  return { color: 'success', label: 'Within limit' } as const
})
</script>

<template>
  <ui-card class="flex flex-col gap-4">
    <div class="flex flex-col gap-3">
      <div class="flex items-center gap-4">
        <div>
          <p class="text-[24px] leading-8 font-extrabold tabular-nums">
            {{ fmt(todayValue) }} <span class="text-[15px] font-bold text-text-secondary">h</span>
          </p>
          <p class="text-sm font-medium text-text-secondary">Rolling {{ config.days }}-day total as of today</p>
        </div>
        <ui-badge :color="todayStatus.color" variant="plain">{{ todayStatus.label }}</ui-badge>
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

    <div class="flex flex-col gap-2.5">
      <div class="relative h-[206px]">
        <ClientOnly>
          <Line
            ref="chartRef"
            :data="chartData"
            :options="chartOptions"
            :plugins="[overlayPlugin]"
            role="img"
            :aria-label="`Rolling ${config.days}-day flight hours for ${points.length} days around today, against a ${fmtInt(config.limit)} hour limit`"
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
      <div class="grid grid-cols-15 ml-11">
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
