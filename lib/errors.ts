/**
 * Error Handling Utilities
 * Provides user-friendly error messages and suggestions
 */

export interface ErrorDetails {
  title: string
  message: string
  suggestion?: string
  docsLink?: string
  canRetry: boolean
}

/**
 * Parse error and return user-friendly details
 */
export function parseError(error: unknown): ErrorDetails {
  const err = error instanceof Error ? error : new Error(String(error))
  const message = err.message.toLowerCase()

  // OpenAI API errors
  if (message.includes('openai') || message.includes('api key')) {
    if (message.includes('invalid') || message.includes('incorrect')) {
      return {
        title: 'Invalid OpenAI API Key',
        message: 'Your OpenAI API key appears to be invalid or incorrect.',
        suggestion: 'Please check your .env.local file and make sure OPENAI_API_KEY is set correctly. Get a new key from platform.openai.com/api-keys',
        docsLink: '/docs/setup#openai',
        canRetry: false,
      }
    }
    
    if (message.includes('quota') || message.includes('insufficient')) {
      return {
        title: 'OpenAI Quota Exceeded',
        message: 'You have exceeded your OpenAI API quota.',
        suggestion: 'Please check your usage at platform.openai.com/usage and add credits to your account.',
        docsLink: 'https://platform.openai.com/usage',
        canRetry: true,
      }
    }
    
    if (message.includes('rate limit')) {
      return {
        title: 'Rate Limit Exceeded',
        message: 'Too many requests to OpenAI API.',
        suggestion: 'Please wait a moment and try again. Rate limits reset every minute.',
        canRetry: true,
      }
    }
  }

  // Gemini API errors
  if (message.includes('gemini') || message.includes('google')) {
    if (message.includes('api key') || message.includes('invalid')) {
      return {
        title: 'Invalid Gemini API Key',
        message: 'Your Google Gemini API key is invalid.',
        suggestion: 'Check your .env.local file. Get a key from makersuite.google.com/app/apikey',
        canRetry: false,
      }
    }
  }

  // Claude API errors
  if (message.includes('claude') || message.includes('anthropic')) {
    if (message.includes('api key')) {
      return {
        title: 'Invalid Claude API Key',
        message: 'Your Anthropic Claude API key is invalid.',
        suggestion: 'Check your .env.local file. Get a key from console.anthropic.com/settings/keys',
        canRetry: false,
      }
    }
  }

  // Supabase/Database errors
  if (message.includes('supabase') || message.includes('database')) {
    if (message.includes('not authenticated') || message.includes('unauthorized')) {
      return {
        title: 'Authentication Required',
        message: 'You need to be logged in to save projects.',
        suggestion: 'Please sign in to continue.',
        canRetry: false,
      }
    }
    
    if (message.includes('connection') || message.includes('network')) {
      return {
        title: 'Database Connection Failed',
        message: 'Could not connect to the database.',
        suggestion: 'Check your internet connection and Supabase credentials in .env.local',
        docsLink: '/docs/setup#supabase',
        canRetry: true,
      }
    }
  }

  // Vercel deployment errors
  if (message.includes('vercel') || message.includes('deploy')) {
    if (message.includes('token') || message.includes('unauthorized')) {
      return {
        title: 'Invalid Vercel Token',
        message: 'Your Vercel deployment token is invalid or missing.',
        suggestion: 'Check VERCEL_TOKEN in .env.local. Get a token from vercel.com/account/tokens',
        docsLink: '/docs/setup#vercel',
        canRetry: false,
      }
    }
    
    if (message.includes('build failed') || message.includes('deployment failed')) {
      return {
        title: 'Deployment Failed',
        message: 'The deployment to Vercel failed during build.',
        suggestion: 'Check the generated code for errors. Try fixing the issues and deploy again.',
        canRetry: true,
      }
    }
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch failed')) {
    return {
      title: 'Network Error',
      message: 'Could not connect to the server.',
      suggestion: 'Check your internet connection and try again.',
      canRetry: true,
    }
  }

  // Timeout errors
  if (message.includes('timeout')) {
    return {
      title: 'Request Timeout',
      message: 'The request took too long to complete.',
      suggestion: 'The server might be busy. Please try again.',
      canRetry: true,
    }
  }

  // Generic error
  return {
    title: 'Something Went Wrong',
    message: err.message || 'An unexpected error occurred.',
    suggestion: 'Please try again. If the problem persists, contact support.',
    canRetry: true,
  }
}

/**
 * Format error for display
 */
export function formatErrorMessage(error: unknown): string {
  const details = parseError(error)
  
  let message = `${details.title}\n\n${details.message}`
  
  if (details.suggestion) {
    message += `\n\nSuggestion: ${details.suggestion}`
  }
  
  if (details.docsLink) {
    message += `\n\nDocs: ${details.docsLink}`
  }
  
  return message
}

/**
 * Log error with context
 */
export function logError(error: unknown, context?: Record<string, any>) {
  const details = parseError(error)
  
  console.error('Error occurred:', {
    title: details.title,
    message: details.message,
    suggestion: details.suggestion,
    context,
    stack: error instanceof Error ? error.stack : undefined,
  })
}
