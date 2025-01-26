export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      machines: {
        Row: {
          id: string
          code: string
          plant: string
          name: string
          serial_number: string
          created_at: string
        }
        Insert: {
          id?: string
          code?: string
          plant: string
          name: string
          serial_number: string
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          plant?: string
          name?: string
          serial_number?: string
          created_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          code: string
          type: 'truck' | 'vehicle' | 'equipment'
          model: string
          brand: string
          year: number
          serial_number: string
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          type: 'truck' | 'vehicle' | 'equipment'
          model: string
          brand: string
          year: number
          serial_number: string
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          type?: 'truck' | 'vehicle' | 'equipment'
          model?: string
          brand?: string
          year?: number
          serial_number?: string
          created_at?: string
        }
      }
      repairs: {
        Row: {
          id: string
          vehicle_id: string
          mechanic_id: string
          status: 'pending' | 'in_progress' | 'completed'
          description: string
          started_at: string
          completed_at?: string
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          mechanic_id: string
          status?: 'pending' | 'in_progress' | 'completed'
          description: string
          started_at?: string
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          mechanic_id?: string
          status?: 'pending' | 'in_progress' | 'completed'
          description?: string
          started_at?: string
          completed_at?: string
          created_at?: string
        }
      }
      repair_comments: {
        Row: {
          id: string
          repair_id: string
          user_id: string
          comment: string
          status: 'pending' | 'read'
          created_at: string
          updated_at?: string
        }
        Insert: {
          id?: string
          repair_id: string
          user_id: string
          comment: string
          status?: 'pending' | 'read'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          repair_id?: string
          user_id?: string
          comment?: string
          status?: 'pending' | 'read'
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'mechanic'
          full_name: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'admin' | 'mechanic'
          full_name: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'mechanic'
          full_name?: string
          created_at?: string
        }
      }
      system_settings: {
        Row: {
          key: string
          value: string
          created_at: string
          updated_at: string
        }
        Insert: {
          key: string
          value: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'mechanic'
      vehicle_type: 'truck' | 'vehicle' | 'equipment'
      repair_status: 'pending' | 'in_progress' | 'completed'
    }
  }
}