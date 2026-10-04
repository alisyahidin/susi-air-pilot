<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})
</script>

<template>
  <div class="flex-1 flex flex-col min-w-0 justify-center">
    <ui-card class="flex flex-col items-center min-w-0 gap-1 py-8!">
      <div class="flex items-center justify-center rounded-full p-3 bg-background mb-3">
        <Icon name="lucide:clock" class="text-xl!" />
      </div>
      <h1 class="text-lg font-bold">Page coming soon</h1>
      <p class="text-text-secondary font-medium">This page is not available yet.</p>
    </ui-card>
  </div>
</template>