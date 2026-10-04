<script setup lang="ts">
type Color = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info'

interface Props {
  color?: Color
  variant?: 'dot' | 'icon' | 'plain'
  icon?: string
}
const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  variant: 'dot'
})

const DEFAULT_ICONS: Record<Color, string> = {
  primary: 'lucide:info',
  accent: 'lucide:star',
  success: 'lucide:check',
  warning: 'lucide:triangle-alert',
  danger: 'lucide:circle-alert',
  info: 'lucide:info'
}
const iconName = computed(() => props.icon ?? DEFAULT_ICONS[props.color])
</script>

<template>
  <span class="badge" :data-color="color" :data-variant="variant">
    <span v-if="variant === 'dot'" class="badge-dot" aria-hidden="true" />
    <Icon v-else-if="variant === 'icon'" :name="iconName" size="14" class="badge-icon" aria-hidden="true" />
    <slot />
  </span>
</template>

<style scoped lang="scss">
@reference "../../../assets/css/tailwind.css";

.badge {
  @apply inline-flex items-center gap-1.5 h-6 pl-2 pr-2.5 rounded-full text-xs font-bold whitespace-nowrap;

  &[data-variant=icon] {
    @apply h-[26px];
  }

  &[data-variant=plain] {
    @apply px-2.5;
  }

  &[data-color=primary] {
    @apply bg-primary-tint text-primary-ink;
    --badge-dot: var(--color-primary);
  }

  &[data-color=accent] {
    @apply bg-accent-tint text-accent-ink;
    --badge-dot: var(--color-accent);
  }

  &[data-color=success] {
    @apply bg-success-tint text-success-ink;
    --badge-dot: var(--color-success);
  }

  &[data-color=warning] {
    @apply bg-warning-tint text-warning-ink;
    --badge-dot: var(--color-warning);
  }

  &[data-color=danger] {
    @apply bg-danger-tint text-danger-ink;
    --badge-dot: var(--color-danger);
  }

  &[data-color=info] {
    @apply bg-info-tint text-info-ink;
    --badge-dot: var(--color-info);
  }
}

.badge-dot {
  @apply size-1.5 shrink-0 rounded-full bg-(--badge-dot);
}

.badge-icon {
  @apply shrink-0;
}
</style>
