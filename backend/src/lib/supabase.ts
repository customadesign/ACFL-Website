import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client with service role key for backend operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database types (you can generate these with Supabase CLI)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          user_type: 'member' | 'coach' | 'admin'
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          user_type: 'member' | 'coach' | 'admin'
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          user_type?: 'member' | 'coach' | 'admin'
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      coach_profiles: {
        Row: {
          id: string
          user_id: string
          bio: string | null
          specialties: string[] | null
          years_experience: number | null
          education: string[] | null
          certifications: string[] | null
          languages: string[] | null
          hourly_rate: number | null
          availability: any | null
          video_url: string | null
          is_verified: boolean
          rating: number | null
          total_sessions: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bio?: string | null
          specialties?: string[] | null
          years_experience?: number | null
          education?: string[] | null
          certifications?: string[] | null
          languages?: string[] | null
          hourly_rate?: number | null
          availability?: any | null
          video_url?: string | null
          is_verified?: boolean
          rating?: number | null
          total_sessions?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bio?: string | null
          specialties?: string[] | null
          years_experience?: number | null
          education?: string[] | null
          certifications?: string[] | null
          languages?: string[] | null
          hourly_rate?: number | null
          availability?: any | null
          video_url?: string | null
          is_verified?: boolean
          rating?: number | null
          total_sessions?: number
          created_at?: string
          updated_at?: string
        }
      }
      member_assessments: {
        Row: {
          id: string
          user_id: string
          areas_of_concern: string[] | null
          preferred_gender: string | null
          preferred_language: string | null
          budget_range: string | null
          availability_preferences: any | null
          urgency_level: string | null
          previous_experience: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          areas_of_concern?: string[] | null
          preferred_gender?: string | null
          preferred_language?: string | null
          budget_range?: string | null
          availability_preferences?: any | null
          urgency_level?: string | null
          previous_experience?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          areas_of_concern?: string[] | null
          preferred_gender?: string | null
          preferred_language?: string | null
          budget_range?: string | null
          availability_preferences?: any | null
          urgency_level?: string | null
          previous_experience?: string | null
          created_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          member_id: string
          coach_id: string
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          appointment_date: string
          duration_minutes: number
          session_type: string
          video_meeting_id: string | null
          video_meeting_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          coach_id: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          appointment_date: string
          duration_minutes?: number
          session_type?: string
          video_meeting_id?: string | null
          video_meeting_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          coach_id?: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          appointment_date?: string
          duration_minutes?: number
          session_type?: string
          video_meeting_id?: string | null
          video_meeting_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      saved_coaches: {
        Row: {
          id: string
          member_id: string
          coach_id: string
          created_at: string
        }
        Insert: {
          id?: string
          member_id: string
          coach_id: string
          created_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          coach_id?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          appointment_id: string | null
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          appointment_id?: string | null
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          appointment_id?: string | null
          content?: string
          is_read?: boolean
          created_at?: string
        }
      }
      session_notes: {
        Row: {
          id: string
          appointment_id: string
          coach_id: string
          notes: string | null
          goals_met: string[] | null
          next_steps: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          coach_id: string
          notes?: string | null
          goals_met?: string[] | null
          next_steps?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string
          coach_id?: string
          notes?: string | null
          goals_met?: string[] | null
          next_steps?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      coach_search_results: {
        Row: {
          profile_id: string
          user_id: string
          full_name: string | null
          email: string
          bio: string | null
          specialties: string[] | null
          years_experience: number | null
          languages: string[] | null
          hourly_rate: number | null
          rating: number | null
          total_sessions: number
          is_verified: boolean
        }
      }
      appointment_details: {
        Row: {
          id: string
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          appointment_date: string
          duration_minutes: number
          session_type: string
          video_meeting_url: string | null
          notes: string | null
          created_at: string
          member_name: string | null
          member_email: string
          coach_name: string | null
          coach_email: string
          hourly_rate: number | null
        }
      }
      unread_message_counts: {
        Row: {
          receiver_id: string
          unread_count: number
        }
      }
    }
    Functions: {
      calculate_coach_rating: {
        Args: {
          coach_user_id: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper functions for common database operations
export const dbHelpers = {
  // Get user by ID
  async getUserById(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  // Get coach profile by user ID
  async getCoachProfile(userId: string) {
    const { data, error } = await supabase
      .from('coach_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  // Get member assessment by user ID
  async getMemberAssessment(userId: string) {
    const { data, error } = await supabase
      .from('member_assessments')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  // Get appointments for a user
  async getUserAppointments(userId: string, userType: 'member' | 'coach') {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq(userType === 'member' ? 'member_id' : 'coach_id', userId)
      .order('appointment_date', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Get saved coaches for a member
  async getSavedCoaches(memberId: string) {
    const { data, error } = await supabase
      .from('saved_coaches')
      .select(`
        *,
        coach_profiles!inner(*),
        users!inner(*)
      `)
      .eq('member_id', memberId)
    
    if (error) throw error
    return data
  },

  // Get messages for a user
  async getUserMessages(userId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }
}

export default supabase 