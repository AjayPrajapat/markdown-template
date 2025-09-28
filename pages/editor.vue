<script setup lang="ts">
import { computed, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import MarkdownEditor from '~/components/MarkdownEditor.vue'
import TemplateSelector from '~/components/TemplateSelector.vue'
import GeneratedPreview from '~/components/GeneratedPreview.vue'
import { useTemplateStore } from '~/stores/useTemplateStore'
import { useAI } from '~/composables/useAI'

const store = useTemplateStore()
const { editorContent, placeholders, mergedValues, isGenerating, errorMessage } = storeToRefs(store)
const { generatePlaceholders } = useAI()

const formErrors = reactive<Record<string, string>>({})

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
    if (!store.placeholderValues[name]?.trim()) {
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
      context: store.placeholderValues
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
  <section class="max-w-6xl mx-auto px-6 py-10 space-y-8">
    <div class="flex flex-col gap-6 lg:flex-row">
      <div class="lg:w-1/3 space-y-6">
        <TemplateSelector />
        <div class="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
          <h2 class="text-lg font-semibold text-slate-800 mb-2">Placeholder Guidance</h2>
          <p class="text-sm text-slate-500 mb-4">
            Provide context for each placeholder. The AI will use these hints to craft complete sections.
          </p>
          <div v-if="placeholders.length === 0" class="text-sm text-slate-400">
            No placeholders detected. Add {{'{{placeholder}}'}} tokens to your template.
          </div>
          <div v-for="name in placeholders" :key="name" class="mb-4">
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ name }}</label>
            <textarea
              :value="store.placeholderValues[name] ?? ''"
              class="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              rows="3"
              placeholder="Describe what should go into {{ name }}"
              @input="store.updatePlaceholderValue(name, ($event.target as HTMLTextAreaElement).value)"
            />
            <p v-if="formErrors[name]" class="text-xs text-red-500 mt-1">{{ formErrors[name] }}</p>
            <p v-else-if="store.generatedValues[name]" class="text-xs text-emerald-600 mt-1">
              Generated value available.
            </p>
          </div>
        </div>
      </div>
      <div class="lg:w-2/3 space-y-6">
        <MarkdownEditor v-model="store.editorContent" label="Markdown Template" />
        <div class="flex flex-wrap gap-3">
          <button
            class="px-5 py-2 bg-primary text-white rounded-md shadow hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="isGenerating"
            @click="handleGenerate"
          >
            <span v-if="isGenerating" class="flex items-center gap-2">
              <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Generating...
            </span>
            <span v-else>Generate Document</span>
          </button>
          <button
            class="px-5 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100"
            type="button"
            @click="copyToClipboard"
          >
            Copy Markdown
          </button>
          <button
            class="px-5 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100"
            type="button"
            @click="downloadMarkdown"
          >
            Download .md
          </button>
        </div>
        <p v-if="errorMessage" class="text-sm text-red-500">{{ errorMessage }}</p>
        <GeneratedPreview :template="editorContent" :values="mergedValues" />
      </div>
    </div>
  </section>
</template>
