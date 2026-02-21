/**
 * Intelligent Model Router
 * Automatically selects the best AI model based on task and context
 */

export interface ModelConfig {
  id: string
  provider: 'openai' | 'google' | 'anthropic'
  name: string
  apiModel: string
  strengths: string[]
  costPer1M: number
  speedTier: 'fast' | 'medium' | 'slow'
  maxTokens: number
}

export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
  'gemini-pro': {
    id: 'gemini-pro',
    provider: 'google',
    name: 'Gemini Pro',
    apiModel: 'gemini-pro',
    strengths: ['simple', 'fast', 'cheap', 'general'],
    costPer1M: 50, // $0.05 per generation (estimate)
    speedTier: 'fast',
    maxTokens: 32000,
  },
  'gpt-4-turbo': {
    id: 'gpt-4-turbo',
    provider: 'openai',
    name: 'GPT-4 Turbo',
    apiModel: 'gpt-4-turbo-preview',
    strengths: ['creative', 'ui', 'general', 'balanced', 'code', 'debug'],
    costPer1M: 150, // $0.15 per generation (estimate)
    speedTier: 'medium',
    maxTokens: 16000,
  },
}

export interface RoutingContext {
  prompt: string
  hasExistingProject: boolean
  fileCount: number
  previousModel?: string
  userPreference?: string
}

/**
 * Classify user intent from prompt
 */
function classifyIntent(prompt: string): string {
  const lower = prompt.toLowerCase()

  // Debug/Fix patterns
  const debugKeywords = ['fix', 'bug', 'error', 'broken', 'not working', 'issue', 'problem', 'debug']
  if (debugKeywords.some(kw => lower.includes(kw))) {
    return 'debug'
  }

  // Creative/UI patterns
  const creativeKeywords = ['beautiful', 'modern', 'design', 'ui', 'landing', 'website', 'page', 'stunning']
  if (creativeKeywords.some(kw => lower.includes(kw))) {
    return 'creative'
  }

  // Simple patterns
  const simpleKeywords = ['simple', 'basic', 'quick', 'small', 'minimal']
  if (simpleKeywords.some(kw => lower.includes(kw))) {
    return 'simple'
  }

  // Complex patterns
  const complexKeywords = ['complex', 'advanced', 'architecture', 'system', 'refactor', 'migrate']
  if (complexKeywords.some(kw => lower.includes(kw))) {
    return 'complex'
  }

  return 'general'
}

/**
 * Estimate complexity from context
 */
function estimateComplexity(context: RoutingContext): 'low' | 'medium' | 'high' {
  if (context.fileCount === 0) return 'low'
  if (context.fileCount < 8) return 'medium'
  return 'high'
}

/**
 * Smart model selection based on intent and context
 * GPT-4 Turbo is PRIMARY (90%), Gemini for simple tasks (10%)
 */
export function selectBestModel(context: RoutingContext): ModelConfig {
  const intent = classifyIntent(context.prompt)
  const complexity = estimateComplexity(context)

  // User has explicit preference?
  if (context.userPreference && AVAILABLE_MODELS[context.userPreference]) {
    return AVAILABLE_MODELS[context.userPreference]
  }

  // SMART ROUTING: Gemini for simple, GPT-4 for everything else
  
  // Only use Gemini for VERY simple, small projects
  // This catches ~10% of requests and saves costs
  if (intent === 'simple' && complexity === 'low') {
    return AVAILABLE_MODELS['gemini-pro']
  }

  // Everything else → GPT-4 Turbo (~90% of requests)
  // This includes: debug, creative, complex, general, medium tasks
  // GPT-4 is our workhorse - best quality and reliability
  return AVAILABLE_MODELS['gpt-4-turbo']
}

/**
 * Get reasoning for model selection (for UI display)
 */
export function getSelectionReason(model: ModelConfig, context: RoutingContext): string {
  const intent = classifyIntent(context.prompt)

  // Gemini reasoning
  if (model.id === 'gemini-pro') {
    return 'Fast and cost-effective for simple tasks'
  }

  // GPT-4 reasoning based on intent
  if (intent === 'debug') {
    return 'GPT-4 Turbo - excellent for debugging and code analysis'
  }
  if (intent === 'creative') {
    return 'GPT-4 Turbo - most creative for UI and design'
  }
  if (intent === 'complex') {
    return 'GPT-4 Turbo - handles complex architectures expertly'
  }

  return 'GPT-4 Turbo - best quality and reliability'
}

/**
 * Calculate estimated cost
 */
export function estimateCost(model: ModelConfig): string {
  const cost = model.costPer1M / 1000
  return `~$${cost.toFixed(2)}`
}
