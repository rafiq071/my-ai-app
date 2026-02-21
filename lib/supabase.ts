import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Supabase client is OPTIONAL in this build.
 * If env vars are missing, persistence features will fall back to localStorage.
 */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export function isSupabaseConfigured(): boolean {
  return !!supabase
}

// Database types (kept for reference; schema is provided in supabase/schema.sql)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
        }
        Update: {
          name?: string
          description?: string | null
        }
      }
      project_files: {
        Row: {
          id: string
          project_id: string
          path: string
          content: string
          type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          path: string
          content: string
          type?: string
        }
        Update: {
          path?: string
          content?: string
          type?: string
        }
      }
      deployments: {
        Row: {
          id: string
          project_id: string
          deployment_id: string
          url: string
          preview_url: string | null
          production_url: string | null
          status: string
          error_message: string | null
          created_at: string
          ready_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          deployment_id: string
          url: string
          preview_url?: string | null
          production_url?: string | null
          status?: string
          error_message?: string | null
        }
        Update: {
          status?: string
          error_message?: string | null
          ready_at?: string | null
        }
      }
    }
  }
}
