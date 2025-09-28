export type PlaceholderRequestPayload = {
  template: string
  placeholders: string[]
  context: Record<string, string>
}

export type PlaceholderResponse = {
  values: Record<string, string>
}
