<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import GeneratedPreview from '~/components/GeneratedPreview.vue'
import { useTemplateStore } from '~/stores/useTemplateStore'

const store = useTemplateStore()
const { editorContent, mergedValues } = storeToRefs(store)

const placeholderCount = computed(() => Object.keys(mergedValues.value).length)
</script>

<template>
  <section class="max-w-5xl mx-auto px-6 py-12 space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Generated Preview</h1>
        <p class="text-slate-500 mt-1">Review the filled markdown content before exporting.</p>
      </div>
      <NuxtLink to="/editor" class="px-4 py-2 bg-primary text-white rounded-md shadow hover:bg-primary/90">Back to Editor</NuxtLink>
    </header>
    <div class="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
      <p class="text-sm text-slate-500">Placeholders populated: <strong>{{ placeholderCount }}</strong></p>
    </div>
    <GeneratedPreview :template="editorContent" :values="mergedValues" />
  </section>
</template>
