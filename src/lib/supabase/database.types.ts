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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      cities: {
        Row: {
          country_id: string
          created_at: string | null
          i18n: Json
          id: string
          is_active: boolean
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          country_id: string
          created_at?: string | null
          i18n?: Json
          id?: string
          is_active?: boolean
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          country_id?: string
          created_at?: string | null
          i18n?: Json
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      client_payment_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string
          payment_id: string
          total: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          payment_id: string
          total: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          payment_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_payment_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_payment_items_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "client_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      client_payments: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          currency: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_proof_url: string | null
          period_month: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          currency: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          period_month: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          period_month?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          billing_address: string | null
          billing_postal_code: string | null
          billing_state: string | null
          company_name: string | null
          company_tax_id: string | null
          created_at: string | null
          deleted_at: string | null
          fiscal_id: string | null
          fiscal_id_type_id: string | null
          id: string
          is_business: boolean
          legacy_id: number | null
          status: string
          terms_accepted: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_address?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          company_name?: string | null
          company_tax_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          fiscal_id?: string | null
          fiscal_id_type_id?: string | null
          id?: string
          is_business?: boolean
          legacy_id?: number | null
          status?: string
          terms_accepted?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_address?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          company_name?: string | null
          company_tax_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          fiscal_id?: string | null
          fiscal_id_type_id?: string | null
          id?: string
          is_business?: boolean
          legacy_id?: number | null
          status?: string
          terms_accepted?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_fiscal_id_type_id_fkey"
            columns: ["fiscal_id_type_id"]
            isOneToOne: false
            referencedRelation: "fiscal_id_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          currency: string
          i18n: Json
          id: string
          is_active: boolean
          locale_default: string
          sort_order: number | null
          timezone: string
        }
        Insert: {
          code: string
          currency: string
          i18n?: Json
          id?: string
          is_active?: boolean
          locale_default?: string
          sort_order?: number | null
          timezone?: string
        }
        Update: {
          code?: string
          currency?: string
          i18n?: Json
          id?: string
          is_active?: boolean
          locale_default?: string
          sort_order?: number | null
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "countries_locale_default_fkey"
            columns: ["locale_default"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      faqs: {
        Row: {
          created_at: string
          i18n: Json
          id: string
          is_active: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          i18n?: Json
          id?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          i18n?: Json
          id?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      fiscal_id_type_countries: {
        Row: {
          country_id: string
          fiscal_id_type_id: string
        }
        Insert: {
          country_id: string
          fiscal_id_type_id: string
        }
        Update: {
          country_id?: string
          fiscal_id_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_id_type_countries_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_id_type_countries_fiscal_id_type_id_fkey"
            columns: ["fiscal_id_type_id"]
            isOneToOne: false
            referencedRelation: "fiscal_id_types"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_id_types: {
        Row: {
          code: string
          created_at: string
          i18n: Json
          id: string
          is_active: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          i18n?: Json
          id?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          i18n?: Json
          id?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      form_definition_cities: {
        Row: {
          city_id: string
          form_id: string
          is_active: boolean
        }
        Insert: {
          city_id: string
          form_id: string
          is_active?: boolean
        }
        Update: {
          city_id?: string
          form_id?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "form_definition_cities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_definition_cities_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "form_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      form_definition_countries: {
        Row: {
          country_id: string
          form_id: string
          is_active: boolean
        }
        Insert: {
          country_id: string
          form_id: string
          is_active?: boolean
        }
        Update: {
          country_id?: string
          form_id?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "form_definition_countries_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_definition_countries_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "form_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      form_definitions: {
        Row: {
          created_at: string
          form_key: string
          i18n: Json
          id: string
          is_active: boolean
          schema: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          form_key: string
          i18n?: Json
          id?: string
          is_active?: boolean
          schema?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          form_key?: string
          i18n?: Json
          id?: string
          is_active?: boolean
          schema?: Json
          updated_at?: string
        }
        Relationships: []
      }
      languages: {
        Row: {
          code: string
          is_active: boolean
          name: string
          sort_order: number | null
        }
        Insert: {
          code: string
          is_active?: boolean
          name: string
          sort_order?: number | null
        }
        Update: {
          code?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          created_at: string
          i18n: Json
          id: string
          slug: Database["public"]["Enums"]["legal_document_slug"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          i18n?: Json
          id?: string
          slug: Database["public"]["Enums"]["legal_document_slug"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          i18n?: Json
          id?: string
          slug?: Database["public"]["Enums"]["legal_document_slug"]
          updated_at?: string
        }
        Relationships: []
      }
      order_billing_lines: {
        Row: {
          client_payment_id: string | null
          created_at: string
          description: string
          discount_pct: number
          id: string
          order_id: string
          qty: number
          scope: string
          talent_id: string | null
          talent_payment_id: string | null
          total: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          client_payment_id?: string | null
          created_at?: string
          description: string
          discount_pct?: number
          id?: string
          order_id: string
          qty: number
          scope: string
          talent_id?: string | null
          talent_payment_id?: string | null
          total: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          client_payment_id?: string | null
          created_at?: string
          description?: string
          discount_pct?: number
          id?: string
          order_id?: string
          qty?: number
          scope?: string
          talent_id?: string | null
          talent_payment_id?: string | null
          total?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_billing_lines_client_payment_id_fkey"
            columns: ["client_payment_id"]
            isOneToOne: false
            referencedRelation: "client_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_billing_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_billing_lines_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_billing_lines_talent_payment_id_fkey"
            columns: ["talent_payment_id"]
            isOneToOne: false
            referencedRelation: "talent_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      order_hours_logs: {
        Row: {
          confirmed_at: string | null
          confirmed_by: string | null
          confirmed_qty: number | null
          created_at: string
          description: string | null
          id: string
          kind: string
          order_id: string
          reported_by: string | null
          reported_qty: number
          talent_id: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          confirmed_qty?: number | null
          created_at?: string
          description?: string | null
          id?: string
          kind: string
          order_id: string
          reported_by?: string | null
          reported_qty?: number
          talent_id?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          confirmed_qty?: number | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          order_id?: string
          reported_by?: string | null
          reported_qty?: number
          talent_id?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_hours_logs_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_hours_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_hours_logs_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_hours_logs_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          is_system: boolean
          order_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          is_system?: boolean
          order_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          is_system?: boolean
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_recurrence: {
        Row: {
          created_at: string
          end_date: string | null
          hours_per_session: number | null
          order_id: string
          repeat_every: number
          start_date: string | null
          time_window_end: string | null
          time_window_start: string | null
          updated_at: string
          weekdays: number[]
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          hours_per_session?: number | null
          order_id: string
          repeat_every?: number
          start_date?: string | null
          time_window_end?: string | null
          time_window_start?: string | null
          updated_at?: string
          weekdays?: number[]
        }
        Update: {
          created_at?: string
          end_date?: string | null
          hours_per_session?: number | null
          order_id?: string
          repeat_every?: number
          start_date?: string | null
          time_window_end?: string | null
          time_window_start?: string | null
          updated_at?: string
          weekdays?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "order_recurrence_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_schedules: {
        Row: {
          created_at: string
          day_of_month: number | null
          end_date: string | null
          generation_paused: boolean
          id: string
          next_session_date: string | null
          order_id: string
          start_date: string
          time_end: string | null
          time_start: string
          timezone: string
          updated_at: string | null
          weekdays: number[] | null
        }
        Insert: {
          created_at?: string
          day_of_month?: number | null
          end_date?: string | null
          generation_paused?: boolean
          id?: string
          next_session_date?: string | null
          order_id: string
          start_date: string
          time_end?: string | null
          time_start: string
          timezone: string
          updated_at?: string | null
          weekdays?: number[] | null
        }
        Update: {
          created_at?: string
          day_of_month?: number | null
          end_date?: string | null
          generation_paused?: boolean
          id?: string
          next_session_date?: string | null
          order_id?: string
          start_date?: string
          time_end?: string | null
          time_start?: string
          timezone?: string
          updated_at?: string | null
          weekdays?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "order_schedules_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_series: {
        Row: {
          closed_at: string | null
          closed_reason: string | null
          created_at: string
          day_of_month: number | null
          frequency: string
          hours_per_session: number | null
          id: string
          last_appointment_at: string | null
          occurrences_cancelled: number
          occurrences_completed: number
          repeat_every: number
          start_date: string
          status: string
          time_end: string | null
          time_start: string
          timezone: string
          total_occurrences: number
          updated_at: string
          weekdays: number[] | null
        }
        Insert: {
          closed_at?: string | null
          closed_reason?: string | null
          created_at?: string
          day_of_month?: number | null
          frequency: string
          hours_per_session?: number | null
          id?: string
          last_appointment_at?: string | null
          occurrences_cancelled?: number
          occurrences_completed?: number
          repeat_every?: number
          start_date: string
          status?: string
          time_end?: string | null
          time_start: string
          timezone: string
          total_occurrences: number
          updated_at?: string
          weekdays?: number[] | null
        }
        Update: {
          closed_at?: string | null
          closed_reason?: string | null
          created_at?: string
          day_of_month?: number | null
          frequency?: string
          hours_per_session?: number | null
          id?: string
          last_appointment_at?: string | null
          occurrences_cancelled?: number
          occurrences_completed?: number
          repeat_every?: number
          start_date?: string
          status?: string
          time_end?: string | null
          time_start?: string
          timezone?: string
          total_occurrences?: number
          updated_at?: string
          weekdays?: number[] | null
        }
        Relationships: []
      }
      order_sessions: {
        Row: {
          created_at: string | null
          id: string
          local_timezone: string
          notes: string | null
          order_id: string
          scheduled_end: string | null
          scheduled_start: string
          status: string
          talent_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          local_timezone: string
          notes?: string | null
          order_id: string
          scheduled_end?: string | null
          scheduled_start: string
          status?: string
          talent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          local_timezone?: string
          notes?: string | null
          order_id?: string
          scheduled_end?: string | null
          scheduled_start?: string
          status?: string
          talent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_sessions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_sessions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          from_status: string | null
          id: string
          notes: string | null
          order_id: string
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          from_status?: string | null
          id?: string
          notes?: string | null
          order_id: string
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          from_status?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_subtypes: {
        Row: {
          order_id: string
          question_key: string
          subtype_id: string
        }
        Insert: {
          order_id: string
          question_key: string
          subtype_id: string
        }
        Update: {
          order_id?: string
          question_key?: string
          subtype_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_subtypes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_subtypes_subtype_id_fkey"
            columns: ["subtype_id"]
            isOneToOne: false
            referencedRelation: "service_subtypes"
            referencedColumns: ["id"]
          },
        ]
      }
      order_tag_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          order_id: string
          tag_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          order_id: string
          tag_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          order_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_tag_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_tag_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "order_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      order_tags: {
        Row: {
          created_at: string
          i18n: Json
          id: string
          is_active: boolean
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          i18n?: Json
          id?: string
          is_active?: boolean
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          i18n?: Json
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      order_talents: {
        Row: {
          assigned_by: string | null
          created_at: string
          is_primary: boolean
          order_id: string
          talent_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          is_primary?: boolean
          order_id: string
          talent_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          is_primary?: boolean
          order_id?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_talents_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_talents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_talents_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          appointment_date: string | null
          billing_override: Json | null
          client_id: string
          contact_address: string | null
          contact_email: string
          contact_fiscal_id: string | null
          contact_fiscal_id_type_id: string | null
          contact_name: string
          contact_phone: string
          country_id: string
          created_at: string | null
          currency: string
          discount: number | null
          form_data: Json
          id: string
          legacy_data: Json | null
          legacy_id: string | null
          notes: string | null
          order_number: number
          payment_status: string | null
          preferred_language: string | null
          price_subtotal: number
          price_tax: number
          price_tax_rate: number
          price_total: number
          quantity: number | null
          rating: number | null
          schedule_type: string
          sequence_no: number | null
          series_id: string | null
          service_address: string | null
          service_city_id: string | null
          service_id: string | null
          service_postal_code: string | null
          service_state: string | null
          specialist_unit_price: number | null
          staff_member_id: string | null
          status: string
          stripe_id: string | null
          talent_amount: number | null
          talent_id: string | null
          talents_needed: number
          timezone: string
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          billing_override?: Json | null
          client_id: string
          contact_address?: string | null
          contact_email: string
          contact_fiscal_id?: string | null
          contact_fiscal_id_type_id?: string | null
          contact_name: string
          contact_phone: string
          country_id: string
          created_at?: string | null
          currency: string
          discount?: number | null
          form_data: Json
          id?: string
          legacy_data?: Json | null
          legacy_id?: string | null
          notes?: string | null
          order_number?: number
          payment_status?: string | null
          preferred_language?: string | null
          price_subtotal: number
          price_tax?: number
          price_tax_rate?: number
          price_total: number
          quantity?: number | null
          rating?: number | null
          schedule_type?: string
          sequence_no?: number | null
          series_id?: string | null
          service_address?: string | null
          service_city_id?: string | null
          service_id?: string | null
          service_postal_code?: string | null
          service_state?: string | null
          specialist_unit_price?: number | null
          staff_member_id?: string | null
          status?: string
          stripe_id?: string | null
          talent_amount?: number | null
          talent_id?: string | null
          talents_needed?: number
          timezone?: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          billing_override?: Json | null
          client_id?: string
          contact_address?: string | null
          contact_email?: string
          contact_fiscal_id?: string | null
          contact_fiscal_id_type_id?: string | null
          contact_name?: string
          contact_phone?: string
          country_id?: string
          created_at?: string | null
          currency?: string
          discount?: number | null
          form_data?: Json
          id?: string
          legacy_data?: Json | null
          legacy_id?: string | null
          notes?: string | null
          order_number?: number
          payment_status?: string | null
          preferred_language?: string | null
          price_subtotal?: number
          price_tax?: number
          price_tax_rate?: number
          price_total?: number
          quantity?: number | null
          rating?: number | null
          schedule_type?: string
          sequence_no?: number | null
          series_id?: string | null
          service_address?: string | null
          service_city_id?: string | null
          service_id?: string | null
          service_postal_code?: string | null
          service_state?: string | null
          specialist_unit_price?: number | null
          staff_member_id?: string | null
          status?: string
          stripe_id?: string | null
          talent_amount?: number | null
          talent_id?: string | null
          talents_needed?: number
          timezone?: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_contact_fiscal_id_type_id_fkey"
            columns: ["contact_fiscal_id_type_id"]
            isOneToOne: false
            referencedRelation: "fiscal_id_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "order_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_service_city_id_fkey"
            columns: ["service_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_role: string
          address: Json | null
          avatar_url: string | null
          birth_date: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          id: string
          phone: string | null
          preferred_city: string | null
          preferred_contact: string | null
          preferred_country: string | null
          preferred_locale: string | null
          updated_at: string | null
        }
        Insert: {
          active_role?: string
          address?: Json | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          phone?: string | null
          preferred_city?: string | null
          preferred_contact?: string | null
          preferred_country?: string | null
          preferred_locale?: string | null
          updated_at?: string | null
        }
        Update: {
          active_role?: string
          address?: Json | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          phone?: string | null
          preferred_city?: string | null
          preferred_contact?: string | null
          preferred_country?: string | null
          preferred_locale?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_preferred_city_fkey"
            columns: ["preferred_city"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_preferred_country_fkey"
            columns: ["preferred_country"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_preferred_locale_fkey"
            columns: ["preferred_locale"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      reviews: {
        Row: {
          author_name: string
          author_photo: string | null
          created_at: string
          i18n: Json
          id: string
          is_active: boolean
          sort_order: number
          stars: number
          updated_at: string
        }
        Insert: {
          author_name: string
          author_photo?: string | null
          created_at?: string
          i18n?: Json
          id?: string
          is_active?: boolean
          sort_order?: number
          stars: number
          updated_at?: string
        }
        Update: {
          author_name?: string
          author_photo?: string | null
          created_at?: string
          i18n?: Json
          id?: string
          is_active?: boolean
          sort_order?: number
          stars?: number
          updated_at?: string
        }
        Relationships: []
      }
      service_cities: {
        Row: {
          base_price: number
          city_id: string
          created_at: string | null
          is_active: boolean
          service_id: string
          updated_at: string | null
        }
        Insert: {
          base_price: number
          city_id: string
          created_at?: string | null
          is_active?: boolean
          service_id: string
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          city_id?: string
          created_at?: string | null
          is_active?: boolean
          service_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_cities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_cities_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_countries: {
        Row: {
          base_price: number
          country_id: string
          is_active: boolean
          service_id: string
        }
        Insert: {
          base_price: number
          country_id: string
          is_active?: boolean
          service_id: string
        }
        Update: {
          base_price?: number
          country_id?: string
          is_active?: boolean
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_countries_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_countries_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_subtype_group_assignments: {
        Row: {
          created_at: string | null
          group_id: string
          service_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          group_id: string
          service_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string | null
          group_id?: string
          service_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_subtype_group_assignments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "service_subtype_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_subtype_group_assignments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_subtype_groups: {
        Row: {
          created_at: string | null
          i18n: Json
          id: string
          is_active: boolean
          slug: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          i18n?: Json
          id?: string
          is_active?: boolean
          slug: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          i18n?: Json
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      service_subtypes: {
        Row: {
          created_at: string | null
          group_id: string
          i18n: Json
          id: string
          is_active: boolean
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          group_id: string
          i18n?: Json
          id?: string
          is_active?: boolean
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string
          i18n?: Json
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_subtypes_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "service_subtype_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          allows_recurrence: boolean
          category: Database["public"]["Enums"]["service_category"] | null
          cover_image_url: string | null
          created_at: string | null
          i18n: Json
          id: string
          questions: Json
          slug: string
          status: string
          talent_questions: Json
          updated_at: string | null
        }
        Insert: {
          allows_recurrence?: boolean
          category?: Database["public"]["Enums"]["service_category"] | null
          cover_image_url?: string | null
          created_at?: string | null
          i18n?: Json
          id?: string
          questions?: Json
          slug: string
          status?: string
          talent_questions?: Json
          updated_at?: string | null
        }
        Update: {
          allows_recurrence?: boolean
          category?: Database["public"]["Enums"]["service_category"] | null
          cover_image_url?: string | null
          created_at?: string | null
          i18n?: Json
          id?: string
          questions?: Json
          slug?: string
          status?: string
          talent_questions?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      spoken_language_aliases: {
        Row: {
          alias_normalized: string
          language_code: string
          original_text: string
        }
        Insert: {
          alias_normalized: string
          language_code: string
          original_text: string
        }
        Update: {
          alias_normalized?: string
          language_code?: string
          original_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "spoken_language_aliases_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "spoken_languages"
            referencedColumns: ["code"]
          },
        ]
      }
      spoken_languages: {
        Row: {
          code: string
          created_at: string
          i18n: Json
          is_active: boolean
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          i18n?: Json
          is_active?: boolean
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          i18n?: Json
          is_active?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      staff_profiles: {
        Row: {
          created_at: string | null
          first_name: string
          id: string
          last_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          first_name: string
          id?: string
          last_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          first_name?: string
          id?: string
          last_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_role_scopes: {
        Row: {
          city_id: string | null
          country_id: string | null
          created_at: string | null
          permissions: string[]
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          city_id?: string | null
          country_id?: string | null
          created_at?: string | null
          permissions?: string[]
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          city_id?: string | null
          country_id?: string | null
          created_at?: string | null
          permissions?: string[]
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_role_scopes_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_role_scopes_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_role_scopes_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "staff_roles"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "staff_role_scopes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_role_scopes_user_id_role_fkey"
            columns: ["user_id", "role"]
            isOneToOne: true
            referencedRelation: "user_roles"
            referencedColumns: ["user_id", "role"]
          },
        ]
      }
      staff_roles: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          is_active: boolean
          key: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          is_active?: boolean
          key: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          is_active?: boolean
          key?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      survey_questions: {
        Row: {
          created_at: string | null
          i18n: Json
          id: string
          is_active: boolean
          key: string
          options: Json | null
          response_type: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          i18n?: Json
          id?: string
          is_active?: boolean
          key: string
          options?: Json | null
          response_type: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          i18n?: Json
          id?: string
          is_active?: boolean
          key?: string
          options?: Json | null
          response_type?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      survey_responses: {
        Row: {
          created_at: string | null
          id: string
          key: string
          user_id: string
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          user_id: string
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          user_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_analytics: {
        Row: {
          created_at: string | null
          id: string
          key: string
          talent_id: string
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          talent_id: string
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          talent_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_analytics_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_documents: {
        Row: {
          created_at: string | null
          document_type: string
          file_path: string
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          talent_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_type: string
          file_path: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          talent_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string
          file_path?: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          talent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_documents_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          is_system: boolean
          pinned: boolean
          talent_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          is_system?: boolean
          pinned?: boolean
          talent_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          is_system?: boolean
          pinned?: boolean
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_notes_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_payment_items: {
        Row: {
          created_at: string
          hours: number | null
          id: string
          notes: string | null
          order_id: string
          payment_id: string
          total: number
          unit_amount: number | null
        }
        Insert: {
          created_at?: string
          hours?: number | null
          id?: string
          notes?: string | null
          order_id: string
          payment_id: string
          total: number
          unit_amount?: number | null
        }
        Update: {
          created_at?: string
          hours?: number | null
          id?: string
          notes?: string | null
          order_id?: string
          payment_id?: string
          total?: number
          unit_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_payment_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_payment_items_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "talent_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_payments: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_proof_url: string | null
          period_month: string
          status: string
          talent_id: string
          total_amount: number
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          period_month: string
          status?: string
          talent_id: string
          total_amount?: number
          total_hours?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          period_month?: string
          status?: string
          talent_id?: string
          total_amount?: number
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_payments_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_profiles: {
        Row: {
          additional_info: string | null
          approved_at: string | null
          approved_by: string | null
          city_id: string | null
          country_id: string | null
          created_at: string | null
          created_by: string | null
          fiscal_id: string | null
          fiscal_id_type_id: string | null
          has_car: boolean | null
          has_social_security: boolean | null
          id: string
          internal_notes: string | null
          legacy_id: number | null
          marketing_consent: boolean
          onboarding_completed_at: string | null
          photo_url: string | null
          preferred_payment: string | null
          previous_experience: string | null
          professional_status: string | null
          status: string
          terms_accepted: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          additional_info?: string | null
          approved_at?: string | null
          approved_by?: string | null
          city_id?: string | null
          country_id?: string | null
          created_at?: string | null
          created_by?: string | null
          fiscal_id?: string | null
          fiscal_id_type_id?: string | null
          has_car?: boolean | null
          has_social_security?: boolean | null
          id?: string
          internal_notes?: string | null
          legacy_id?: number | null
          marketing_consent?: boolean
          onboarding_completed_at?: string | null
          photo_url?: string | null
          preferred_payment?: string | null
          previous_experience?: string | null
          professional_status?: string | null
          status?: string
          terms_accepted?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          additional_info?: string | null
          approved_at?: string | null
          approved_by?: string | null
          city_id?: string | null
          country_id?: string | null
          created_at?: string | null
          created_by?: string | null
          fiscal_id?: string | null
          fiscal_id_type_id?: string | null
          has_car?: boolean | null
          has_social_security?: boolean | null
          id?: string
          internal_notes?: string | null
          legacy_id?: number | null
          marketing_consent?: boolean
          onboarding_completed_at?: string | null
          photo_url?: string | null
          preferred_payment?: string | null
          previous_experience?: string | null
          professional_status?: string | null
          status?: string
          terms_accepted?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_profiles_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_profiles_fiscal_id_type_id_fkey"
            columns: ["fiscal_id_type_id"]
            isOneToOne: false
            referencedRelation: "fiscal_id_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_service_subtypes: {
        Row: {
          created_at: string | null
          question_key: string
          subtype_id: string
          talent_id: string
        }
        Insert: {
          created_at?: string | null
          question_key: string
          subtype_id: string
          talent_id: string
        }
        Update: {
          created_at?: string | null
          question_key?: string
          subtype_id?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_service_subtypes_subtype_id_fkey"
            columns: ["subtype_id"]
            isOneToOne: false
            referencedRelation: "service_subtypes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_service_subtypes_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_services: {
        Row: {
          country_id: string
          created_at: string | null
          form_data: Json | null
          is_verified: boolean
          service_id: string
          specializations: Json | null
          talent_id: string
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          country_id: string
          created_at?: string | null
          form_data?: Json | null
          is_verified?: boolean
          service_id: string
          specializations?: Json | null
          talent_id: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          country_id?: string
          created_at?: string | null
          form_data?: Json | null
          is_verified?: boolean
          service_id?: string
          specializations?: Json | null
          talent_id?: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_services_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_services_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_spoken_languages: {
        Row: {
          created_at: string
          language_code: string
          talent_id: string
        }
        Insert: {
          created_at?: string
          language_code: string
          talent_id: string
        }
        Update: {
          created_at?: string
          language_code?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_spoken_languages_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "spoken_languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "talent_spoken_languages_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_tag_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          tag_id: string
          talent_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          tag_id: string
          talent_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          tag_id?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_tag_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "talent_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_tag_assignments_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_tags: {
        Row: {
          created_at: string
          i18n: Json
          id: string
          is_active: boolean
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          i18n?: Json
          id?: string
          is_active?: boolean
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          i18n?: Json
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          added_by: string | null
          created_at: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          granted_by: string | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted_by?: string | null
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted_by?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _materialize_next_occurrence: {
        Args: { p_source_id: string }
        Returns: string
      }
      cancel_order_and_decide: {
        Args: {
          p_actor_id: string
          p_order_id: string
          p_reason: string
          p_scope: string
        }
        Returns: Json
      }
      complete_order_and_advance: {
        Args: { p_actor_id: string; p_order_id: string }
        Returns: Json
      }
      compute_next_slot: {
        Args: {
          p_day_of_month: number
          p_frequency: string
          p_prev: string
          p_repeat_every: number
          p_time: string
          p_tz: string
          p_weekdays: number[]
        }
        Returns: string
      }
      create_order_with_series: {
        Args: {
          p_billing_override: Json
          p_client_id: string
          p_contact_email: string
          p_contact_fiscal_id: string
          p_contact_fiscal_id_type_id: string
          p_contact_name: string
          p_contact_phone: string
          p_country_id: string
          p_day_of_month: number
          p_form_data: Json
          p_frequency: string
          p_hours_per_session: number
          p_notes: string
          p_repeat_every: number
          p_service_address: string
          p_service_city_id: string
          p_service_id: string
          p_service_postal_code: string
          p_start_date: string
          p_subtypes: Json
          p_time_end: string
          p_time_start: string
          p_timezone: string
          p_total_occurrences: number
          p_weekdays: number[]
        }
        Returns: Json
      }
      delete_client: {
        Args: { p_client_id: string }
        Returns: {
          client_id: string
          user_id: string
        }[]
      }
      delete_service: { Args: { p_service_id: string }; Returns: undefined }
      is_email_registered: { Args: { p_email: string }; Returns: boolean }
      register_talent_profile: {
        Args: {
          p_additional_info: string
          p_address: Json
          p_city_id: string
          p_country_id: string
          p_fiscal_id: string
          p_fiscal_id_type_id: string
          p_marketing_consent: boolean
          p_phone: string
          p_preferred_locale: string
          p_service_ids: string[]
          p_terms_accepted: boolean
          p_user_id: string
        }
        Returns: Json
      }
      save_service_config:
        | {
            Args: {
              p_allows_recurrence?: boolean
              p_cities?: Json
              p_countries?: Json
              p_service_id: string
              p_status?: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_allows_recurrence?: boolean
              p_category?: Database["public"]["Enums"]["service_category"]
              p_cities?: Json
              p_countries?: Json
              p_service_id: string
              p_status?: string
            }
            Returns: undefined
          }
      set_order_status: {
        Args: {
          p_actor_id: string
          p_new_status: string
          p_notes: string
          p_order_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      legal_document_slug: "terms" | "privacy" | "terms_of_use" | "transparency"
      service_category: "accompaniment" | "classes" | "repairs" | "home"
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
      legal_document_slug: ["terms", "privacy", "terms_of_use", "transparency"],
      service_category: ["accompaniment", "classes", "repairs", "home"],
    },
  },
} as const
