<script setup lang="ts">
import { shallowRef, watch, defineProps, defineEmits, ref } from 'vue'
import type { EditorView } from '@codemirror/view'

const props = defineProps<{
  modelValue: string
  label?: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const editorValue = ref(props.modelValue)
const view = shallowRef<EditorView | null>(null)

watch(
  () => props.modelValue,
  (value) => {
    if (value !== editorValue.value) {
      editorValue.value = value
      view.value?.dispatch({
        changes: {
          from: 0,
          to: view.value.state.doc.length,
          insert: value
        }
      })
    }
  }
)

watch(editorValue, (value) => {
  emit('update:modelValue', value)
})

const extensions = [
  (await import('@codemirror/lang-markdown')).markdown()
]

const handleReady = (payload: { view: EditorView }) => {
  view.value = payload.view
}
</script>

<template>
  <div class="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden">
    <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 bg-slate-50/70">
      <label v-if="label" class="text-sm font-semibold text-slate-800">{{ label }}</label>
      <span class="text-xs text-slate-400">Supports full markdown syntax</span>
    </div>
    <ClientOnly fallback="Loading editor...">
      <VueCodemirror
        v-model="editorValue"
        placeholder="Write or edit your markdown template here..."
        :extensions="extensions"
        :style="{ height: '480px' }"
        class="markdown-editor"
        @ready="handleReady"
      />
      <template #fallback>
        <textarea
          v-model="editorValue"
          class="w-full h-96 border-0 outline-none p-5 font-mono text-sm"
        />
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped>
:deep(.markdown-editor) {
  border: none;
}

:deep(.cm-editor) {
  font-family: 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  background-color: white;
}

:deep(.cm-scroller) {
  padding: 20px;
}

:deep(.cm-content) {
  min-height: 480px;
}

:deep(.cm-activeLine) {
  background-color: rgba(37, 99, 235, 0.06);
}

:deep(.cm-lineNumbers) {
  color: rgb(148 163 184);
}

:deep(.cm-selectionBackground) {
  background-color: rgba(37, 99, 235, 0.18) !important;
}
</style>
