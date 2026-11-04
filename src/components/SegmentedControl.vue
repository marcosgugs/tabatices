<script setup lang="ts">
defineProps<{
  options: string[]
  label: string
}>()

const selectedOption = defineModel<string>({ required: true })
</script>

<template>
  <div role="radiogroup" :aria-label="label" class="inline-flex w-full rounded-full bg-forest/[0.06] p-1">
    <button
      v-for="option in options"
      :key="option"
      type="button"
      role="radio"
      :aria-checked="selectedOption === option"
      class="flex-1 rounded-full px-4 py-2 text-[14px] font-medium transition duration-300 ease-apple"
      :class="selectedOption === option ? 'bg-white text-ink shadow-[0_1px_4px_rgba(46,58,47,0.12)]' : 'text-ink-muted hover:text-ink'"
      @click="selectedOption = option"
    >
      {{ option }}
    </button>
  </div>
</template>
