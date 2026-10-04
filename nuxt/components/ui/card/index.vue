<template>
  <div class="card">
    <slot />
  </div>
</template>

<style scoped lang="scss">
@reference "../../../assets/css/tailwind.css";

.card {
  @apply rounded-xl p-4 border border-border bg-white shadow-xs;
}
</style>
