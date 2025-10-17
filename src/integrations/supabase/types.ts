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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_metadata: {
        Row: {
          activity_state: string | null
          agent_id: string
          cpu_usage: number | null
          created_at: string | null
          id: string
          last_active_at: string | null
          memory_mb: number | null
          response_latency_ms: number | null
          uptime_seconds: number | null
        }
        Insert: {
          activity_state?: string | null
          agent_id: string
          cpu_usage?: number | null
          created_at?: string | null
          id?: string
          last_active_at?: string | null
          memory_mb?: number | null
          response_latency_ms?: number | null
          uptime_seconds?: number | null
        }
        Update: {
          activity_state?: string | null
          agent_id?: string
          cpu_usage?: number | null
          created_at?: string | null
          id?: string
          last_active_at?: string | null
          memory_mb?: number | null
          response_latency_ms?: number | null
          uptime_seconds?: number | null
        }
        Relationships: []
      }
      confidence_scores: {
        Row: {
          created_at: string | null
          final_score: number
          id: string
          initial_score: number
          passed_validation: boolean | null
          query_id: string | null
          reprompt_count: number | null
          verification_method: string | null
        }
        Insert: {
          created_at?: string | null
          final_score: number
          id?: string
          initial_score: number
          passed_validation?: boolean | null
          query_id?: string | null
          reprompt_count?: number | null
          verification_method?: string | null
        }
        Update: {
          created_at?: string | null
          final_score?: number
          id?: string
          initial_score?: number
          passed_validation?: boolean | null
          query_id?: string | null
          reprompt_count?: number | null
          verification_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "confidence_scores_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "query_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string
          created_at: string | null
          domain: string | null
          id: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          domain?: string | null
          id?: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          domain?: string | null
          id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      embeddings_cache: {
        Row: {
          access_count: number | null
          compressed: boolean | null
          content_hash: string
          content_text: string
          created_at: string | null
          domain: string | null
          embedding_vector: Json
          id: string
          last_accessed_at: string | null
        }
        Insert: {
          access_count?: number | null
          compressed?: boolean | null
          content_hash: string
          content_text: string
          created_at?: string | null
          domain?: string | null
          embedding_vector: Json
          id?: string
          last_accessed_at?: string | null
        }
        Update: {
          access_count?: number | null
          compressed?: boolean | null
          content_hash?: string
          content_text?: string
          created_at?: string | null
          domain?: string | null
          embedding_vector?: Json
          id?: string
          last_accessed_at?: string | null
        }
        Relationships: []
      }
      entities: {
        Row: {
          created_at: string | null
          domain: string | null
          id: string
          name: string
          properties: Json | null
          type: string
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: string
          name: string
          properties?: Json | null
          type: string
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: string
          name?: string
          properties?: Json | null
          type?: string
        }
        Relationships: []
      }
      ontologies: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          schema: Json
        }
        Insert: {
          created_at?: string | null
          domain: string
          id?: string
          schema: Json
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          schema?: Json
        }
        Relationships: []
      }
      query_cache: {
        Row: {
          access_count: number | null
          confidence_score: number | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          model_used: string | null
          query_hash: string
          query_text: string
          response_text: string
          verification_status: string | null
        }
        Insert: {
          access_count?: number | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          model_used?: string | null
          query_hash: string
          query_text: string
          response_text: string
          verification_status?: string | null
        }
        Update: {
          access_count?: number | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          model_used?: string | null
          query_hash?: string
          query_text?: string
          response_text?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      relationships: {
        Row: {
          created_at: string | null
          id: string
          relationship_type: string
          source_entity_id: string | null
          strength: number | null
          target_entity_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          relationship_type: string
          source_entity_id?: string | null
          strength?: number | null
          target_entity_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          relationship_type?: string
          source_entity_id?: string | null
          strength?: number | null
          target_entity_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relationships_source_entity_id_fkey"
            columns: ["source_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_target_entity_id_fkey"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          created_at: string | null
          id: string
          log_type: string
          message: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          log_type: string
          message: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          log_type?: string
          message?: string
          metadata?: Json | null
        }
        Relationships: []
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
