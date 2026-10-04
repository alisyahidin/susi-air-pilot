<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

type DocumentStatus = 'valid' | 'expiring' | 'expired'

const documents: { name: string, expiry: string, status: DocumentStatus, remaining: string }[] = [
  { name: 'Instrument Rating', expiry: '30 Apr 2026', status: 'expired', remaining: 'Expired 15 days ago' },
  { name: 'Medical Certificate, Class 1', expiry: '02 Jun 2026', status: 'expiring', remaining: '18 days left' },
  { name: 'Proficiency Check, C208B', expiry: '08 Jul 2026', status: 'expiring', remaining: '54 days left' },
  { name: 'ICAO English Proficiency', expiry: '20 Nov 2027', status: 'valid', remaining: '1 yr 6 mo left' },
  { name: 'Commercial Pilot Licence', expiry: '12 Mar 2028', status: 'valid', remaining: '1 yr 9 mo left' }
]

const DOCUMENT_BADGE = {
  valid: { color: 'success', label: 'Valid' },
  expiring: { color: 'warning', label: 'Expiring soon' },
  expired: { color: 'danger', label: 'Expired' }
} as const
</script>

<template>
  <div class="space-y-4">
    <div>
      <p class="text-sm font-medium text-text-secondary">Welcome back,</p>
      <h1 class="text-lg font-bold">John Doe</h1>
    </div>
    <ui-card class="flex items-center gap-4 bg-primary!">
      <div class="flex items-center justify-center rounded-full p-3 bg-navy-600">
        <Icon name="lucide:clock" class="text-xl! text-white" />
      </div>
      <div>
        <p class="text-neutral-200">Total flight hours</p>
        <p class="text-xl font-bold text-white">4,285 <span class="text-neutral-200 text-base">h</span></p>
      </div>
    </ui-card>

    <!-- Hours to Limit -->
    <div class="space-y-2">
      <p class="font-bold text-lg">Hours to Limit</p>
      <div class="grid grid-cols-2 gap-2">
        <ui-card class="flex flex-col min-w-0 items-start gap-2">
          <div>
            <p class="text-[16px] font-bold">Daily</p>
            <p class="text-text-secondary font-medium">Today</p>
          </div>
          <ui-badge color="success" variant="icon" icon="lucide:check">Within Limit</ui-badge>
          <div>
            <p class="text-xl font-extrabold">5.6 <span class="text-text-secondary text-base">h</span></p>
            <p class="text-text-secondary font-medium">of 8 hour limit</p>
          </div>
          <div class="w-full space-y-2">
            <ui-progress :value="6" :max="10" color="success" />
            <p class="font-semibold">2.4 hour remaining</p>
          </div>
        </ui-card>
        <ui-card class="flex flex-col min-w-0 items-start gap-2">
          <div>
            <p class="text-[16px] font-bold">Weekly</p>
            <p class="text-text-secondary font-medium">Rolling 7 days</p>
          </div>
          <ui-badge color="danger" variant="icon">Over limit</ui-badge>
          <div>
            <p class="text-xl font-extrabold">42.0 <span class="text-text-secondary text-base">h</span></p>
            <p class="text-text-secondary font-medium">of 40 hour limit</p>
          </div>
          <div class="w-full space-y-2">
            <ui-progress :value="10" :max="10" color="danger" />
            <p class="font-semibold">2.0 hour over limit</p>
          </div>
        </ui-card>
        <ui-card class="flex flex-col min-w-0 items-start gap-2">
          <div>
            <p class="text-[16px] font-bold">Monthly</p>
            <p class="text-text-secondary font-medium">Rolling 30 days</p>
          </div>
          <ui-badge color="warning" variant="icon">Approaching limit</ui-badge>
          <div>
            <p class="text-xl font-extrabold">84.1 <span class="text-text-secondary text-base">h</span></p>
            <p class="text-text-secondary font-medium">of 100 hour limit</p>
          </div>
          <div class="w-full space-y-2">
            <ui-progress :value="9" :max="10" color="warning" />
            <p class="font-semibold">2.4 hour remaining</p>
          </div>
        </ui-card>
        <ui-card class="flex flex-col min-w-0 items-start gap-2">
          <div>
            <p class="text-[16px] font-bold">Annual</p>
            <p class="text-text-secondary font-medium">Rolling 365 days</p>
          </div>
          <ui-badge color="success" variant="icon" icon="lucide:check">Within Limit</ui-badge>
          <div>
            <p class="text-xl font-extrabold">737.5 <span class="text-text-secondary text-base">h</span></p>
            <p class="text-text-secondary font-medium">of 1,050 hour limit</p>
          </div>
          <div class="w-full space-y-2">
            <ui-progress :value="9" :max="10" color="success" />
            <p class="font-semibold">2.4 hour remaining</p>
          </div>
        </ui-card>
      </div>
    </div>

    <!-- Flight Hours Trend -->
    <div class="space-y-2">
      <p class="font-bold text-lg">Flight Hours Trend</p>
      <home-flight-hours-trend />
    </div>

    <!-- My Documents -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <p class="font-bold text-lg">My Documents</p>
        <button type="button" class="flex items-center gap-0.5 -mr-1.5 h-11 pl-3 pr-1.5 rounded-full text-[13px] font-bold cursor-pointer hover:bg-neutral-50 active:bg-neutral-100">
          View all
          <Icon name="lucide:chevron-right" size="16" />
        </button>
      </div>
      <ui-card class="p-2!">
        <ul>
          <li
            v-for="doc in documents"
            :key="doc.name"
            class="flex items-center justify-between gap-3 px-2 py-3 not-first:border-t not-first:border-border"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span class="flex items-center justify-center shrink-0 size-9 rounded-[10px] bg-background text-text-secondary">
                <Icon name="lucide:file-text" size="18" />
              </span>
              <div class="min-w-0">
                <p class="font-bold">{{ doc.name }}</p>
                <p class="text-sm font-medium text-text-secondary">
                  {{ doc.status === 'expired' ? 'Expired' : 'Expires' }} {{ doc.expiry }}
                </p>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1 shrink-0">
              <ui-badge :color="DOCUMENT_BADGE[doc.status].color">{{ DOCUMENT_BADGE[doc.status].label }}</ui-badge>
              <p class="text-sm font-semibold tabular-nums">{{ doc.remaining }}</p>
            </div>
          </li>
        </ul>
      </ui-card>
    </div>
  </div>
</template>