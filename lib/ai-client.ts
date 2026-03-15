/**
 * Unified AI Client
 * Supports OpenAI, Google Gemini, and Anthropic Claude
 */

import OpenAI from 'openai'
import type { ModelConfig } from './model-router'

// Types
export interface GenerationResult {
  content: string
  model: string
  tokensUsed: number
  cost: number
}

export interface GenerationOptions {
  model: ModelConfig
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  /** Force OpenAI to return valid JSON (fewer parse errors). */
  responseFormat?: 'json_object'
}

// OpenAI Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * OpenAI streaming: yields content deltas. Use for streaming JSON to client.
 */
export async function* createOpenAICompletionStream(options: GenerationOptions): AsyncGenerator<string> {
  const stream = await openai.chat.completions.create({
    model: options.model.apiModel,
    messages: [
      { role: 'system', content: options.systemPrompt || 'You are an expert full-stack developer.' },
      { role: 'user', content: options.prompt },
    ],
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4000,
    stream: true,
    ...(options.responseFormat === 'json_object' && { response_format: { type: 'json_object' as const } }),
  })
  for await (const chunk of stream) {
    const content = chunk.choices?.[0]?.delta?.content
    if (typeof content === 'string' && content) yield content
  }
}

/**
 * Generate with OpenAI (GPT-4)
 */
async function generateWithOpenAI(options: GenerationOptions): Promise<GenerationResult> {
  const response = await openai.chat.completions.create({
    model: options.model.apiModel,
    messages: [
      {
        role: 'system',
        content: options.systemPrompt || 'You are an expert full-stack developer.',
      },
      {
        role: 'user',
        content: options.prompt,
      },
    ],
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 4000,
    ...(options.responseFormat === 'json_object' && { response_format: { type: 'json_object' as const } }),
  })

  const content = response.choices[0]?.message?.content || ''
  const tokensUsed = response.usage?.total_tokens || 0

  return {
    content,
    model: options.model.apiModel,
    tokensUsed,
    cost: (tokensUsed / 1000000) * options.model.costPer1M,
  }
}

/**
 * Generate with Google Gemini
 */
async function generateWithGemini(options: GenerationOptions): Promise<GenerationResult> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY is not configured')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${options.model.apiModel}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: options.systemPrompt 
                ? `${options.systemPrompt}\n\n${options.prompt}` 
                : options.prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 4000,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API error: ${error}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const tokensUsed = data.usageMetadata?.totalTokenCount || 0

  return {
    content,
    model: options.model.apiModel,
    tokensUsed,
    cost: (tokensUsed / 1000000) * options.model.costPer1M,
  }
}

/**
 * Generate with Anthropic Claude
 */
async function generateWithClaude(options: GenerationOptions): Promise<GenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: options.model.apiModel,
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.7,
      system: options.systemPrompt || 'You are an expert full-stack developer.',
      messages: [
        {
          role: 'user',
          content: options.prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API error: ${error}`)
  }

  const data = await response.json()
  const content = data.content?.[0]?.text || ''
  const tokensUsed = data.usage?.input_tokens + data.usage?.output_tokens || 0

  return {
    content,
    model: options.model.apiModel,
    tokensUsed,
    cost: (tokensUsed / 1000000) * options.model.costPer1M,
  }
}

/**
 * Main generate function - routes to appropriate provider
 */
export async function generateWithAI(options: GenerationOptions): Promise<GenerationResult> {
  try {
    switch (options.model.provider) {
      case 'openai':
        return await generateWithOpenAI(options)
      
      case 'google':
        return await generateWithGemini(options)
      
      case 'anthropic':
        return await generateWithClaude(options)
      
      default:
        throw new Error(`Unsupported provider: ${options.model.provider}`)
    }
  } catch (error) {
    console.error('AI Generation error:', error)
    
    // Fallback to OpenAI if other provider fails
    if (options.model.provider !== 'openai') {
      console.log('Falling back to OpenAI...')
      const openaiModel = {
        ...options.model,
        provider: 'openai' as const,
        apiModel: 'gpt-4-turbo-preview',
      }
      return await generateWithOpenAI({ ...options, model: openaiModel })
    }
    
    throw error
  }
}

/**
 * Test all providers (for debugging)
 */
export async function testProviders() {
  const testPrompt = 'Say "Hello" in JSON format'
  
  const results = {
    openai: { available: false, error: null as string | null },
    gemini: { available: false, error: null as string | null },
    claude: { available: false, error: null as string | null },
  }

  // Test OpenAI
  try {
    if (process.env.OPENAI_API_KEY) {
      await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: testPrompt }],
        max_tokens: 10,
      })
      results.openai.available = true
    }
  } catch (error) {
    results.openai.error = error instanceof Error ? error.message : 'Unknown error'
  }

  // Test Gemini
  try {
    if (process.env.GOOGLE_GEMINI_API_KEY) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: testPrompt }] }],
          }),
        }
      )
      if (response.ok) {
        results.gemini.available = true
      } else {
        results.gemini.error = await response.text()
      }
    }
  } catch (error) {
    results.gemini.error = error instanceof Error ? error.message : 'Unknown error'
  }

  // Test Claude
  try {
    if (process.env.ANTHROPIC_API_KEY) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 10,
          messages: [{ role: 'user', content: testPrompt }],
        }),
      })
      if (response.ok) {
        results.claude.available = true
      } else {
        results.claude.error = await response.text()
      }
    }
  } catch (error) {
    results.claude.error = error instanceof Error ? error.message : 'Unknown error'
  }

  return results
}
