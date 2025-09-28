<script setup lang="ts">
import { computed, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import MarkdownEditor from '~/components/MarkdownEditor.vue'
import TemplateSelector from '~/components/TemplateSelector.vue'
import GeneratedPreview from '~/components/GeneratedPreview.vue'
import { useTemplateStore } from '~/stores/useTemplateStore'
import type { PlaceholderType } from '~/stores/useTemplateStore'
import { useAI } from '~/composables/useAI'

const store = useTemplateStore()
const { editorContent, placeholders, mergedValues, isGenerating, errorMessage, placeholderTypeMap } = storeToRefs(store)
const { generatePlaceholders } = useAI()

const formErrors = reactive<Record<string, string>>({})

const placeholderTypeLabels: Record<PlaceholderType, string> = {
  text: 'Rich text guidance',
  list: 'List guidance',
  table: 'CSV table guidance'
}

const placeholderTypeOptions: Array<{ value: PlaceholderType; label: string }> = [
  { value: 'text', label: 'Text guidance' },
  { value: 'list', label: 'List guidance' },
  { value: 'table', label: 'Table (CSV)' }
]

const handlePlaceholderTypeChange = (name: string, event: Event) => {
  const value = (event.target as HTMLSelectElement).value as PlaceholderType
  store.setPlaceholderType(name, value)
}

const insertText = (target: HTMLTextAreaElement, start: number, end: number, insert: string) => {
  const value = target.value
  const newValue = value.slice(0, start) + insert + value.slice(end)
  const cursor = start + insert.length
  target.value = newValue
  target.setSelectionRange(cursor, cursor)
  return newValue
}

const handleRichTextKeydown = (name: string, event: KeyboardEvent) => {
  const target = event.target as HTMLTextAreaElement
  const start = target.selectionStart
  const end = target.selectionEnd

  if (event.shiftKey && event.key === 'Enter') {
    event.preventDefault()
    const value = target.value
    const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1
    const lineText = value.slice(lineStart, start)

    const unorderedMatch = lineText.match(/^(\s*)([-*+])\s+/)
    const orderedMatch = lineText.match(/^(\s*)(\d+)([.)])\s+/)
    const whitespaceMatch = lineText.match(/^(\s+)/)

    let indent = whitespaceMatch?.[1] ?? ''
    let bullet = '-'

    if (orderedMatch) {
      indent = orderedMatch[1]
      const currentNumber = Number.parseInt(orderedMatch[2], 10)
      const marker = Number.isNaN(currentNumber) ? orderedMatch[2] : String(currentNumber + 1)
      bullet = `${marker}${orderedMatch[3]}`
    } else if (unorderedMatch) {
      indent = unorderedMatch[1]
      bullet = unorderedMatch[2]
    }

    const inserted = insertText(target, start, end, `\n${indent}${bullet} `)
    store.updatePlaceholderValue(name, inserted)
    return
  }

  if (!event.shiftKey && event.key === 'Enter') {
    event.preventDefault()
    const value = target.value
    const precedingNewline = start > 0 && value[start - 1] === '\n'
    const insert = precedingNewline ? '\n' : '\n\n'
    const inserted = insertText(target, start, end, insert)
    store.updatePlaceholderValue(name, inserted)
  }
}

const hasErrors = computed(() => Object.values(formErrors).some(Boolean))

const finalMarkdown = computed(() => {
  let filled = editorContent.value
  for (const [key, value] of Object.entries(mergedValues.value)) {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'gi')
    filled = filled.replace(pattern, value ?? '')
  }
  return filled
})

const validateInputs = () => {
  Object.keys(formErrors).forEach((key) => delete formErrors[key])
  placeholders.value.forEach((name) => {
    const type = placeholderTypeMap.value[name] ?? 'text'
    const contextValue = store.contextValues[name] ?? ''
    if (!contextValue.trim()) {
      if (type === 'list') {
        formErrors[name] = 'Add at least one list item before generating.'
        return
      }
      if (type === 'table') {
        formErrors[name] = 'Provide CSV rows before generating.'
        return
      }
      formErrors[name] = 'Please provide guidance for this placeholder before generating.'
    }
  })
}

const handleGenerate = async () => {
  validateInputs()
  if (hasErrors.value) {
    return
  }

  try {
    store.setIsGenerating(true)
    store.setError(null)
    const response = await generatePlaceholders({
      template: editorContent.value,
      placeholders: placeholders.value,
      context: store.contextValues
    })
    store.setGeneratedValues(response.values)
  } catch (error: any) {
    const message = error?.data?.message || error?.message || 'Failed to generate content. Please try again.'
    store.setError(message)
  } finally {
    store.setIsGenerating(false)
  }
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(finalMarkdown.value)
  } catch (error) {
    console.error('Clipboard copy failed', error)
  }
}

const downloadMarkdown = () => {
  const blob = new Blob([finalMarkdown.value], { type: 'text/markdown' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'generated-document.md'
  link.click()
  URL.revokeObjectURL(link.href)
}
</script>

<template>
  <section class="max-w-6xl mx-auto px-6 py-12 space-y-8">
    <header class="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-sm px-8 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Craft &amp; Preview Your Markdown</h1>
        <p class="text-sm text-slate-500 mt-1 max-w-2xl">
          Combine structured guidance, AI assistance, and a live preview to produce polished markdown deliverables faster.
        </p>
      </div>
      <div class="flex items-center gap-3 text-xs text-slate-500">
        <span class="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary font-semibold px-3 py-1">
          <span class="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
          Live synced
        </span>
        <span>Templates, AI context &amp; preview stay in sync automatically.</span>
      </div>
    </header>
    <div class="flex flex-col gap-6 lg:flex-row">
      <div class="lg:w-1/3 space-y-6">
        <TemplateSelector />
        <div class="bg-gradient-to-br from-white via-white to-slate-50 border border-slate-200 rounded-2xl shadow-md overflow-hidden">
          <header class="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold text-slate-900">Placeholder Guidance</h2>
                <p class="text-xs text-slate-500 mt-1">Give short prompts or bullet points so AI can fill each slot effectively.</p>
              </div>
              <span class="text-[11px] uppercase tracking-wide text-slate-400">{{ placeholders.length }} items</span>
            </div>
          </header>
          <div class="px-6 py-5 space-y-6">
            <div v-if="placeholders.length === 0" class="text-sm text-slate-400">
              No placeholders detected. Add <span v-pre>{{placeholder}}</span> tokens to your template.
            </div>
            <div
              v-for="name in placeholders"
              :key="name"
              class="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:border-primary/40 hover:shadow"
            >
              <div class="flex items-center justify-between gap-3 mb-3">
                <div>
                  <label class="block text-sm font-semibold text-slate-800">{{ name }}</label>
                  <p class="text-[11px] uppercase tracking-wide text-slate-400 mt-1">
                    {{ placeholderTypeLabels[placeholderTypeMap[name] ?? 'text'] }}
                  </p>
                </div>
                <select
                  :value="placeholderTypeMap[name] ?? 'text'"
                  class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  @change="handlePlaceholderTypeChange(name, $event)"
                >
                  <option
                    v-for="option in placeholderTypeOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>
              <div v-if="placeholderTypeMap[name] === 'list'" class="space-y-3">
                <div
                  v-for="(item, index) in (Array.isArray(store.placeholderValues[name]) ? store.placeholderValues[name] : [''])"
                  :key="`${name}-${index}`"
                  class="flex items-center gap-2"
                >
                  <input
                    :value="item"
                    class="grow rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    type="text"
                    placeholder="List item"
                    @input="store.updateListItem(name, index, ($event.target as HTMLInputElement).value)"
                  />
                  <button
                    class="text-xs text-slate-400 hover:text-red-500"
                    type="button"
                    @click="store.removeListItem(name, index)"
                  >
                    Remove
                  </button>
                </div>
                <button
                  class="text-xs font-semibold text-primary hover:text-primary/80"
                  type="button"
                  @click="store.addListItem(name)"
                >
                  + Add list item
                </button>
              </div>
              <div v-else-if="placeholderTypeMap[name] === 'table'" class="space-y-3">
                <textarea
                  :value="typeof store.placeholderValues[name] === 'string' ? store.placeholderValues[name] : ''"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  rows="4"
                  placeholder="Column 1, Column 2, Column 3\nRow value, Another value, Owner"
                  @input="store.updatePlaceholderValue(name, ($event.target as HTMLTextAreaElement).value)"
                />
                <p class="text-xs text-slate-400">
                  Paste CSV rows — the first row becomes table headers. Columns separated by commas.
                </p>
                <pre v-if="mergedValues[name]" class="w-full overflow-x-auto rounded-lg bg-slate-900 px-4 py-3 text-xs text-slate-100 shadow">{{ mergedValues[name] }}</pre>
              </div>
              <textarea
                v-else
                :value="typeof store.placeholderValues[name] === 'string' ? store.placeholderValues[name] : ''"
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                rows="3"
                placeholder="Describe what should go into {{ name }}"
                @keydown="handleRichTextKeydown(name, $event)"
                @input="store.updatePlaceholderValue(name, ($event.target as HTMLTextAreaElement).value)"
              />
              <p v-if="formErrors[name]" class="text-xs text-red-500 mt-2">{{ formErrors[name] }}</p>
              <p v-else-if="store.generatedValues[name]" class="text-xs text-emerald-600 mt-2">
                Generated value available.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="lg:w-2/3 space-y-6">
        <MarkdownEditor v-model="store.editorContent" label="Markdown Template" />
        <div class="bg-white/80 border border-slate-200 rounded-2xl shadow-sm px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div class="text-sm text-slate-500">
            <p class="font-semibold text-slate-800">Actions</p>
            <p>Generate with AI, or export your markdown when ready.</p>
          </div>
          <div class="flex flex-wrap gap-3">
            <button
              class="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="isGenerating"
              @click="handleGenerate"
            >
              <span v-if="isGenerating" class="flex items-center gap-2">
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Working…
              </span>
              <span v-else>Generate Document</span>
            </button>
            <button
              class="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-primary/40 hover:text-primary"
              type="button"
              @click="copyToClipboard"
            >
              Copy Markdown
            </button>
            <button
              class="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-primary/40 hover:text-primary"
              type="button"
              @click="downloadMarkdown"
            >
              Download .md
            </button>
          </div>
        </div>
        <p v-if="errorMessage" class="text-sm text-red-500">{{ errorMessage }}</p>
        <GeneratedPreview :template="editorContent" :values="mergedValues" />
      </div>
    </div>
  </section>
</template>
