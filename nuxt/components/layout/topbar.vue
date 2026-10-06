<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from 'reka-ui'

const props = defineProps<{
  hideAvatar?: boolean
}>()

const { isAuthenticated, user, logout } = useAuth()

const todayLabel = (() => {
  const date = new Date(`${useToday()}T00:00:00Z`)
  const part = (options: Intl.DateTimeFormatOptions) => date.toLocaleDateString('en-US', { ...options, timeZone: 'UTC' })
  return `${part({ weekday: 'short' })}, ${part({ day: 'numeric', month: 'short' })}`
})()

const initials = computed(() =>
  (user.value?.name ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]!.toUpperCase()).join('')
)
</script>

<template>
  <header class="bg-white flex items-center justify-between gap-2 p-4 border-b border-border h-16 shadow-2xs">
    <div class="flex items-center gap-2">
      <img src="/logo.png" class="h-7" fetchpriority="high" />
    </div>
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-2 h-8 px-3 rounded-full border border-border bg-background">
        <Icon name="lucide:calendar" />
        <span class="text-[13px] font-semibold">{{ todayLabel }}</span>
      </div>

      <DropdownMenuRoot v-if="isAuthenticated && user && !props.hideAvatar">
        <DropdownMenuTrigger
          aria-label="Open profile menu"
          class="flex items-center justify-center size-11 -mr-1.5 rounded-full cursor-pointer outline-none transition-colors hover:bg-background data-[state=open]:bg-background focus-visible:outline-2 focus-visible:outline-primary"
        >
          <ui-avatar>
            <ui-avatar-image :src="user.imageUrl" :alt="user.name" />
            <ui-avatar-fallback>{{ initials }}</ui-avatar-fallback>
          </ui-avatar>
        </DropdownMenuTrigger>

        <DropdownMenuPortal>
          <DropdownMenuContent
            align="end"
            :side-offset="6"
            class="z-50 min-w-56 p-1.5 rounded-xl border border-border bg-white shadow-lg"
          >
            <DropdownMenuLabel class="flex flex-col gap-0.5 px-3 py-2">
              <span class="font-bold text-text-primary">{{ user.name }}</span>
              <span class="text-sm font-medium text-text-secondary">@{{ user.username }}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator class="h-px my-1 bg-border" />
            <DropdownMenuItem
              class="flex items-center gap-2 h-10 px-3 rounded-lg font-semibold text-danger-ink cursor-pointer outline-none data-highlighted:bg-danger-tint"
              @select="logout"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
    </div>
  </header>
</template>
