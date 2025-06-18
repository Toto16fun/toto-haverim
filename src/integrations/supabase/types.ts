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
      bet_predictions: {
        Row: {
          bet_id: string | null
          created_at: string
          game_id: string | null
          id: string
          is_correct: boolean | null
          is_double: boolean | null
          predictions: string[]
        }
        Insert: {
          bet_id?: string | null
          created_at?: string
          game_id?: string | null
          id?: string
          is_correct?: boolean | null
          is_double?: boolean | null
          predictions: string[]
        }
        Update: {
          bet_id?: string | null
          created_at?: string
          game_id?: string | null
          id?: string
          is_correct?: boolean | null
          is_double?: boolean | null
          predictions?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "bet_predictions_bet_id_fkey"
            columns: ["bet_id"]
            isOneToOne: false
            referencedRelation: "user_bets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bet_predictions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bet_predictions_bet"
            columns: ["bet_id"]
            isOneToOne: false
            referencedRelation: "user_bets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bet_predictions_game"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          actual_result: string | null
          away_team: string
          created_at: string
          game_date: string | null
          game_number: number
          home_team: string
          id: string
          league: string | null
          round_id: string | null
        }
        Insert: {
          actual_result?: string | null
          away_team: string
          created_at?: string
          game_date?: string | null
          game_number: number
          home_team: string
          id?: string
          league?: string | null
          round_id?: string | null
        }
        Update: {
          actual_result?: string | null
          away_team?: string
          created_at?: string
          game_date?: string | null
          game_number?: number
          home_team?: string
          id?: string
          league?: string | null
          round_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_games_round"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "toto_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "toto_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      toto_rounds: {
        Row: {
          created_at: string
          deadline: string
          id: string
          results_updated: boolean | null
          round_number: number
          start_date: string
        }
        Insert: {
          created_at?: string
          deadline: string
          id?: string
          results_updated?: boolean | null
          round_number: number
          start_date: string
        }
        Update: {
          created_at?: string
          deadline?: string
          id?: string
          results_updated?: boolean | null
          round_number?: number
          start_date?: string
        }
        Relationships: []
      }
      user_bets: {
        Row: {
          created_at: string
          id: string
          round_id: string | null
          submitted_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          round_id?: string | null
          submitted_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          round_id?: string | null
          submitted_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_bets_round"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "toto_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bets_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "toto_rounds"
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
