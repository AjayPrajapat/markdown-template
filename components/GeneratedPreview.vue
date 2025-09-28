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
  <div class="bg-gradient-to-br from-white via-white to-slate-50 border border-slate-200 rounded-2xl shadow-md overflow-hidden">
    <header class="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4 bg-slate-50/60">
      <div>
        <h2 class="text-xl font-semibold text-slate-900">Live Markdown Preview</h2>
        <p class="text-sm text-slate-500">Rendered with enhanced typography and layout-friendly defaults.</p>
      </div>
      <span class="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1">
        <span class="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
        Auto-formatted
      </span>
    </header>
    <div class="markdown-preview px-6 py-6" v-html="compiledMarkdown" />
  </div>
</template>
