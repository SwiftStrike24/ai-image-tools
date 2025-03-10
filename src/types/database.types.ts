export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      subscriptions: {
        Row: {
          cancellation_date: string | null
          clerk_id: string
          id: string
          next_billing_date: string | null
          pending_downgrade: boolean | null
          pending_upgrade: string | null
          plan: string
          status: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          cancellation_date?: string | null
          clerk_id: string
          id?: string
          next_billing_date?: string | null
          pending_downgrade?: boolean | null
          pending_upgrade?: string | null
          plan?: string
          status?: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          cancellation_date?: string | null
          clerk_id?: string
          id?: string
          next_billing_date?: string | null
          pending_downgrade?: boolean | null
          pending_upgrade?: string | null
          plan?: string
          status?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_subscriptions_users"
            columns: ["clerk_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["clerk_id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          clerk_id: string
          created_at: string | null
          enhance_prompt: number | null
          generator: number | null
          id: string
          updated_at: string | null
          upscaler: number | null
        }
        Insert: {
          clerk_id: string
          created_at?: string | null
          enhance_prompt?: number | null
          generator?: number | null
          id?: string
          updated_at?: string | null
          upscaler?: number | null
        }
        Update: {
          clerk_id?: string
          created_at?: string | null
          enhance_prompt?: number | null
          generator?: number | null
          id?: string
          updated_at?: string | null
          upscaler?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user"
            columns: ["clerk_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["clerk_id"]
          },
        ]
      }
      users: {
        Row: {
          clerk_id: string
          created_at: string | null
          email: string
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          clerk_id: string
          created_at?: string | null
          email: string
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          clerk_id?: string
          created_at?: string | null
          email?: string
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_user_data: {
        Args: {
          user_clerk_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
