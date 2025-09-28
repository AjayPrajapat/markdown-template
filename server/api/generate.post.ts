import OpenAI from 'openai'
import type { PlaceholderRequestPayload, PlaceholderResponse } from '~/types/ai'

const describePlaceholder = (name: string): string => {
  if (/_table$/i.test(name) || /_csv$/i.test(name)) {
    return `${name} (render as a markdown table using pipes)`
  }
  if (/_list$/i.test(name) || /_items$/i.test(name)) {
    return `${name} (render as a bullet list)`
  }
  return name
}

const buildPrompt = (payload: PlaceholderRequestPayload) => {
  const placeholderList = payload.placeholders.map((name) => `- ${describePlaceholder(name)}`).join('\n')
  const contextEntries = Object.entries(payload.context)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n') || 'No additional context provided.'

  return `You are a writing assistant that completes markdown templates.
Template markdown:
"""
${payload.template}
"""

The template includes placeholders in double curly braces like {{placeholder}}.
Fill each placeholder with concise, professional markdown content. Respect markdown syntax and keep tables intact.

Guidance by suffix:
- Placeholders ending with "_table" or "_csv" must be rendered as markdown tables (| columns | rows |) using the provided CSV context when available.
- Placeholders ending with "_list" or "_items" should be rendered as bullet lists.

List of placeholders:
${placeholderList}

User provided context for placeholders:
${contextEntries}

Respond ONLY with a valid JSON object with the following shape:
{
  "values": {
    "placeholder_name": "filled markdown content"
  }
}
Ensure every placeholder listed is present in the JSON.`
}

export default defineEventHandler(async (event): Promise<PlaceholderResponse> => {
  const body = await readBody<PlaceholderRequestPayload>(event)
  body.context = body.context ?? {}

  if (!body || !Array.isArray(body.placeholders) || body.placeholders.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid payload: No placeholders supplied.'
    })
  }

  const config = useRuntimeConfig()
  if (!config.openaiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing OpenAI API key. Set OPENAI_API_KEY in your environment.'
    })
  }

  const openai = new OpenAI({ apiKey: config.openaiApiKey })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content: 'You are a meticulous assistant that fills in markdown templates using user hints. Always respond with valid JSON.'
      },
      {
        role: 'user',
        content: buildPrompt(body)
      }
    ],
    response_format: { type: 'json_object' }
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) {
    throw createError({
      statusCode: 502,
      statusMessage: 'OpenAI did not return a response.'
    })
  }

  let parsed: PlaceholderResponse
  try {
    parsed = JSON.parse(raw) as PlaceholderResponse
    parsed.values = parsed.values ?? {}
  } catch (error) {
    console.error('Failed to parse OpenAI response', error, raw)
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to parse AI response.'
    })
  }

  const missing = body.placeholders.filter((name) => !(name in parsed.values))
  if (missing.length > 0) {
    for (const name of missing) {
      parsed.values[name] = ''
    }
  }

  return parsed
})
