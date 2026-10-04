<script setup lang="ts">
import { AvatarRoot } from "reka-ui"
</script>

<template>
  <AvatarRoot data-slot="avatar" class="avatar">
    <slot />
  </AvatarRoot>
</template>

<style scoped lang="scss">
@reference "../../../assets/css/tailwind.css";

// In the components layer so utility classes passed by the parent still override
@layer components {
  .avatar {
    @apply relative flex size-8 shrink-0 overflow-hidden rounded-full;
  }
}
</style>
