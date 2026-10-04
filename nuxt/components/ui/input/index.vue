<script setup lang="ts">
defineOptions({ inheritAttrs: false })

interface Props {
  label?: string
  type?: string
  error?: string
  disabled?: boolean
  id?: string
}
const props = withDefaults(defineProps<Props>(), {
  type: 'text'
})

const model = defineModel<string | number>()
const slots = defineSlots<{
  prefix?: () => any
  suffix?: () => any
}>()

const generatedId = useId()
const inputId = computed(() => props.id ?? generatedId)
const errorId = computed(() => `${inputId.value}-error`)

const inputRef = ref<HTMLInputElement>()
const showPassword = ref(false)
const isPassword = computed(() => props.type === 'password')
const inputType = computed(() => (isPassword.value && showPassword.value ? 'text' : props.type))

function focusInput(e: MouseEvent) {
  if (e.target !== e.currentTarget) return
  e.preventDefault()
  inputRef.value?.focus()
}

defineExpose({ focus: () => inputRef.value?.focus() })
</script>

<template>
  <div class="input">
    <label v-if="label" :for="inputId" class="input-label">{{ label }}</label>

    <div class="input-field" :data-error="!!error || undefined" :data-disabled="disabled || undefined" @mousedown="focusInput">
      <span v-if="slots.prefix" class="input-affix">
        <slot name="prefix" />
      </span>

      <input
        :id="inputId"
        ref="inputRef"
        v-model="model"
        v-bind="$attrs"
        :type="inputType"
        :disabled="disabled"
        :aria-invalid="!!error || undefined"
        :aria-describedby="error ? errorId : undefined"
      >

      <span v-if="slots.suffix" class="input-affix">
        <slot name="suffix" />
      </span>
      <span v-else-if="isPassword" class="input-affix">
        <button
          type="button"
          :aria-label="showPassword ? 'Hide password' : 'Show password'"
          :aria-pressed="showPassword"
          :disabled="disabled"
          @click="showPassword = !showPassword"
        >
          <Icon v-if="!showPassword" name="lucide:eye" size="20" />
          <Icon v-else name="lucide:eye-off" size="20" />
        </button>
      </span>
    </div>

    <span v-if="error" :id="errorId" class="input-error">{{ error }}</span>
  </div>
</template>

<style scoped lang="scss">
@reference "../../../assets/css/tailwind.css";

.input {
  @apply flex flex-col gap-1.5;
}

.input-label {
  @apply text-[13px] leading-4.5 font-semibold text-text-primary;
}

.input-field {
  @apply flex items-center gap-2.5 h-10 px-3 rounded-xl border-[1.5px] border-neutral-200 bg-white text-text-secondary cursor-text transition-[border-color,box-shadow] duration-150;

  &:hover {
    @apply border-neutral-400;
  }

  &:focus-within {
    @apply border-primary ring-3 ring-primary/15;
  }

  &[data-error] {
    @apply border-danger;
  }

  &[data-disabled] {
    @apply bg-background cursor-not-allowed opacity-60 hover:border-neutral-200;
  }

  &:has(.input-affix:last-child :is(button, a)) {
    @apply pr-0.5;
  }

  input {
    @apply flex-1 min-w-0 h-full border-0 outline-none bg-transparent font-medium text-text-primary;

    &::placeholder {
      @apply text-neutral-400 font-medium;
    }

    &:disabled {
      @apply cursor-not-allowed;
    }
  }
}

.input-affix {
  @apply flex items-center shrink-0 pointer-events-none;

  :deep(:is(button, a)) {
    @apply pointer-events-auto flex items-center justify-center size-9.5 p-0 rounded-[10px] border-0 bg-transparent text-text-secondary cursor-pointer transition-colors;

    &:hover {
      @apply bg-neutral-50;
    }

    &:active {
      @apply bg-neutral-100;
    }

    &:focus-visible {
      @apply outline-2 outline-offset-2 outline-primary;
    }

    &:disabled {
      @apply cursor-not-allowed bg-transparent;
    }
  }
}

.input-error {
  @apply text-sm font-semibold text-red-600;
}
</style>
