export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      certification_workflows: {
        Row: {
          admin_approval_status: Database["public"]["Enums"]["app_admin_approval_status"]
          completed_at: string | null
          contract_doc_url: string | null
          contract_status: Database["public"]["Enums"]["app_contract_status"]
          course_id: string
          created_at: string
          current_step: Database["public"]["Enums"]["app_workflow_step"]
          exam_results_json: Json | null
          exam_status: Database["public"]["Enums"]["app_exam_status"]
          exam_submission_url: string | null
          id: string
          level: number
          stripe_checkout_session_id: string | null
          subscription_status: Database["public"]["Enums"]["app_subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_approval_status?: Database["public"]["Enums"]["app_admin_approval_status"]
          completed_at?: string | null
          contract_doc_url?: string | null
          contract_status?: Database["public"]["Enums"]["app_contract_status"]
          course_id: string
          created_at?: string
          current_step?: Database["public"]["Enums"]["app_workflow_step"]
          exam_results_json?: Json | null
          exam_status?: Database["public"]["Enums"]["app_exam_status"]
          exam_submission_url?: string | null
          id?: string
          level: number
          stripe_checkout_session_id?: string | null
          subscription_status?: Database["public"]["Enums"]["app_subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_approval_status?: Database["public"]["Enums"]["app_admin_approval_status"]
          completed_at?: string | null
          contract_doc_url?: string | null
          contract_status?: Database["public"]["Enums"]["app_contract_status"]
          course_id?: string
          created_at?: string
          current_step?: Database["public"]["Enums"]["app_workflow_step"]
          exam_results_json?: Json | null
          exam_status?: Database["public"]["Enums"]["app_exam_status"]
          exam_submission_url?: string | null
          id?: string
          level?: number
          stripe_checkout_session_id?: string | null
          subscription_status?: Database["public"]["Enums"]["app_subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certification_workflows_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_deleted: boolean
          is_edited: boolean
          lesson_id: string | null
          parent_comment_id: string | null
          subsection_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          is_edited?: boolean
          lesson_id?: string | null
          parent_comment_id?: string | null
          subsection_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          is_edited?: boolean
          lesson_id?: string | null
          parent_comment_id?: string | null
          subsection_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      course_completions: {
        Row: {
          certificate_url: string | null
          completed_at: string
          course_id: string
          id: string
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          completed_at?: string
          course_id: string
          id?: string
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          completed_at?: string
          course_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_completions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          exam_duration_minutes: number | null
          exam_instructions: string | null
          exam_url: string | null
          id: string
          is_available: boolean
          is_coming_soon: boolean
          level: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          exam_duration_minutes?: number | null
          exam_instructions?: string | null
          exam_url?: string | null
          id?: string
          is_available?: boolean
          is_coming_soon?: boolean
          level: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          exam_duration_minutes?: number | null
          exam_instructions?: string | null
          exam_url?: string | null
          id?: string
          is_available?: boolean
          is_coming_soon?: boolean
          level?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          content: string | null
          course_id: string
          created_at: string
          duration_minutes: number | null
          id: string
          order_index: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          order_index: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_line1: string
          address_line2: string | null
          avatar_url: string | null
          city: string
          country: string
          created_at: string
          employment_status:
            | Database["public"]["Enums"]["app_employment_status"]
            | null
          first_name: string
          id: string
          languages_spoken: string[] | null
          last_name: string
          occupation: Database["public"]["Enums"]["app_occupation"] | null
          phone_number: string | null
          postal_code: string
          province_state: string
          service_regions: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1?: string
          address_line2?: string | null
          avatar_url?: string | null
          city?: string
          country?: string
          created_at?: string
          employment_status?:
            | Database["public"]["Enums"]["app_employment_status"]
            | null
          first_name: string
          id?: string
          languages_spoken?: string[] | null
          last_name: string
          occupation?: Database["public"]["Enums"]["app_occupation"] | null
          phone_number?: string | null
          postal_code?: string
          province_state?: string
          service_regions?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          avatar_url?: string | null
          city?: string
          country?: string
          created_at?: string
          employment_status?:
            | Database["public"]["Enums"]["app_employment_status"]
            | null
          first_name?: string
          id?: string
          languages_spoken?: string[] | null
          last_name?: string
          occupation?: Database["public"]["Enums"]["app_occupation"] | null
          phone_number?: string | null
          postal_code?: string
          province_state?: string
          service_regions?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      subsection_attachments: {
        Row: {
          created_at: string
          display_name: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          subsection_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          subsection_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          subsection_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      subsections: {
        Row: {
          content: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          order_index: number
          quiz_height: number | null
          quiz_url: string | null
          section_id: string
          subsection_type: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          order_index: number
          quiz_height?: number | null
          quiz_url?: string | null
          section_id: string
          subsection_type?: string
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          order_index?: number
          quiz_height?: number | null
          quiz_url?: string | null
          section_id?: string
          subsection_type?: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subsections_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          lesson_id: string | null
          progress_percentage: number | null
          subsection_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          lesson_id?: string | null
          progress_percentage?: number | null
          subsection_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string | null
          progress_percentage?: number | null
          subsection_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      can_access_course: {
        Args: { user_id_param: string; course_level_param: number }
        Returns: boolean
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_admin_approval_status: "pending" | "approved" | "rejected"
      app_contract_status:
        | "not_required"
        | "pending_signing"
        | "signed"
        | "rejected"
      app_employment_status:
        | "employed"
        | "self_employed"
        | "student"
        | "unemployed"
        | "other"
      app_exam_status:
        | "pending_submission"
        | "submitted"
        | "pending_review"
        | "passed"
        | "failed"
      app_occupation:
        | "Real Estate Agent"
        | "Mortgage Broker"
        | "Home Stager"
        | "Property Manager"
        | "Insurance Broker"
        | "Interior Designer"
        | "Professional Organizer"
        | "Concierge / Lifestyle Manager"
        | "Virtual Assistant"
        | "Customer Service Representative"
        | "Sales Representative"
        | "Freelancer / Self-Employed"
        | "Relocation Specialist / Retired Mover"
        | "Retired Professional"
        | "Student"
        | "Stay-at-Home Parent"
        | "Hospitality Worker (e.g., hotel, Airbnb host)"
        | "Event Planner"
        | "Social Worker / Community Support"
        | "Construction / Renovation Worker"
        | "None of the Above – Other"
      app_role: "student" | "admin"
      app_subscription_status:
        | "not_required"
        | "pending_payment"
        | "paid"
        | "cancelled"
      app_workflow_step:
        | "exam"
        | "approval"
        | "contract"
        | "payment"
        | "completed"
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
      app_admin_approval_status: ["pending", "approved", "rejected"],
      app_contract_status: [
        "not_required",
        "pending_signing",
        "signed",
        "rejected",
      ],
      app_employment_status: [
        "employed",
        "self_employed",
        "student",
        "unemployed",
        "other",
      ],
      app_exam_status: [
        "pending_submission",
        "submitted",
        "pending_review",
        "passed",
        "failed",
      ],
      app_occupation: [
        "Real Estate Agent",
        "Mortgage Broker",
        "Home Stager",
        "Property Manager",
        "Insurance Broker",
        "Interior Designer",
        "Professional Organizer",
        "Concierge / Lifestyle Manager",
        "Virtual Assistant",
        "Customer Service Representative",
        "Sales Representative",
        "Freelancer / Self-Employed",
        "Relocation Specialist / Retired Mover",
        "Retired Professional",
        "Student",
        "Stay-at-Home Parent",
        "Hospitality Worker (e.g., hotel, Airbnb host)",
        "Event Planner",
        "Social Worker / Community Support",
        "Construction / Renovation Worker",
        "None of the Above – Other",
      ],
      app_role: ["student", "admin"],
      app_subscription_status: [
        "not_required",
        "pending_payment",
        "paid",
        "cancelled",
      ],
      app_workflow_step: [
        "exam",
        "approval",
        "contract",
        "payment",
        "completed",
      ],
    },
  },
} as const
