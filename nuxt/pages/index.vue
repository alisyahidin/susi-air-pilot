<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const title = 'Susi Air | Pilot App'
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
  </div>
</template>