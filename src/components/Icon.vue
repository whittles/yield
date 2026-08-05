<!--
  Authored icon set. One geometry, one stroke weight, one cap style, so the
  whole app reads as a single hand. Replaces the emoji that were standing in
  for an icon system — those render differently on every platform, can't take
  currentColor, and can't be aligned to the type.

  All paths are drawn on a 24×24 grid with a 1.5 stroke and round caps/joins.
  Size follows font-size by default; color follows currentColor.
-->
<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    :aria-hidden="title ? undefined : 'true'"
    :role="title ? 'img' : undefined"
    :aria-label="title || undefined"
    class="shrink-0"
  >
    <path v-for="(d, i) in paths" :key="i" :d="d" />
    <template v-if="name === 'grain'">
      <path
        v-for="(d, i) in GRAIN_LINES"
        :key="`g${i}`"
        :d="d"
        stroke-opacity="0.85"
      />
    </template>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: '1em' },
  strokeWidth: { type: [Number, String], default: 1.5 },
  /** Supply only when the icon is the sole label; otherwise it stays aria-hidden. */
  title: { type: String, default: '' },
})

const GRAIN_LINES = [
  'M3 9c3-1.2 6-1.2 9 0s6 1.2 9 0',
  'M3 12c3-1.2 6-1.2 9 0s6 1.2 9 0',
  'M3 15c3-1.2 6-1.2 9 0s6 1.2 9 0',
]

const ICONS = {
  // Export: a file leaving the app, i.e. a download.
  download: ['M12 3v12', 'M7.5 10.5 12 15l4.5-4.5', 'M4 17.5v1.5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5'],
  // Import: a file entering the app, i.e. an upload.
  upload:   ['M12 15V3', 'M7.5 7.5 12 3l4.5 4.5', 'M4 17.5v1.5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5'],
  reset:    ['M3.5 7.5v5h5', 'M4.6 12.5a7.5 7.5 0 1 0 1.4-5'],
  printer:  ['M7 9V3.5h10V9', 'M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2', 'M7 14.5h10V21H7z'],
  plus:     ['M12 5.5v13', 'M5.5 12h13'],
  close:    ['M6.5 6.5l11 11', 'M17.5 6.5l-11 11'],
  check:    ['M4.5 12.5l5 5 10-11'],
  alert:    ['M12 3.8 1.9 20.2h20.2z', 'M12 9.5v4.5', 'M12 17.2h.01'],
  info:     ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 11v5.5', 'M12 7.8h.01'],
  chevron:  ['M6 9.5l6 6 6-6'],
  // A sawn board seen face-on, with figure running along its length.
  grain:    ['M3 5.5h18v13H3z'],
  // Right-angle corner: the box/carcase tools.
  box:      ['M3.5 7.2 12 3l8.5 4.2v9.6L12 21l-8.5-4.2z', 'M3.5 7.2 12 11.4l8.5-4.2', 'M12 11.4V21'],
  // Stacked slabs coming off a resaw cut.
  slabs:    ['M3.5 6.5h17', 'M3.5 11h17', 'M3.5 15.5h17', 'M3.5 20h17'],
  ruler:    ['M3 15.5 15.5 3l5.5 5.5L8.5 21z', 'M8 10l2 2', 'M11 7l2 2', 'M5 13l2 2'],
}

const paths = computed(() => ICONS[props.name] ?? [])
</script>
