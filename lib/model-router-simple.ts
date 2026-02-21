/**
 * SIMPLIFIED ROUTER - GPT-4 Only
 * Use this if you want ONLY OpenAI GPT-4
 */

import type { RoutingContext } from './model-router'
import { AVAILABLE_MODELS, type ModelConfig } from './model-router'

/**
 * Always use GPT-4 Turbo
 */
export function selectBestModelSimple(context: RoutingContext): ModelConfig {
  // User preference if set
  if (context.userPreference && AVAILABLE_MODELS[context.userPreference]) {
    return AVAILABLE_MODELS[context.userPreference]
  }

  // ALWAYS GPT-4
  return AVAILABLE_MODELS['gpt-4-turbo']
}

/**
 * Get reasoning (always GPT-4)
 */
export function getSelectionReasonSimple(): string {
  return 'Using GPT-4 Turbo - best quality and reliability'
}
