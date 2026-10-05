<template>
  <nav class="sticky bottom-0 left-0 flex items-center h-16 w-full bg-white border-t border-border z-10">
    <nuxt-link
      to="/"
      class="group/nav relative flex flex-col items-center justify-center min-w-0 h-full flex-1 shrink-0 text-text-secondary [&.active]:text-text-primary"
      active-class="active"
    >
      <span class="absolute top-0 transition-opacity group-[&.active]/nav:opacity-100 opacity-0 w-4 h-1 bg-accent rounded-b-4xl"></span>
      <Icon name="lucide:house" class="text-[20px]!" />
      <span class="text-[13px] font-semibold">Home</span>
    </nuxt-link>
    <nuxt-link
      to="/schedules"
      class="group/nav relative flex flex-col items-center justify-center min-w-0 h-full flex-1 shrink-0 text-text-secondary [&.active]:text-text-primary"
      active-class="active"
    >
      <span class="absolute top-0 transition-opacity group-[&.active]/nav:opacity-100 opacity-0 w-4 h-1 bg-accent rounded-b-4xl"></span>
      <Icon name="lucide:calendar-days" class="text-[20px]!" />
      <span class="text-[13px] font-semibold">Schedule</span>
    </nuxt-link>
    <nuxt-link
      to="/logbooks"
      class="group/nav relative flex flex-col items-center justify-center min-w-0 h-full flex-1 shrink-0 text-text-secondary [&.active]:text-text-primary"
      active-class="active"
    >
      <span class="absolute top-0 transition-opacity group-[&.active]/nav:opacity-100 opacity-0 w-4 h-1 bg-accent rounded-b-4xl"></span>
      <Icon name="lucide:book-open" class="text-[20px]!" />
      <span class="text-[13px] font-semibold">Logbook</span>
    </nuxt-link>
    <nuxt-link
      to="/more"
      class="group/nav relative flex flex-col items-center justify-center min-w-0 h-full flex-1 shrink-0 text-text-secondary [&.active]:text-text-primary"
      active-class="active"
    >
      <span class="absolute top-0 transition-opacity group-[&.active]/nav:opacity-100 opacity-0 w-4 h-1 bg-accent rounded-b-4xl"></span>
      <Icon name="lucide:ellipsis" class="text-[20px]!" />
      <span class="text-[13px] font-semibold">More</span>
    </nuxt-link>
  </nav>
</template>