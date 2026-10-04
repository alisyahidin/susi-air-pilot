<script setup lang="ts">
import type { AvatarFallbackProps } from "reka-ui"
import { AvatarFallback } from "reka-ui"

const props = defineProps<AvatarFallbackProps>()
</script>

<template>
  <AvatarFallback data-slot="avatar-fallback" v-bind="props" class="avatar-fallback">
    <slot />
  </AvatarFallback>
</template>

<style scoped lang="scss">
@reference "../../../assets/css/tailwind.css";

@layer components {
  .avatar-fallback {
    @apply flex size-full items-center justify-center rounded-full bg-primary text-white;
  }
}
</style>
