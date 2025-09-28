import { defineStore } from 'pinia'

type PlaceholderMap = Record<string, string>

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
- {{objective_one}}
- {{objective_two}}
- {{objective_three}}

## Timeline
| Milestone | Date | Owner |
| --- | --- | --- |
| {{milestone_one}} | {{milestone_one_date}} | {{milestone_one_owner}} |
| {{milestone_two}} | {{milestone_two_date}} | {{milestone_two_owner}} |

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
1. {{action_item_one}}
2. {{action_item_two}}
3. {{action_item_three}}
`
  }
]

export const useTemplateStore = defineStore('template', {
  state: () => ({
    templates: defaultTemplates,
    selectedTemplateId: defaultTemplates[0]?.id ?? '',
    editorContent: defaultTemplates[0]?.content ?? '',
    placeholderValues: {} as PlaceholderMap,
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
    mergedValues(state): PlaceholderMap {
      return Object.fromEntries(
        this.placeholders.map((name) => [name, state.generatedValues[name] ?? state.placeholderValues[name] ?? ''])
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
        this.generatedValues = {}
      }
    },
    updatePlaceholderValue(name: string, value: string) {
      this.placeholderValues = {
        ...this.placeholderValues,
        [name]: value
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
