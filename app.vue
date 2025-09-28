<template>
  <div class="min-h-screen flex flex-col">
    <header class="bg-white shadow-sm">
      <nav class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <NuxtLink to="/editor" class="text-xl font-semibold text-primary">Markdown Template Editor</NuxtLink>
        <div class="space-x-4 text-sm font-medium">
          <NuxtLink class="hover:text-primary transition" to="/templates">Templates</NuxtLink>
          <NuxtLink class="hover:text-primary transition" to="/editor">Editor</NuxtLink>
          <NuxtLink class="hover:text-primary transition" to="/preview">Preview</NuxtLink>
        </div>
      </nav>
    </header>
    <main class="flex-1">
      <NuxtPage />
    </main>
    <footer class="bg-slate-900 text-slate-100 text-center py-6 text-sm">
      Built with ❤️ using Nuxt 3 + OpenAI
    </footer>
  </div>
</template>
