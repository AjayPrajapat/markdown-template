import { defineStore } from 'pinia'

type PlaceholderMap = Record<string, string>
export type PlaceholderType = 'text' | 'list' | 'table'
type PlaceholderValue = string | string[]
type PlaceholderValues = Record<string, PlaceholderValue>
type PlaceholderTypes = Record<string, PlaceholderType>

const inferPlaceholderType = (name: string): PlaceholderType => {
  if (/_table$/i.test(name) || /_csv$/i.test(name)) {
    return 'table'
  }
  if (/_list$/i.test(name) || /_items$/i.test(name)) {
    return 'list'
  }
  return 'text'
}

const toCsvString = (value: PlaceholderValue | undefined): string => {
  if (Array.isArray(value)) {
    return value.join('\n')
  }
  if (typeof value === 'string') {
    return value
  }
  return ''
}

const stripListMarker = (value: string): string => {
  return value.replace(/^\s*([-*]|\d+[.)])\s+/u, '').trim()
}

const splitListItems = (value: string): string[] => {
  return value
    .split(/\r?\n/)
    .map((item) => stripListMarker(item))
    .filter((item) => item.length > 0)
}

const toEditableList = (value: PlaceholderValue | undefined): string[] => {
  if (Array.isArray(value)) {
    const copy = [...value]
    return copy.length > 0 ? copy : ['']
  }
  if (typeof value === 'string') {
    const parsed = splitListItems(value)
    return parsed.length > 0 ? parsed : ['']
  }
  return ['']
}

const toFinalList = (value: PlaceholderValue | undefined): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter((item) => item.length > 0)
  }
  if (typeof value === 'string') {
    return splitListItems(value)
  }
  return []
}

const formatListMarkdown = (items: string[]): string => {
  return items.map((item) => `- ${item}`).join('\n')
}

const listContextString = (items: string[]): string => {
  return items.join('\n')
}

const parseCsvRows = (value: string): string[][] => {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.split(',').map((cell) => cell.trim()))
}

const formatTableMarkdown = (csv: string): string => {
  const rows = parseCsvRows(csv)
  if (rows.length === 0) {
    return ''
  }

  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0)
  if (columnCount === 0) {
    return ''
  }

  const normalized = rows.map((row) => {
    const copy = [...row]
    while (copy.length < columnCount) {
      copy.push('')
    }
    return copy
  })

  const header = normalized[0].map((cell, index) => {
    const label = cell.length > 0 ? cell : `Column ${index + 1}`
    return label.replace(/\|/g, '\\|')
  })
  const body = normalized.slice(1)

  const headerLine = `| ${header.join(' | ')} |`
  const separatorLine = `| ${header.map(() => '---').join(' | ')} |`
  const bodyLines = body.map((row) => {
    const sanitized = row.map((cell) => cell.replace(/\|/g, '\\|'))
    return `| ${sanitized.join(' | ')} |`
  })

  return [headerLine, separatorLine, ...bodyLines].join('\n')
}

const tableContextString = (csv: string): string => {
  const rows = parseCsvRows(csv)
  if (rows.length === 0) {
    return ''
  }
  return rows.map((row) => row.join(' | ')).join('\n')
}

const resolvePlaceholderType = (name: string, overrides: PlaceholderTypes): PlaceholderType => {
  return overrides[name] ?? inferPlaceholderType(name)
}

type Template = {
  id: string
  name: string
  description: string
  content: string
}

const defaultTemplates: Template[] = [
  {
    id: 'project-proposal',
    name: 'Project Proposal',
    description: 'A concise proposal structure for new initiatives.',
    content: `# Project Proposal: {{project_title}}

## Executive Summary
{{executive_summary}}

## Objectives
{{objectives_list}}

## Timeline
{{timeline_table}}

## Budget Overview
{{budget_overview}}

## Call To Action
{{call_to_action}}
`
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Structured meeting note template with decisions and action items.',
    content: `# Meeting Notes: {{meeting_topic}}

**Date:** {{meeting_date}}
**Facilitator:** {{facilitator}}

## Agenda Highlights
{{agenda}}

## Key Decisions
{{decisions}}

## Action Items
{{action_items_list}}

## Attendees
{{attendees_table}}
`
  }
]

export const useTemplateStore = defineStore('template', {
  state: () => ({
    templates: defaultTemplates,
    selectedTemplateId: defaultTemplates[0]?.id ?? '',
    editorContent: defaultTemplates[0]?.content ?? '',
    placeholderValues: {} as PlaceholderValues,
    placeholderTypes: {} as PlaceholderTypes,
    generatedValues: {} as PlaceholderMap,
    isGenerating: false,
    errorMessage: '' as string | null
  }),
  getters: {
    selectedTemplate(state): Template | undefined {
      return state.templates.find((template) => template.id === state.selectedTemplateId)
    },
    placeholders(state): string[] {
      const pattern = /{{(.*?)}}/g
      const unique = new Set<string>()
      let match
      while ((match = pattern.exec(state.editorContent)) !== null) {
        unique.add(match[1].trim())
      }
      return Array.from(unique)
    },
    placeholderTypeMap(): Record<string, PlaceholderType> {
      return Object.fromEntries(
        this.placeholders.map((name) => [name, resolvePlaceholderType(name, this.placeholderTypes)])
      )
    },
    mergedValues(state): PlaceholderMap {
      return Object.fromEntries(
        this.placeholders.map((name) => {
          const type = resolvePlaceholderType(name, this.placeholderTypes)
          const generated = state.generatedValues[name]
          if (typeof generated === 'string' && generated.trim().length > 0) {
            return [name, generated]
          }

          const placeholder = state.placeholderValues[name]

          if (type === 'list') {
            const items = toFinalList(placeholder)
            return [name, formatListMarkdown(items)]
          }

          if (type === 'table') {
            const csv = toCsvString(placeholder)
            return [name, formatTableMarkdown(csv)]
          }

          if (Array.isArray(placeholder)) {
            return [name, placeholder.join('\n')]
          }

          return [name, placeholder ?? '']
        })
      )
    },
    contextValues(state): PlaceholderMap {
      return Object.fromEntries(
        this.placeholders.map((name) => {
          const type = resolvePlaceholderType(name, this.placeholderTypes)
          const value = state.placeholderValues[name]
          if (type === 'list') {
            const items = toFinalList(value)
            return [name, listContextString(items)]
          }
          if (type === 'table') {
            const csv = toCsvString(value)
            return [name, tableContextString(csv)]
          }
          if (Array.isArray(value)) {
            return [name, value.join('\n')]
          }
          return [name, value ?? '']
        })
      )
    }
  },
  actions: {
    setTemplateContent(content: string) {
      this.editorContent = content
    },
    selectTemplate(id: string) {
      const found = this.templates.find((template) => template.id === id)
      if (found) {
        this.selectedTemplateId = found.id
        this.editorContent = found.content
        this.placeholderValues = {}
        this.placeholderTypes = {}
        this.generatedValues = {}
      }
    },
    updatePlaceholderValue(name: string, value: PlaceholderValue) {
      this.placeholderValues = {
        ...this.placeholderValues,
        [name]: value
      }
    },
    setPlaceholderType(name: string, type: PlaceholderType) {
      const previous = resolvePlaceholderType(name, this.placeholderTypes)
      if (previous === type) {
        if (this.placeholderTypes[name] && type === inferPlaceholderType(name)) {
          const { [name]: _removed, ...rest } = this.placeholderTypes
          this.placeholderTypes = rest
        }
        return
      }

      if (type === inferPlaceholderType(name)) {
        const { [name]: _removed, ...rest } = this.placeholderTypes
        this.placeholderTypes = rest
      } else {
        this.placeholderTypes = {
          ...this.placeholderTypes,
          [name]: type
        }
      }

      if (type === 'list') {
        const items = toEditableList(this.placeholderValues[name])
        this.placeholderValues = {
          ...this.placeholderValues,
          [name]: items
        }
        return
      }

      if (type === 'table') {
        const csv = toCsvString(this.placeholderValues[name])
        this.placeholderValues = {
          ...this.placeholderValues,
          [name]: csv
        }
        return
      }

      const value = this.placeholderValues[name]
      const text = Array.isArray(value) ? toFinalList(value).join('\n') : value ?? ''
      this.placeholderValues = {
        ...this.placeholderValues,
        [name]: text
      }
    },
    addListItem(name: string) {
      const items = toEditableList(this.placeholderValues[name])
      items.push('')
      this.placeholderValues = {
        ...this.placeholderValues,
        [name]: items
      }
    },
    updateListItem(name: string, index: number, value: string) {
      const items = toEditableList(this.placeholderValues[name])
      items[index] = value
      this.placeholderValues = {
        ...this.placeholderValues,
        [name]: items
      }
    },
    removeListItem(name: string, index: number) {
      const items = toEditableList(this.placeholderValues[name])
      if (items.length <= 1) {
        items[0] = ''
      } else {
        items.splice(index, 1)
      }
      this.placeholderValues = {
        ...this.placeholderValues,
        [name]: items
      }
    },
    setGeneratedValues(values: PlaceholderMap) {
      this.generatedValues = values
    },
    setIsGenerating(value: boolean) {
      this.isGenerating = value
    },
    setError(message: string | null) {
      this.errorMessage = message ?? ''
    }
  }
})
