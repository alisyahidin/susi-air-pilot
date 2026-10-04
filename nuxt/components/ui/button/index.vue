<script setup lang="ts">
interface Props {
  color?: 'primary' | 'accent' | 'white'
}
const props = withDefaults(defineProps<Props>(), {
  color: 'accent'
})
</script>

<template>
  <button :data-color="color">
    <slot />
  </button>
</template>

<style scoped lang="scss">
@reference "../../../assets/css/tailwind.css";

button {
  @apply text-white px-4 h-10 font-medium rounded-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 shadow-xs;

  &[data-color=accent] {
    @apply bg-accent not-disabled:hover:bg-red-600 not-disabled:active:bg-red-700 shadow-red-200;
  }

  &[data-color=primary] {
    @apply bg-primary not-disabled:hover:bg-navy-800 not-disabled:active:bg-navy-900 shadow-navy-300;
  }

  &[data-color=white] {
    @apply text-text-primary bg-white not-disabled:hover:bg-[#fafbfc] not-disabled:active:bg-[#f5f5f5] border disabled:opacity-50 shadow-black/15;
  }
}
</style>
