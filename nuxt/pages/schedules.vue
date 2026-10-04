<script setup lang="ts">
// Parent route for /schedules and /schedules/:date, so the Schedule nav item stays active on both
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})
</script>

<template>
  <NuxtPage />
</template>
