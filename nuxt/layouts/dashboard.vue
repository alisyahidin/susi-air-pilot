<template>
  <header class="bg-white flex items-center gap-2 p-4 border-b border-border h-16">
    <img src="/logo.png" class="h-7" fetchpriority="high" />
    <span class="text-base text-text-secondary">|</span>
    <span class="text-base text-text-secondary">Pilot App</span>
  </header>
  <main>
    <slot />
  </main>
  <nav>
    Navbar
  </nav>
</template>