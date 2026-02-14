export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      couple_todos: {
        Row: {
          added_by: string
          couple_id: string
          created_at: string
          id: string
          place: string
          status: string
        }
        Insert: {
          added_by: string
          couple_id: string
          created_at?: string
          id?: string
          place: string
          status?: string
        }
        Update: {
          added_by?: string
          couple_id?: string
          created_at?: string
          id?: string
          place?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_todos_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couples: {
        Row: {
          created_at: string
          id: string
          partner1_nickname: string
          partner1_phone: string
          partner1_role: string
          partner1_username: string
          partner2_nickname: string | null
          partner2_phone: string | null
          partner2_role: string | null
          partner2_username: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          partner1_nickname: string
          partner1_phone: string
          partner1_role?: string
          partner1_username: string
          partner2_nickname?: string | null
          partner2_phone?: string | null
          partner2_role?: string | null
          partner2_username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          partner1_nickname?: string
          partner1_phone?: string
          partner1_role?: string
          partner1_username?: string
          partner2_nickname?: string | null
          partner2_phone?: string | null
          partner2_role?: string | null
          partner2_username?: string | null
        }
        Relationships: []
      }
      diary_entries: {
        Row: {
          content: string
          couple_id: string
          created_at: string
          id: string
          title: string
          visibility: string
          written_by: string
        }
        Insert: {
          content: string
          couple_id: string
          created_at?: string
          id?: string
          title: string
          visibility?: string
          written_by: string
        }
        Update: {
          content?: string
          couple_id?: string
          created_at?: string
          id?: string
          title?: string
          visibility?: string
          written_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "diary_entries_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_photos: {
        Row: {
          caption: string | null
          couple_id: string
          created_at: string
          file_url: string
          id: string
          uploaded_by: string
          visibility: string
        }
        Insert: {
          caption?: string | null
          couple_id: string
          created_at?: string
          file_url: string
          id?: string
          uploaded_by: string
          visibility?: string
        }
        Update: {
          caption?: string | null
          couple_id?: string
          created_at?: string
          file_url?: string
          id?: string
          uploaded_by?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_photos_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          couple_id: string
          created_at: string
          id: string
          sender_nickname: string
          text: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          id?: string
          sender_nickname: string
          text: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          id?: string
          sender_nickname?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          couple_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          recipient_nickname: string
          sender_nickname: string
          type: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          recipient_nickname: string
          sender_nickname: string
          type: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          recipient_nickname?: string
          sender_nickname?: string
          type?: string
        }
        Relationships: []
      }
      premium_requests: {
        Row: {
          amount: number
          couple_id: string
          created_at: string
          id: string
          plan: string
          screenshot_url: string | null
          status: string
        }
        Insert: {
          amount: number
          couple_id: string
          created_at?: string
          id?: string
          plan: string
          screenshot_url?: string | null
          status?: string
        }
        Update: {
          amount?: number
          couple_id?: string
          created_at?: string
          id?: string
          plan?: string
          screenshot_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_requests_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      snap_moments: {
        Row: {
          couple_id: string
          created_at: string
          file_url: string
          id: string
          uploaded_by: string
          visibility: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          file_url: string
          id?: string
          uploaded_by: string
          visibility?: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          file_url?: string
          id?: string
          uploaded_by?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "snap_moments_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      truth_or_dare: {
        Row: {
          answer: string | null
          answered_by: string | null
          asked_by: string
          couple_id: string
          created_at: string
          id: string
          is_custom: boolean
          question: string
          type: string
        }
        Insert: {
          answer?: string | null
          answered_by?: string | null
          asked_by: string
          couple_id: string
          created_at?: string
          id?: string
          is_custom?: boolean
          question: string
          type: string
        }
        Update: {
          answer?: string | null
          answered_by?: string | null
          asked_by?: string
          couple_id?: string
          created_at?: string
          id?: string
          is_custom?: boolean
          question?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "truth_or_dare_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
