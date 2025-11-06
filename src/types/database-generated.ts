export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
  public: {
    Tables: {
      companies: {
        Row: {
          created_at: string | null
          id: string
          industry: string | null
          name: string
          size: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          industry?: string | null
          name: string
          size?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          industry?: string | null
          name?: string
          size?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      features: {
        Row: {
          business_value: number | null
          company_id: string
          created_at: string | null
          description: string | null
          effort_score: number | null
          id: string
          metadata: Json | null
          name: string
          priority: string | null
          product_area_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          business_value?: number | null
          company_id: string
          created_at?: string | null
          description?: string | null
          effort_score?: number | null
          id?: string
          metadata?: Json | null
          name: string
          priority?: string | null
          product_area_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          business_value?: number | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          effort_score?: number | null
          id?: string
          metadata?: Json | null
          name?: string
          priority?: string | null
          product_area_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "features_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "features_product_area_id_fkey"
            columns: ["product_area_id"]
            isOneToOne: false
            referencedRelation: "product_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_items: {
        Row: {
          company_id: string
          content: string
          created_at: string | null
          id: string
          processed_at: string | null
          product_area: string | null
          sentiment: string | null
          source: string
          submitted_at: string | null
          user_metadata: Json | null
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string | null
          id?: string
          processed_at?: string | null
          product_area?: string | null
          sentiment?: string | null
          source: string
          submitted_at?: string | null
          user_metadata?: Json | null
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string | null
          id?: string
          processed_at?: string | null
          product_area?: string | null
          sentiment?: string | null
          source?: string
          submitted_at?: string | null
          user_metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      insight_feature_links: {
        Row: {
          created_at: string | null
          feature_id: string
          impact_score: number | null
          insight_id: string
        }
        Insert: {
          created_at?: string | null
          feature_id: string
          impact_score?: number | null
          insight_id: string
        }
        Update: {
          created_at?: string | null
          feature_id?: string
          impact_score?: number | null
          insight_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insight_feature_links_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insight_feature_links_insight_id_fkey"
            columns: ["insight_id"]
            isOneToOne: false
            referencedRelation: "insights"
            referencedColumns: ["id"]
          },
        ]
      }
      insight_feedback_links: {
        Row: {
          created_at: string | null
          feedback_id: string
          insight_id: string
          relevance_score: number | null
        }
        Insert: {
          created_at?: string | null
          feedback_id: string
          insight_id: string
          relevance_score?: number | null
        }
        Update: {
          created_at?: string | null
          feedback_id?: string
          insight_id?: string
          relevance_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "insight_feedback_links_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insight_feedback_links_insight_id_fkey"
            columns: ["insight_id"]
            isOneToOne: false
            referencedRelation: "insights"
            referencedColumns: ["id"]
          },
        ]
      }
      insight_objective_links: {
        Row: {
          alignment_score: number | null
          created_at: string | null
          insight_id: string
          objective_id: string
        }
        Insert: {
          alignment_score?: number | null
          created_at?: string | null
          insight_id: string
          objective_id: string
        }
        Update: {
          alignment_score?: number | null
          created_at?: string | null
          insight_id?: string
          objective_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insight_objective_links_insight_id_fkey"
            columns: ["insight_id"]
            isOneToOne: false
            referencedRelation: "insights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insight_objective_links_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      insights: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          insight_score: number | null
          segment_context: Json | null
          status: string | null
          summary: string
          theme: string | null
          title: string
          updated_at: string | null
          urgency_score: number | null
          value_alignment_score: number | null
          volume_score: number | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          insight_score?: number | null
          segment_context?: Json | null
          status?: string | null
          summary: string
          theme?: string | null
          title: string
          updated_at?: string | null
          urgency_score?: number | null
          value_alignment_score?: number | null
          volume_score?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          insight_score?: number | null
          segment_context?: Json | null
          status?: string | null
          summary?: string
          theme?: string | null
          title?: string
          updated_at?: string | null
          urgency_score?: number | null
          value_alignment_score?: number | null
          volume_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "insights_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      objectives: {
        Row: {
          company_id: string
          created_at: string | null
          current_value: number | null
          description: string | null
          id: string
          quarter: string | null
          status: string | null
          target_value: number | null
          title: string
          updated_at: string | null
          year: number | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          quarter?: string | null
          status?: string | null
          target_value?: number | null
          title: string
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          quarter?: string | null
          status?: string | null
          target_value?: number | null
          title?: string
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "objectives_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      product_areas: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          keywords: string[] | null
          metadata: Json | null
          name: string
          parent_area_id: string | null
          product_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          keywords?: string[] | null
          metadata?: Json | null
          name: string
          parent_area_id?: string | null
          product_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          keywords?: string[] | null
          metadata?: Json | null
          name?: string
          parent_area_id?: string | null
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_areas_parent_area_id_fkey"
            columns: ["parent_area_id"]
            isOneToOne: false
            referencedRelation: "product_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_areas_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

