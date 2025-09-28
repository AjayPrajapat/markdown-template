import { defineNuxtPlugin } from '#app'
import VueCodemirror from 'vue-codemirror'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueCodemirror)
})
