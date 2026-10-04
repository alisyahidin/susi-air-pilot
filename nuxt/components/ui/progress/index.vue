<script setup lang="ts">
interface Props {
  value?: number
  max?: number
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info'
  label?: string
}
const props = withDefaults(defineProps<Props>(), {
  value: 0,
  max: 100,
  color: 'primary'
})

const percent = computed(() => {
  if (props.max <= 0) return 0
  return Math.min(100, Math.max(0, (props.value / props.max) * 100))
})
</script>

<template>
  <div
    class="progress"
    role="progressbar"
    :aria-label="label"
    :aria-valuenow="value"
    aria-valuemin="0"
    :aria-valuemax="max"
    :data-color="color"
  >
    <div class="progress-bar" :style="{ width: `${percent}%` }" />
  </div>
</template>

<style scoped lang="scss">
@reference "../../../assets/css/tailwind.css";

// In the components layer so utility classes passed by the parent (e.g. h-2) still override
@layer components {
  .progress {
    @apply h-1.5 w-full overflow-hidden rounded-full bg-track;

    &[data-color=primary] { --progress-color: var(--color-primary); }
    &[data-color=accent] { --progress-color: var(--color-accent); }
    &[data-color=success] { --progress-color: var(--color-success); }
    &[data-color=warning] { --progress-color: var(--color-warning); }
    &[data-color=danger] { --progress-color: var(--color-danger); }
    &[data-color=info] { --progress-color: var(--color-info); }
  }

  .progress-bar {
    @apply h-full rounded-full bg-(--progress-color) transition-[width] duration-300 ease-out;
  }
}
</style>
