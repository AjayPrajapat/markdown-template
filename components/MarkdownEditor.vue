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
  <div>
    <label v-if="label" class="block text-sm font-semibold text-slate-700 mb-2">{{ label }}</label>
    <ClientOnly fallback="Loading editor...">
      <VueCodemirror
        v-model="editorValue"
        placeholder="Write or edit your markdown template here..."
        :extensions="extensions"
        :style="{ height: '480px' }"
        class="border border-slate-300 rounded-lg overflow-hidden"
        @ready="handleReady"
      />
      <template #fallback>
        <textarea
          v-model="editorValue"
          class="w-full h-96 border border-slate-300 rounded-lg p-4 font-mono text-sm"
        />
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped>
:deep(.cm-editor) {
  font-family: 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  background-color: white;
}

:deep(.cm-content) {
  min-height: 480px;
}
</style>
