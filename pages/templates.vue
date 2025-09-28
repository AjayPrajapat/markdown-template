<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useTemplateStore } from '~/stores/useTemplateStore'

const store = useTemplateStore()
const { templates, selectedTemplateId } = storeToRefs(store)

const goToEditor = (id: string) => {
  store.selectTemplate(id)
  navigateTo('/editor')
}
</script>

<template>
  <section class="max-w-6xl mx-auto px-6 py-10">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Template Library</h1>
        <p class="text-slate-500 mt-1">Select a template to load it into the editor.</p>
      </div>
      <NuxtLink to="/editor" class="px-4 py-2 bg-primary text-white rounded-md shadow hover:bg-primary/90">
        Go to Editor
      </NuxtLink>
    </div>
    <div class="grid gap-6 md:grid-cols-2">
      <article
        v-for="template in templates"
        :key="template.id"
        class="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col justify-between"
      >
        <div>
          <div class="flex items-start justify-between">
            <h2 class="text-2xl font-semibold text-slate-800">{{ template.name }}</h2>
            <span
              class="text-xs uppercase font-semibold tracking-wider"
              :class="template.id === selectedTemplateId ? 'text-primary' : 'text-slate-400'"
            >
              {{ template.id === selectedTemplateId ? 'Selected' : 'Available' }}
            </span>
          </div>
          <p class="text-slate-500 mt-3">{{ template.description }}</p>
          <pre class="bg-slate-900 text-slate-100 text-xs p-4 rounded-lg mt-4 overflow-x-auto">
{{ template.content }}
          </pre>
        </div>
        <button
          class="mt-6 px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary hover:text-white transition"
          @click="goToEditor(template.id)"
        >
          Use this template
        </button>
      </article>
    </div>
  </section>
</template>
