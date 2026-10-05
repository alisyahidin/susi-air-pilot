<script setup lang="ts">
const { data, status, refresh } = useDocuments()
const failed = computed(() => status.value === 'error')
</script>

<template>
  <ui-card class="relative p-2!">
    <ul v-if="data">
      <li
        v-for="doc in data.documents"
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
    <ul v-else :aria-label="failed ? undefined : 'Loading documents'" :aria-hidden="failed || undefined">
      <li v-for="n in 5" :key="n" class="flex items-center gap-3 px-2 py-3 not-first:border-t not-first:border-border">
        <span class="shrink-0 size-11.5 rounded-[10px] bg-neutral-50" :class="{ 'animate-pulse': !failed }" />
        <span class="flex-1 h-11.5 rounded-md bg-neutral-50" :class="{ 'animate-pulse': !failed }" />
      </li>
    </ul>
    <ui-error-state
      v-if="failed && !data"
      class="absolute inset-0 rounded-xl bg-white/85 backdrop-blur-[2px]"
      title="Couldn't load your documents"
      description="Your licence and certificate expiry dates aren't available right now. Check your connection and try again."
      @retry="refresh()"
    />
  </ui-card>
</template>