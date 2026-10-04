<script setup lang="ts">
import type { AvatarImageProps } from "reka-ui"
import { AvatarImage } from "reka-ui"

const props = defineProps<AvatarImageProps>()
</script>

<template>
  <AvatarImage data-slot="avatar-image" v-bind="props" class="avatar-image">
    <slot />
  </AvatarImage>
</template>

<style scoped lang="scss">
@reference "../../../assets/css/tailwind.css";

@layer components {
  .avatar-image {
    @apply aspect-square size-full;
  }
}
</style>
