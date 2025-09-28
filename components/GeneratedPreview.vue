<script setup lang="ts">
import { computed, defineProps } from 'vue'
import { marked } from 'marked'

const props = defineProps<{
  template: string
  values: Record<string, string>
}>()

const compiledMarkdown = computed(() => {
  let result = props.template
  for (const [key, value] of Object.entries(props.values)) {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'gi')
    result = result.replace(pattern, value ?? '')
  }
  return marked.parse(result)
})
</script>

<template>
  <div class="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
    <h2 class="text-xl font-semibold mb-4 text-slate-800">Live Preview</h2>
    <div class="markdown-preview prose prose-slate max-w-none" v-html="compiledMarkdown" />
  </div>
</template>
