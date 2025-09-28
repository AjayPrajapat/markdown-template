import type { PlaceholderRequestPayload, PlaceholderResponse } from '~/types/ai'

export const useAI = () => {
  const generatePlaceholders = async (payload: PlaceholderRequestPayload) => {
    try {
      const response = await $fetch<PlaceholderResponse>('/api/generate', {
        method: 'POST',
        body: payload
      })
      return response
    } catch (error) {
      console.error('AI generation error', error)
      throw error
    }
  }

  return {
    generatePlaceholders
  }
}
