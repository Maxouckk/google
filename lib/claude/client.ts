import Anthropic from "@anthropic-ai/sdk"
import { buildPrompt, type OptimizationResult } from "./prompts"
import { CLAUDE_MODEL } from "@/lib/constants"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generateTitleSuggestions(product: {
  title: string
  description?: string | null
  price?: number | null
  currency?: string
  brand?: string | null
  googleCategory?: string | null
  productType?: string | null
  gtin?: string | null
  condition?: string | null
  freeClicks: number
  adsClicks: number
  totalImpressions: number
}): Promise<{
  result: OptimizationResult
  tokensInput: number
  tokensOutput: number
  responseTimeMs: number
  prompt: string
}> {
  const prompt = buildPrompt(product)
  const startTime = Date.now()

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  })

  const responseTimeMs = Date.now() - startTime

  const textContent = message.content.find((c) => c.type === "text")
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude")
  }

  // Parse the JSON response
  const jsonText = textContent.text.trim()
  let result: OptimizationResult

  try {
    result = JSON.parse(jsonText)
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      result = JSON.parse(jsonMatch[1].trim())
    } else {
      throw new Error("Failed to parse Claude response as JSON")
    }
  }

  // Validate the result structure
  if (
    !result.suggestions ||
    !Array.isArray(result.suggestions) ||
    result.suggestions.length === 0
  ) {
    throw new Error("Invalid suggestions format from Claude")
  }

  return {
    result,
    tokensInput: message.usage.input_tokens,
    tokensOutput: message.usage.output_tokens,
    responseTimeMs,
    prompt,
  }
}
