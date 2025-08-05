import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client with anon key for frontend operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

// Authentication helper functions
export const authHelpers = {
  // Sign up a new user
  async signUp(email: string, password: string, userType: 'member' | 'coach' = 'member', fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: userType,
          full_name: fullName
        }
      }
    })
    
    if (error) throw error
    return data
  },

  // Sign in existing user
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },

  // Sign out current user
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  // Get current session
  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },

  // Reset password
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  },

  // Update password
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) throw error
  }
}

// Database helper functions for frontend
export const dbHelpers = {
  // Get user profile
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get coach profiles for search
  async getCoachProfiles() {
    const { data, error } = await supabase
      .from('coach_search_results')
      .select('*')
      .order('rating', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Save a coach to favorites
  async saveCoach(memberId: string, coachId: string) {
    const { data, error } = await supabase
      .from('saved_coaches')
      .insert({
        member_id: memberId,
        coach_id: coachId
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Remove a coach from favorites
  async unsaveCoach(memberId: string, coachId: string) {
    const { error } = await supabase
      .from('saved_coaches')
      .delete()
      .eq('member_id', memberId)
      .eq('coach_id', coachId)
    
    if (error) throw error
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

  // Create a new appointment
  async createAppointment(appointmentData: any) {
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get appointments for current user
  async getUserAppointments(userId: string, userType: 'member' | 'coach') {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq(userType === 'member' ? 'member_id' : 'coach_id', userId)
      .order('appointment_date', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Update appointment status
  async updateAppointmentStatus(appointmentId: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed') {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', appointmentId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Send a message
  async sendMessage(messageData: any) {
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get messages for current user
  async getUserMessages(userId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Mark message as read
  async markMessageAsRead(messageId: string) {
    const { data, error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

export default supabase 