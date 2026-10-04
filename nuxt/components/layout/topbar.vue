<script setup lang="ts">
const props = defineProps<{
  hideAvatar?: boolean
}>()

const { isAuthenticated } = useAuth()
</script>

<template>
  <header class="bg-white flex items-center justify-between gap-2 p-4 border-b border-border h-16 shadow-2xs">
    <div class="flex items-center gap-2">
      <img src="/logo.png" class="h-7" fetchpriority="high" />
    </div>
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-2 h-8 px-3 rounded-full border border-border bg-background">
        <Icon name="lucide:calendar" />
        <span class="text-[13px] font-semibold">Fri, 15 May</span>
      </div>
      <ui-avatar v-if="isAuthenticated && !props.hideAvatar">
        <ui-avatar-image src="https://i.pravatar.cc/150?u=johndo@pravatar.com" />
        <ui-avatar-fallback>JD</ui-avatar-fallback>
      </ui-avatar>
    </div>
  </header>
</template>