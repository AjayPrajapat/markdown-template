import '@uiw/vue-codemirror/dist/style.css'
import { defineNuxtPlugin } from '#app'
import VueCodemirror from '@uiw/vue-codemirror'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueCodemirror)
})
