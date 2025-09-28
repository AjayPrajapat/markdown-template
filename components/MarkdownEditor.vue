<script setup lang="ts">
import { shallowRef, watch, defineProps, defineEmits, ref } from 'vue'
import { keymap } from '@codemirror/view'
import type { EditorView } from '@codemirror/view'
import { EditorSelection } from '@codemirror/state'

const props = defineProps<{
  modelValue: string
  label?: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const editorValue = ref(props.modelValue)
const view = shallowRef<EditorView | null>(null)

const listLinePattern = /^(\s*)([-*+]\s|\d+[.)]\s)/

const insertListBullet = (editorView: EditorView) => {
  const { state } = editorView
  const main = state.selection.main
  const line = state.doc.lineAt(main.head)

  const unorderedMatch = line.text.match(/^(\s*)([-*+])\s+/)
  const orderedMatch = line.text.match(/^(\s*)(\d+)([.)])\s+/)
  const whitespaceMatch = line.text.match(/^(\s+)/)

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

  const insert = `\n${indent}${bullet} `
  const changes = { from: main.from, to: main.to, insert }
  const cursorPosition = main.from + insert.length

  editorView.dispatch({
    changes,
    selection: EditorSelection.cursor(cursorPosition)
  })

  return true
}

const insertParagraphBreak = (editorView: EditorView) => {
  const { state } = editorView

  const transaction = state.changeByRange((range) => {
    const line = state.doc.lineAt(range.head)

    if (listLinePattern.test(line.text)) {
      return { range }
    }

    const isBlankLine = line.text.trim().length === 0
    const insert = isBlankLine ? '\n' : '\n\n'
    const from = range.from
    const to = range.to

    return {
      changes: { from, to, insert },
      range: EditorSelection.cursor(from + insert.length)
    }
  })

  if (transaction.changes.empty) {
    return false
  }

  editorView.dispatch(transaction)
  return true
}

const listKeymap = keymap.of([
  {
    key: 'Shift-Enter',
    run: insertListBullet
  },
  {
    key: 'Enter',
    run: insertParagraphBreak
  }
])

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
  (await import('@codemirror/lang-markdown')).markdown(),
  listKeymap
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
