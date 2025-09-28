# Markdown Template Editor

A Nuxt 3 application that lets you build markdown templates with AI-assisted placeholder filling. Features a live markdown editor with syntax highlighting, real-time preview, placeholder guidance, and OpenAI-powered content generation.

## Features
- 📝 Markdown editor with CodeMirror syntax highlighting and live preview.
- 🧩 Placeholder-aware templates using `{{placeholder_name}}` format.
- 🤖 AI integration (OpenAI GPT-4o mini) to auto-fill placeholders based on user guidance.
- 📄 Template library with sample project proposal and meeting notes templates.
- 📥 Export tools to copy or download the generated markdown document.
- ✅ Input validation, loading states, and error handling for a smooth experience.

## Getting Started

### 1. Install dependencies
```bash
pnpm install
# or
yarn install
# or
npm install
```

### 2. Configure environment
Create a `.env` file in the project root:
```
OPENAI_API_KEY=sk-...
```

### 3. Run the development server
```bash
npm run dev
```

Visit [http://localhost:3000/editor](http://localhost:3000/editor) to access the editor.

## Project Structure
```
.
├── app.vue
├── assets/
│   └── styles/main.css
├── components/
│   ├── GeneratedPreview.vue
│   ├── MarkdownEditor.vue
│   └── TemplateSelector.vue
├── composables/
│   └── useAI.ts
├── pages/
│   ├── editor.vue
│   ├── index.vue
│   ├── preview.vue
│   └── templates.vue
├── plugins/
│   └── codemirror.client.ts
├── server/
│   └── api/generate.post.ts
├── stores/
│   └── useTemplateStore.ts
├── types/
│   └── ai.ts
├── nuxt.config.ts
├── package.json
├── tailwind.config.js
└── README.md
```

## AI Generation Flow
1. Select a template or craft your own markdown in the editor.
2. Provide guidance for each detected placeholder in the sidebar form.
3. Click **Generate Document** to send the template, placeholders, and guidance to the `/api/generate` endpoint.
4. The API calls OpenAI and returns filled content for each placeholder.
5. The live preview and preview page render the completed markdown document in real time.

## Notes
- The OpenAI API call uses the `gpt-4o-mini` model; update the model name in `server/api/generate.post.ts` if needed.
- Ensure billing is enabled on your OpenAI account to avoid API errors.
- Tailwind CSS powers the UI and includes the typography plugin for pleasant markdown rendering.

Enjoy crafting polished markdown documents with AI assistance! 🚀
