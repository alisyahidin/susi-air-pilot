<script setup lang="ts">
interface Props {
  title: string
  description?: string
  retryLabel?: string
}
withDefaults(defineProps<Props>(), {
  retryLabel: 'Try again'
})

defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="error-state" role="alert">
    <span class="error-state-icon" aria-hidden="true">
      <Icon name="lucide:cloud-alert" size="22" />
    </span>
    <div class="error-state-text">
      <p class="error-state-title">{{ title }}</p>
      <p v-if="description" class="error-state-description">{{ description }}</p>
    </div>
    <ui-button color="white" class="error-state-retry" @click="$emit('retry')">
      <Icon name="lucide:rotate-cw" size="16" />
      {{ retryLabel }}
    </ui-button>
  </div>
</template>

<style scoped lang="scss">
@reference "../../../assets/css/tailwind.css";

// In the components layer so a parent's utility classes (e.g. absolute inset-0) apply
@layer components {
  .error-state {
    @apply flex flex-col items-center justify-center gap-3 px-6 py-8 text-center;
  }

  .error-state-icon {
    @apply flex items-center justify-center size-12 rounded-full bg-danger-tint text-danger-ink;
  }

  .error-state-text {
    @apply flex flex-col gap-1 max-w-72;
  }

  .error-state-title {
    @apply text-lg font-bold text-text-primary;
  }

  .error-state-description {
    @apply font-medium text-text-secondary;
  }

  .error-state-retry {
    @apply flex items-center gap-2 font-bold!;
  }
}
</style>
