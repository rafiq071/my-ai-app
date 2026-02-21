import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

/**
 * Get current session on server side
 */
export async function getSession() {
  return await getServerSession(authOptions)
}

/**
 * Get current user on server side
 * Throws error if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSession()
  
  if (!session?.user) {
    throw new Error('Not authenticated')
  }
  
  return session.user
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const session = await getSession()
  return !!session?.user
}

/**
 * Require authentication (for API routes)
 * Throws error if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  return user
}
