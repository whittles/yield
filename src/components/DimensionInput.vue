<!--
  A dimension cell.

  Every numeric field in the app previously had no programmatic label at all —
  61 of 61 controls announced as "edit text, blank" — relied on a transparent
  border so it read as static text until hovered, and offered no inline error.
  This component carries the accessible name, the invalid state, and a target
  big enough to hit with a thumb.
-->
<template>
  <div class="w-full">
    <input
      :id="id"
      :value="modelValue"
      :type="type"
      :inputmode="type === 'number' ? 'numeric' : 'text'"
      :min="type === 'number' ? min : undefined"
      :placeholder="placeholder"
      :aria-label="ariaLabel"
      :aria-invalid="error ? 'true' : undefined"
      :aria-errormessage="error ? `${id}-err` : undefined"
      :class="[
        'w-full rounded px-2 text-sm bg-surface text-text-primary border transition-colors',
        'min-h-[40px] sm:min-h-[36px]',
        alignClass,
        error
          ? 'border-danger bg-danger-bg/40'
          : 'border-border hover:border-text-muted',
      ]"
      @input="$emit('update:modelValue', type === 'number' ? toNumber($event.target.value) : $event.target.value)"
    />
    <!-- Named next to the field it belongs to, not 1700px away. -->
    <p v-if="error" :id="`${id}-err`" class="mt-0.5 mb-0 text-xs text-danger leading-tight">
      {{ error }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  ariaLabel: { type: String, required: true },
  id: { type: String, required: true },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  error: { type: String, default: null },
  align: { type: String, default: 'left' },
  min: { type: [String, Number], default: 1 },
})

defineEmits(['update:modelValue'])

const alignClass = computed(() => (props.align === 'center' ? 'text-center' : ''))

function toNumber(v) {
  if (v === '') return ''
  const n = Number(v)
  return Number.isNaN(n) ? v : n
}
</script>
