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
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
          is_cancelled: boolean
          kickoff_at: string | null
          kickoff_str: string | null
          league: string | null
          result: string | null
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
          is_cancelled?: boolean
          kickoff_at?: string | null
          kickoff_str?: string | null
          league?: string | null
          result?: string | null
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
          is_cancelled?: boolean
          kickoff_at?: string | null
          kickoff_str?: string | null
          league?: string | null
          result?: string | null
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
      league_admins: {
        Row: {
          created_at: string
          id: string
          league_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          league_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          league_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_admins_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          created_at: string
          id: string
          join_code: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          join_code: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          join_code?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          league_id: string | null
          name: string
        }
        Insert: {
          created_at?: string
          id: string
          league_id?: string | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          league_id?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      round_scores: {
        Row: {
          created_at: string
          hits: number
          id: string
          is_payer: boolean
          rank: number | null
          round_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hits?: number
          id?: string
          is_payer?: boolean
          rank?: number | null
          round_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          hits?: number
          id?: string
          is_payer?: boolean
          rank?: number | null
          round_id?: string
          user_id?: string
        }
        Relationships: []
      }
      team_aliases: {
        Row: {
          alias: string
          canonical: string
          id: number
        }
        Insert: {
          alias: string
          canonical: string
          id?: number
        }
        Update: {
          alias?: string
          canonical?: string
          id?: number
        }
        Relationships: []
      }
      toto_rounds: {
        Row: {
          created_at: string
          deadline: string
          id: string
          results_updated: boolean | null
          round_number: number
          start_date: string
          status: string | null
        }
        Insert: {
          created_at?: string
          deadline: string
          id?: string
          results_updated?: boolean | null
          round_number: number
          start_date: string
          status?: string | null
        }
        Update: {
          created_at?: string
          deadline?: string
          id?: string
          results_updated?: boolean | null
          round_number?: number
          start_date?: string
          status?: string | null
        }
        Relationships: []
      }
      user_bets: {
        Row: {
          created_at: string
          id: string
          is_autofilled: boolean | null
          round_id: string | null
          submitted_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_autofilled?: boolean | null
          round_id?: string | null
          submitted_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_autofilled?: boolean | null
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      compute_round_scores_sql: {
        Args: { p_round_id: string }
        Returns: undefined
      }
      get_user_league_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_league_admin: {
        Args: { _league_id: string; _user_id: string }
        Returns: boolean
      }
      normalize_team_name: { Args: { p_name: string }; Returns: string }
      validate_fixtures_json: { Args: { p_json: Json }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "editor" | "user"
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
    Enums: {
      app_role: ["admin", "editor", "user"],
    },
  },
} as const
