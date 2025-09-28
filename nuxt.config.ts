import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    public: {
      appName: 'Markdown Template Editor'
    }
  },
  css: [
    '@/assets/styles/main.css'
  ],
  typescript: {
    strict: true,
    typeCheck: false
  },
  app: {
    head: {
      title: 'Markdown Template Editor',
      meta: [
        { name: 'description', content: 'AI-powered markdown template editor with live preview.' }
      ]
    }
  }
})
