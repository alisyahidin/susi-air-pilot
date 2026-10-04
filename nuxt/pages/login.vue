<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const username = ref('')
const password = ref('')
</script>

<template>
  <header class="bg-primary flex items-center gap-2 p-4 h-16">
    <img src="/logo-white.png" class="h-8" fetchpriority="high" />
  </header>
  <main class="flex flex-col items-center justify-center flex-1 gap-8 p-4">
    <ui-card>
      <h2 class="text-xl font-bold">Welcome back</h2>
      <p class="text-text-secondary font-medium mt-2">Sign in to access your flight hours, documents, and duty schedule.</p>
      <form class="flex flex-col gap-4 mt-6" @submit.prevent>
        <ui-input v-model="username" label="Username" placeholder="Enter your username" autocomplete="username" autocapitalize="none" spellcheck="false">
          <template #prefix><Icon name="lucide:user" /></template>
        </ui-input>
        <ui-input v-model="password" label="Password" type="password" placeholder="Enter your password" autocomplete="current-password">
          <template #prefix><Icon name="lucide:lock" /></template>
        </ui-input>
        <ui-button class="w-full mt-2">Sign In</ui-button>
      </form>
    </ui-card>
    <p class="text-text-secondary">© 2026 PT. ASI Pudjiastuti Aviation</p>
  </main>
</template>