import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { supabase } from '@/lib/supabase'

function isInviteAllowed(email: string): boolean {
  const inviteOnly = (process.env.BETA_INVITE_ONLY || 'true').toLowerCase() === 'true'
  if (!inviteOnly) return true

  const allow = (process.env.INVITE_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  if (allow.length === 0) return false
  return allow.includes(email.toLowerCase())
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false

      // Public beta: invite-only gate
      if (!isInviteAllowed(user.email)) {
        console.warn('Invite-only: blocked sign-in for', user.email)
        return false
      }

      try {
        // Supabase persistence is optional; skip profile sync if not configured
        if (!supabase) return true

        // Check if profile exists in Supabase
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', user.email)
          .single()

        if (!existingProfile) {
          // Create profile in Supabase
          // Note: We'll need to handle auth.users separately or use Supabase Auth
          // For now, we'll create a simple profile record
          const { error } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.name || '',
              avatar_url: user.image || '',
            })

          if (error && error.code !== '23505') { // Ignore duplicate key errors
            console.error('Error creating profile:', error)
          }
        }

        return true
      } catch (error) {
        console.error('Sign in error:', error)
        return false
      }
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || ''
      }
      return session
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
