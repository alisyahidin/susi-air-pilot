<script setup lang="ts">
import { FetchError } from 'ofetch'

definePageMeta({
  middleware: 'auth'
})

const { login } = useAuth()

const username = ref('')
const password = ref('')
const loading = ref(false)
const fieldErrors = ref<{ username?: string, password?: string }>({})
const formError = ref('')

watch(username, () => { fieldErrors.value.username = undefined; formError.value = '' })
watch(password, () => { fieldErrors.value.password = undefined; formError.value = '' })

async function submit() {
  if (loading.value) return

  fieldErrors.value = {
    username: username.value.trim() ? undefined : 'Enter your username.',
    password: password.value ? undefined : 'Enter your password.'
  }
  formError.value = ''
  if (fieldErrors.value.username || fieldErrors.value.password) return

  loading.value = true
  try {
    await login({ username: username.value, password: password.value })
    await navigateTo('/', { replace: true })
  } catch (error) {
    if (error instanceof FetchError && error.statusCode === 401) {
      formError.value = 'Incorrect username or password. Check your details and try again.'
    } else if (error instanceof FetchError && error.statusCode === 400) {
      const errors = error.data?.errors ?? {}
      fieldErrors.value = { username: errors.username?.[0], password: errors.password?.[0] }
    } else {
      formError.value = 'Couldn\'t reach the server. Check your connection and try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <header class="bg-primary flex items-center gap-2 p-4 h-16">
    <img src="/logo-white.png" class="h-8" fetchpriority="high" />
  </header>
  <main class="flex flex-col items-center justify-center flex-1 gap-8 p-4">
    <ui-card>
      <h2 class="text-xl font-bold">Welcome back</h2>
      <p class="text-text-secondary font-medium mt-2">Sign in to access your flight hours, documents, and duty schedule.</p>

      <div
        v-if="formError"
        role="alert"
        class="flex items-start gap-2.5 mt-6 p-3 rounded-xl bg-danger-tint border border-[#F7C4CF] text-danger-ink text-[13px] leading-5 font-semibold"
      >
        <Icon name="lucide:circle-alert" size="18" class="shrink-0 mt-px" />
        <span>{{ formError }}</span>
      </div>

      <form class="flex flex-col gap-4 mt-6" novalidate @submit.prevent="submit">
        <ui-input
          v-model="username"
          label="Username"
          placeholder="Enter your username"
          autocomplete="username"
          autocapitalize="none"
          spellcheck="false"
          :disabled="loading"
          :error="fieldErrors.username"
        >
          <template #prefix><Icon name="lucide:user" /></template>
        </ui-input>
        <ui-input
          v-model="password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          autocomplete="current-password"
          :disabled="loading"
          :error="fieldErrors.password"
        >
          <template #prefix><Icon name="lucide:lock" /></template>
        </ui-input>
        <ui-button type="submit" class="w-full mt-2 flex items-center justify-center gap-2.5" :disabled="loading" :aria-busy="loading">
          <Icon v-if="loading" name="lucide:loader-circle" size="18" class="animate-spin" />
          {{ loading ? 'Signing in…' : 'Sign In' }}
        </ui-button>
      </form>
    </ui-card>
    <p class="text-text-secondary">© 2026 PT. ASI Pudjiastuti Aviation</p>
  </main>
</template>
