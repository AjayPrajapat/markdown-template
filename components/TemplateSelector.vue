<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useTemplateStore } from '~/stores/useTemplateStore'

const store = useTemplateStore()
const { templates, selectedTemplateId } = storeToRefs(store)

const handleChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  store.selectTemplate(value)
}
</script>

<template>
  <div class="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-lg font-semibold text-slate-800">Choose a template</h2>
      <span class="text-xs text-slate-500">{{ templates.length }} available</span>
    </div>
    <select
      :value="selectedTemplateId"
      class="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
      @change="handleChange"
    >
      <option v-for="template in templates" :key="template.id" :value="template.id">
        {{ template.name }}
      </option>
    </select>
    <p v-if="store.selectedTemplate" class="text-sm text-slate-500 mt-2">
      {{ store.selectedTemplate?.description }}
    </p>
  </div>
</template>
