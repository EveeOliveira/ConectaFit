export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_type: "client" | "trainer"
          name: string
          email: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_type: "client" | "trainer"
          name: string
          email: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_type?: "client" | "trainer"
          name?: string
          email?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          fitness_goals: string | null
          health_info: string | null
        }
        Insert: {
          id: string
          fitness_goals?: string | null
          health_info?: string | null
        }
        Update: {
          id?: string
          fitness_goals?: string | null
          health_info?: string | null
        }
      }
      trainers: {
        Row: {
          id: string
          specialization: string | null
          experience_years: number | null
          hourly_rate: number | null
          location: [number, number] | null
          bio: string | null
          rating: number
        }
        Insert: {
          id: string
          specialization?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          location?: [number, number] | null
          bio?: string | null
          rating?: number
        }
        Update: {
          id?: string
          specialization?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          location?: [number, number] | null
          bio?: string | null
          rating?: number
        }
      }
      training_sessions: {
        Row: {
          id: string
          client_id: string
          trainer_id: string
          status: "pending" | "accepted" | "rejected" | "completed" | "cancelled"
          session_date: string
          duration: number
          location: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          trainer_id: string
          status?: "pending" | "accepted" | "rejected" | "completed" | "cancelled"
          session_date: string
          duration: number
          location?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          trainer_id?: string
          status?: "pending" | "accepted" | "rejected" | "completed" | "cancelled"
          session_date?: string
          duration?: number
          location?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workout_plans: {
        Row: {
          id: string
          trainer_id: string
          client_id: string
          title: string
          description: string | null
          start_date: string | null
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trainer_id: string
          client_id: string
          title: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trainer_id?: string
          client_id?: string
          title?: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          name: string
          description: string | null
          video_url: string | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          video_url?: string | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          video_url?: string | null
          image_url?: string | null
          created_at?: string
        }
      }
      workout_exercises: {
        Row: {
          id: string
          workout_plan_id: string
          exercise_id: string
          sets: number
          reps: number
          rest_time: number | null
          notes: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workout_plan_id: string
          exercise_id: string
          sets: number
          reps: number
          rest_time?: number | null
          notes?: string | null
          order_index: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workout_plan_id?: string
          exercise_id?: string
          sets?: number
          reps?: number
          rest_time?: number | null
          notes?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      trainer_reviews: {
        Row: {
          id: string
          client_id: string
          trainer_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          trainer_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          trainer_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      specializations: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
      }
      trainer_specializations: {
        Row: {
          trainer_id: string
          specialization_id: number
        }
        Insert: {
          trainer_id: string
          specialization_id: number
        }
        Update: {
          trainer_id?: string
          specialization_id?: number
        }
      }
    }
  }
}
