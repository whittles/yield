<template>
  <section class="bg-surface border border-border rounded-lg overflow-hidden shadow-sheet">
    <!-- Collapsible header -->
    <h2 class="m-0">
      <button
        @click="open = !open"
        :aria-expanded="open"
        aria-controls="settings-panel"
        class="w-full min-h-[48px] px-5 py-3 border-b border-border bg-surface-alt flex items-center justify-between text-left gap-3"
      >
        <span class="font-semibold text-text-primary">Milling settings</span>
        <span class="flex items-center gap-2 text-text-secondary text-sm">
          <span class="hidden sm:inline text-xs">{{ open ? 'Hide' : 'Kerf, allowances, resaw' }}</span>
          <Icon
            name="chevron"
            size="1.1em"
            class="transition-transform"
            :style="{ transform: open ? 'rotate(180deg)' : 'none' }"
          />
        </span>
      </button>
    </h2>

    <div v-show="open" id="settings-panel" class="px-5 py-4 space-y-6">

      <!-- Basic settings -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label for="set-kerf" class="block text-xs font-medium text-text-muted mb-1 uppercase tracking-wide">
            Saw kerf (in)
          </label>
          <input
            id="set-kerf"
            v-model="kerfStr"
            type="text"
            aria-describedby="set-kerf-hint"
            class="w-full min-h-[40px] border border-border rounded px-3 text-sm bg-surface"
            placeholder="1/8"
          />
          <p id="set-kerf-hint" class="mt-1 mb-0 text-xs text-text-muted">Material lost per cut</p>
        </div>
        <div>
          <label for="set-planing" class="block text-xs font-medium text-text-muted mb-1 uppercase tracking-wide">
            Planing allowance (in)
          </label>
          <input
            id="set-planing"
            v-model="planingStr"
            type="text"
            aria-describedby="set-planing-hint"
            class="w-full min-h-[40px] border border-border rounded px-3 text-sm bg-surface"
            placeholder="1/16"
          />
          <p id="set-planing-hint" class="mt-1 mb-0 text-xs text-text-muted">Per face, when conditioning rough stock</p>
        </div>
      </div>

      <!-- Resaw optimization -->
      <div>
        <h3 class="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
          Resaw optimization
          <span class="ml-1 font-normal normal-case">— split thick boards into slabs to improve yield</span>
        </h3>
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label class="flex items-center gap-2 cursor-pointer min-h-[40px]">
              <input
                v-model="store.settings.allowResaw"
                type="checkbox"
                class="w-4 h-4 rounded border-border accent-accent"
                aria-describedby="set-resaw-hint"
              />
              <span class="text-sm text-text-primary font-medium">
                Auto-resaw {{ store.settings.allowResaw ? 'enabled' : 'disabled' }}
              </span>
            </label>
            <p id="set-resaw-hint" class="mt-1 mb-0 text-xs text-text-muted">
              Suggests resawing boards much thicker than the parts they hold
            </p>
          </div>
          <div v-if="store.settings.allowResaw">
            <label for="set-face" class="block text-xs font-medium text-text-muted mb-1 uppercase tracking-wide">
              Face cleanup allowance (in)
            </label>
            <input
              id="set-face"
              :value="resawFaceStr"
              @change="resawFaceStr = $event.target.value"
              type="text"
              aria-describedby="set-face-hint"
              class="w-full min-h-[40px] border border-border rounded px-3 text-sm bg-surface"
              placeholder="1/16"
            />
            <p id="set-face-hint" class="mt-1 mb-0 text-xs text-text-muted">
              Removed from each resawn face. Increase for rough cuts or a worn blade.
            </p>
          </div>
        </div>
      </div>

      <!-- Condition allowances -->
      <div>
        <h3 class="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
          Condition allowances
          <span class="ml-1 font-normal normal-case">— material removed from nominal size during milling</span>
        </h3>
        <div class="overflow-x-auto">
          <table class="text-sm w-full">
            <caption class="sr-only">Milling allowance per surface condition</caption>
            <thead>
              <tr class="text-xs text-text-muted uppercase tracking-wide border-b border-border">
                <th scope="col" class="text-left py-1 pr-4 font-medium">Condition</th>
                <th scope="col" class="text-center py-1 px-3 font-medium w-40">Thickness removed (in)</th>
                <th scope="col" class="text-center py-1 px-3 font-medium w-40">Width removed (in)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(cond, key) in store.settings.conditionAllowances"
                :key="key"
                class="border-b border-border/50 last:border-0"
              >
                <th scope="row" class="py-1.5 pr-4 font-medium text-left text-text-primary">
                  {{ formatConditionName(key) }}
                </th>
                <td class="py-1.5 px-3 text-center">
                  <input
                    v-model.number="store.settings.conditionAllowances[key].thickness"
                    type="number" step="0.0625" min="0"
                    :aria-label="`Thickness removed for ${formatConditionName(key)} stock, in inches`"
                    class="w-28 min-h-[40px] border border-border rounded px-2 text-sm text-center bg-surface"
                  />
                </td>
                <td class="py-1.5 px-3 text-center">
                  <input
                    v-model.number="store.settings.conditionAllowances[key].width"
                    type="number" step="0.0625" min="0"
                    :aria-label="`Width removed for ${formatConditionName(key)} stock, in inches`"
                    class="w-28 min-h-[40px] border border-border rounded px-2 text-sm text-center bg-surface"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-2 mb-0 text-xs text-text-muted">
          S4S is already milled to final dimension — zero allowance on all sides.
        </p>
      </div>

    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useProjectStore } from '@/stores/project'
import { parseFraction, formatFraction } from '@/utils/fractions'
import Icon from '@/components/Icon.vue'

const store = useProjectStore()
const open  = ref(false)

const kerfStr = computed({
  get: () => formatFraction(store.settings.kerf),
  set: (v) => { store.settings.kerf = parseFraction(v) },
})

const planingStr = computed({
  get: () => formatFraction(store.settings.planingAllowance),
  set: (v) => { store.settings.planingAllowance = parseFraction(v) },
})

const resawFaceStr = computed({
  get: () => formatFraction(store.settings.resawFaceAllowance),
  set: (v) => { store.settings.resawFaceAllowance = parseFraction(v) },
})

function formatConditionName(key) {
  const names = {
    'rough': 'Rough', 'skip-planed': 'Skip planed',
    's3s': 'S3S', 's4s': 'S4S',
  }
  return names[key] ?? key
}
</script>
