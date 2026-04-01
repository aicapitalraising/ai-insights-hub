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
      ad_iterations: {
        Row: {
          asset_id: string | null
          created_at: string | null
          id: string
          iteration_type: string | null
          prompt: string | null
          scraped_ad_id: string | null
          status: string | null
        }
        Insert: {
          asset_id?: string | null
          created_at?: string | null
          id?: string
          iteration_type?: string | null
          prompt?: string | null
          scraped_ad_id?: string | null
          status?: string | null
        }
        Update: {
          asset_id?: string | null
          created_at?: string | null
          id?: string
          iteration_type?: string | null
          prompt?: string | null
          scraped_ad_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      ad_styles: {
        Row: {
          client_id: string | null
          created_at: string
          description: string
          display_order: number
          example_image_url: string | null
          id: string
          is_default: boolean
          name: string
          prompt_template: string
          reference_images: string[] | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description?: string
          display_order?: number
          example_image_url?: string | null
          id?: string
          is_default?: boolean
          name: string
          prompt_template?: string
          reference_images?: string[] | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string
          display_order?: number
          example_image_url?: string | null
          id?: string
          is_default?: boolean
          name?: string
          prompt_template?: string
          reference_images?: string[] | null
        }
        Relationships: []
      }
      ad_templates: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          preview_image: string | null
          template_data: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          preview_image?: string | null
          template_data?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          preview_image?: string | null
          template_data?: Json | null
        }
        Relationships: []
      }
      agency_meetings: {
        Row: {
          action_items: Json | null
          attendees: Json | null
          client_id: string | null
          created_at: string | null
          id: string
          meeting_date: string | null
          notes: string | null
          recording_url: string | null
          status: string | null
          title: string | null
          transcript: string | null
          updated_at: string | null
        }
        Insert: {
          action_items?: Json | null
          attendees?: Json | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          meeting_date?: string | null
          notes?: string | null
          recording_url?: string | null
          status?: string | null
          title?: string | null
          transcript?: string | null
          updated_at?: string | null
        }
        Update: {
          action_items?: Json | null
          attendees?: Json | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          meeting_date?: string | null
          notes?: string | null
          recording_url?: string | null
          status?: string | null
          title?: string | null
          transcript?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      agency_settings: {
        Row: {
          agency_name: string | null
          created_at: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          agency_name?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          agency_name?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      alert_configs: {
        Row: {
          client_id: string
          created_at: string
          enabled: boolean | null
          id: string
          metric: string
          operator: string
          slack_webhook_url: string | null
          threshold: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          enabled?: boolean | null
          id?: string
          metric: string
          operator: string
          slack_webhook_url?: string | null
          threshold: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          enabled?: boolean | null
          id?: string
          metric?: string
          operator?: string
          slack_webhook_url?: string | null
          threshold?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_configs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          name: string | null
          project_id: string | null
          public_url: string | null
          status: string
          storage_path: string | null
          type: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          name?: string | null
          project_id?: string | null
          public_url?: string | null
          status?: string
          storage_path?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          name?: string | null
          project_id?: string | null
          public_url?: string | null
          status?: string
          storage_path?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      avatar_looks: {
        Row: {
          angle: string | null
          avatar_id: string
          background: string | null
          created_at: string
          id: string
          image_url: string
          is_primary: boolean
          metadata: Json | null
          outfit: string | null
        }
        Insert: {
          angle?: string | null
          avatar_id: string
          background?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean
          metadata?: Json | null
          outfit?: string | null
        }
        Update: {
          angle?: string | null
          avatar_id?: string
          background?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean
          metadata?: Json | null
          outfit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avatar_looks_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "avatars"
            referencedColumns: ["id"]
          },
        ]
      }
      avatars: {
        Row: {
          age_range: string | null
          client_id: string | null
          created_at: string
          description: string | null
          elevenlabs_voice_id: string | null
          ethnicity: string | null
          gender: string | null
          id: string
          image_url: string
          is_stock: boolean
          looks_count: number
          name: string
          style: string | null
        }
        Insert: {
          age_range?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          elevenlabs_voice_id?: string | null
          ethnicity?: string | null
          gender?: string | null
          id?: string
          image_url: string
          is_stock?: boolean
          looks_count?: number
          name: string
          style?: string | null
        }
        Update: {
          age_range?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          elevenlabs_voice_id?: string | null
          ethnicity?: string | null
          gender?: string | null
          id?: string
          image_url?: string
          is_stock?: boolean
          looks_count?: number
          name?: string
          style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avatars_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          appointment_status: string | null
          booked_at: string | null
          client_id: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          direction: string | null
          external_id: string
          ghl_appointment_id: string | null
          ghl_calendar_id: string | null
          ghl_synced_at: string | null
          id: string
          is_reconnect: boolean | null
          lead_id: string | null
          outcome: string | null
          quality_score: number | null
          recording_url: string | null
          scheduled_at: string | null
          showed: boolean | null
          showed_at: string | null
          summary: string | null
          transcript: string | null
          updated_at: string
        }
        Insert: {
          appointment_status?: string | null
          booked_at?: string | null
          client_id: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          direction?: string | null
          external_id: string
          ghl_appointment_id?: string | null
          ghl_calendar_id?: string | null
          ghl_synced_at?: string | null
          id?: string
          is_reconnect?: boolean | null
          lead_id?: string | null
          outcome?: string | null
          quality_score?: number | null
          recording_url?: string | null
          scheduled_at?: string | null
          showed?: boolean | null
          showed_at?: string | null
          summary?: string | null
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          appointment_status?: string | null
          booked_at?: string | null
          client_id?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          direction?: string | null
          external_id?: string
          ghl_appointment_id?: string | null
          ghl_calendar_id?: string | null
          ghl_synced_at?: string | null
          id?: string
          is_reconnect?: boolean | null
          lead_id?: string | null
          outcome?: string | null
          quality_score?: number | null
          recording_url?: string | null
          scheduled_at?: string | null
          showed?: boolean | null
          showed_at?: string | null
          summary?: string | null
          transcript?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calls_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      client_assets: {
        Row: {
          asset_type: string
          client_id: string
          content: Json | null
          created_at: string | null
          id: string
          offer_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          asset_type: string
          client_id: string
          content?: Json | null
          created_at?: string | null
          id?: string
          offer_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          asset_type?: string
          client_id?: string
          content?: Json | null
          created_at?: string | null
          id?: string
          offer_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_assets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assets_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "client_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      client_assignments: {
        Row: {
          account_manager: string | null
          client_id: string
          created_at: string
          media_buyer: string | null
          updated_at: string
        }
        Insert: {
          account_manager?: string | null
          client_id: string
          created_at?: string
          media_buyer?: string | null
          updated_at?: string
        }
        Update: {
          account_manager?: string | null
          client_id?: string
          created_at?: string
          media_buyer?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      client_custom_tabs: {
        Row: {
          client_id: string
          created_at: string
          icon: string | null
          id: string
          name: string
          sort_order: number | null
          url: string
        }
        Insert: {
          client_id: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
          url: string
        }
        Update: {
          client_id?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_custom_tabs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_intake: {
        Row: {
          additional_notes: string | null
          brand_notes: string | null
          budget_amount: string | null
          budget_mode: string | null
          client_id: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          fund_type: string | null
          id: string
          investor_list_path: string | null
          kickoff_date: string | null
          kickoff_time: string | null
          min_investment: string | null
          pitch_deck_link: string | null
          pitch_deck_path: string | null
          raise_amount: string | null
          status: string | null
          target_investor: string | null
          timeline: string | null
          updated_at: string | null
        }
        Insert: {
          additional_notes?: string | null
          brand_notes?: string | null
          budget_amount?: string | null
          budget_mode?: string | null
          client_id: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          fund_type?: string | null
          id?: string
          investor_list_path?: string | null
          kickoff_date?: string | null
          kickoff_time?: string | null
          min_investment?: string | null
          pitch_deck_link?: string | null
          pitch_deck_path?: string | null
          raise_amount?: string | null
          status?: string | null
          target_investor?: string | null
          timeline?: string | null
          updated_at?: string | null
        }
        Update: {
          additional_notes?: string | null
          brand_notes?: string | null
          budget_amount?: string | null
          budget_mode?: string | null
          client_id?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          fund_type?: string | null
          id?: string
          investor_list_path?: string | null
          kickoff_date?: string | null
          kickoff_time?: string | null
          min_investment?: string | null
          pitch_deck_link?: string | null
          pitch_deck_path?: string | null
          raise_amount?: string | null
          status?: string | null
          target_investor?: string | null
          timeline?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_intake_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_offers: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          file_name: string | null
          file_size_bytes: number | null
          file_type: string | null
          file_url: string | null
          id: string
          offer_type: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          offer_type?: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          offer_type?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_offers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_onboarding_tasks: {
        Row: {
          category: string
          client_id: string
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          client_id: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          client_id?: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      client_properties: {
        Row: {
          address: string | null
          campaign_name: string | null
          client_id: string
          created_at: string | null
          daily_budget: number | null
          elise_connected: boolean | null
          id: string
          meta_access_token: string | null
          meta_ad_account_id: string | null
          name: string
          notes: string | null
          promo_url: string | null
          sort_order: number | null
          status: string | null
          units_count: number | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          campaign_name?: string | null
          client_id: string
          created_at?: string | null
          daily_budget?: number | null
          elise_connected?: boolean | null
          id?: string
          meta_access_token?: string | null
          meta_ad_account_id?: string | null
          name: string
          notes?: string | null
          promo_url?: string | null
          sort_order?: number | null
          status?: string | null
          units_count?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          campaign_name?: string | null
          client_id?: string
          created_at?: string | null
          daily_budget?: number | null
          elise_connected?: boolean | null
          id?: string
          meta_access_token?: string | null
          meta_ad_account_id?: string | null
          name?: string
          notes?: string | null
          promo_url?: string | null
          sort_order?: number | null
          status?: string | null
          units_count?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      client_settings: {
        Row: {
          ad_spend_fee_percent: number | null
          ad_spend_fee_threshold: number | null
          ads_library_url: string | null
          client_id: string
          committed_stage_ids: Json | null
          cost_of_capital_threshold_red: number | null
          cost_of_capital_threshold_yellow: number | null
          cost_per_call_threshold_red: number | null
          cost_per_call_threshold_yellow: number | null
          cost_per_investor_threshold_red: number | null
          cost_per_investor_threshold_yellow: number | null
          cost_per_show_threshold_red: number | null
          cost_per_show_threshold_yellow: number | null
          cpl_threshold_red: number | null
          cpl_threshold_yellow: number | null
          created_at: string
          daily_ad_spend_target: number | null
          default_lead_pipeline_value: number | null
          funded_investor_label: string | null
          funded_pipeline_id: string | null
          funded_stage_ids: Json | null
          ghl_payment_sync_enabled: boolean | null
          hubspot_committed_stage_ids: Json | null
          hubspot_funded_pipeline_id: string | null
          hubspot_funded_stage_ids: Json | null
          hubspot_sync_enabled: boolean | null
          id: string
          meetgeek_api_key: string | null
          meetgeek_enabled: boolean | null
          meetgeek_last_sync: string | null
          meetgeek_region: string | null
          meetgeek_webhook_secret: string | null
          meta_ads_sync_error: string | null
          metric_labels: Json | null
          monthly_ad_spend_target: number | null
          mrr: number | null
          public_link_password: string | null
          reconnect_calendar_ids: Json | null
          sales_stage_ids: Json | null
          slack_channel_id: string | null
          slack_review_channel_id: string | null
          slack_webhook_url: string | null
          total_raise_amount: number | null
          tracked_calendar_ids: Json | null
          updated_at: string
          webhook_mappings: Json | null
        }
        Insert: {
          ad_spend_fee_percent?: number | null
          ad_spend_fee_threshold?: number | null
          ads_library_url?: string | null
          client_id: string
          committed_stage_ids?: Json | null
          cost_of_capital_threshold_red?: number | null
          cost_of_capital_threshold_yellow?: number | null
          cost_per_call_threshold_red?: number | null
          cost_per_call_threshold_yellow?: number | null
          cost_per_investor_threshold_red?: number | null
          cost_per_investor_threshold_yellow?: number | null
          cost_per_show_threshold_red?: number | null
          cost_per_show_threshold_yellow?: number | null
          cpl_threshold_red?: number | null
          cpl_threshold_yellow?: number | null
          created_at?: string
          daily_ad_spend_target?: number | null
          default_lead_pipeline_value?: number | null
          funded_investor_label?: string | null
          funded_pipeline_id?: string | null
          funded_stage_ids?: Json | null
          ghl_payment_sync_enabled?: boolean | null
          hubspot_committed_stage_ids?: Json | null
          hubspot_funded_pipeline_id?: string | null
          hubspot_funded_stage_ids?: Json | null
          hubspot_sync_enabled?: boolean | null
          id?: string
          meetgeek_api_key?: string | null
          meetgeek_enabled?: boolean | null
          meetgeek_last_sync?: string | null
          meetgeek_region?: string | null
          meetgeek_webhook_secret?: string | null
          meta_ads_sync_error?: string | null
          metric_labels?: Json | null
          monthly_ad_spend_target?: number | null
          mrr?: number | null
          public_link_password?: string | null
          reconnect_calendar_ids?: Json | null
          sales_stage_ids?: Json | null
          slack_channel_id?: string | null
          slack_review_channel_id?: string | null
          slack_webhook_url?: string | null
          total_raise_amount?: number | null
          tracked_calendar_ids?: Json | null
          updated_at?: string
          webhook_mappings?: Json | null
        }
        Update: {
          ad_spend_fee_percent?: number | null
          ad_spend_fee_threshold?: number | null
          ads_library_url?: string | null
          client_id?: string
          committed_stage_ids?: Json | null
          cost_of_capital_threshold_red?: number | null
          cost_of_capital_threshold_yellow?: number | null
          cost_per_call_threshold_red?: number | null
          cost_per_call_threshold_yellow?: number | null
          cost_per_investor_threshold_red?: number | null
          cost_per_investor_threshold_yellow?: number | null
          cost_per_show_threshold_red?: number | null
          cost_per_show_threshold_yellow?: number | null
          cpl_threshold_red?: number | null
          cpl_threshold_yellow?: number | null
          created_at?: string
          daily_ad_spend_target?: number | null
          default_lead_pipeline_value?: number | null
          funded_investor_label?: string | null
          funded_pipeline_id?: string | null
          funded_stage_ids?: Json | null
          ghl_payment_sync_enabled?: boolean | null
          hubspot_committed_stage_ids?: Json | null
          hubspot_funded_pipeline_id?: string | null
          hubspot_funded_stage_ids?: Json | null
          hubspot_sync_enabled?: boolean | null
          id?: string
          meetgeek_api_key?: string | null
          meetgeek_enabled?: boolean | null
          meetgeek_last_sync?: string | null
          meetgeek_region?: string | null
          meetgeek_webhook_secret?: string | null
          meta_ads_sync_error?: string | null
          metric_labels?: Json | null
          monthly_ad_spend_target?: number | null
          mrr?: number | null
          public_link_password?: string | null
          reconnect_calendar_ids?: Json | null
          sales_stage_ids?: Json | null
          slack_channel_id?: string | null
          slack_review_channel_id?: string | null
          slack_webhook_url?: string | null
          total_raise_amount?: number | null
          tracked_calendar_ids?: Json | null
          updated_at?: string
          webhook_mappings?: Json | null
        }
        Relationships: []
      }
      client_voice_notes: {
        Row: {
          audio_url: string
          client_id: string
          created_at: string
          created_by: string | null
          duration_seconds: number | null
          id: string
          transcript: string | null
        }
        Insert: {
          audio_url: string
          client_id: string
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          id?: string
          transcript?: string | null
        }
        Update: {
          audio_url?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          id?: string
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_voice_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          account_manager: string | null
          brand_colors: string[] | null
          brand_fonts: string[] | null
          business_manager_url: string | null
          client_type: string | null
          created_at: string
          description: string | null
          ghl_api_key: string | null
          ghl_location_id: string | null
          ghl_sync_error: string | null
          ghl_sync_status: string | null
          hubspot_access_token: string | null
          hubspot_portal_id: string | null
          hubspot_sync_error: string | null
          hubspot_sync_status: string | null
          id: string
          industry: string | null
          last_ghl_sync_at: string | null
          last_hubspot_sync_at: string | null
          logo_url: string | null
          media_buyer: string | null
          meta_access_token: string | null
          meta_ad_account_id: string | null
          name: string
          offer_description: string | null
          product_url: string | null
          public_token: string | null
          slug: string | null
          sort_order: number | null
          status: string
          updated_at: string
          webhook_secret: string | null
          website_url: string | null
        }
        Insert: {
          account_manager?: string | null
          brand_colors?: string[] | null
          brand_fonts?: string[] | null
          business_manager_url?: string | null
          client_type?: string | null
          created_at?: string
          description?: string | null
          ghl_api_key?: string | null
          ghl_location_id?: string | null
          ghl_sync_error?: string | null
          ghl_sync_status?: string | null
          hubspot_access_token?: string | null
          hubspot_portal_id?: string | null
          hubspot_sync_error?: string | null
          hubspot_sync_status?: string | null
          id?: string
          industry?: string | null
          last_ghl_sync_at?: string | null
          last_hubspot_sync_at?: string | null
          logo_url?: string | null
          media_buyer?: string | null
          meta_access_token?: string | null
          meta_ad_account_id?: string | null
          name: string
          offer_description?: string | null
          product_url?: string | null
          public_token?: string | null
          slug?: string | null
          sort_order?: number | null
          status?: string
          updated_at?: string
          webhook_secret?: string | null
          website_url?: string | null
        }
        Update: {
          account_manager?: string | null
          brand_colors?: string[] | null
          brand_fonts?: string[] | null
          business_manager_url?: string | null
          client_type?: string | null
          created_at?: string
          description?: string | null
          ghl_api_key?: string | null
          ghl_location_id?: string | null
          ghl_sync_error?: string | null
          ghl_sync_status?: string | null
          hubspot_access_token?: string | null
          hubspot_portal_id?: string | null
          hubspot_sync_error?: string | null
          hubspot_sync_status?: string | null
          id?: string
          industry?: string | null
          last_ghl_sync_at?: string | null
          last_hubspot_sync_at?: string | null
          logo_url?: string | null
          media_buyer?: string | null
          meta_access_token?: string | null
          meta_ad_account_id?: string | null
          name?: string
          offer_description?: string | null
          product_url?: string | null
          public_token?: string | null
          slug?: string | null
          sort_order?: number | null
          status?: string
          updated_at?: string
          webhook_secret?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      creatives: {
        Row: {
          ai_performance_score: number | null
          aspect_ratio: string | null
          body_copy: string | null
          client_id: string
          comments: Json | null
          created_at: string
          cta_text: string | null
          file_url: string | null
          headline: string | null
          id: string
          platform: string | null
          source: string | null
          status: string
          title: string
          trigger_campaign_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          ai_performance_score?: number | null
          aspect_ratio?: string | null
          body_copy?: string | null
          client_id: string
          comments?: Json | null
          created_at?: string
          cta_text?: string | null
          file_url?: string | null
          headline?: string | null
          id?: string
          platform?: string | null
          source?: string | null
          status?: string
          title: string
          trigger_campaign_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          ai_performance_score?: number | null
          aspect_ratio?: string | null
          body_copy?: string | null
          client_id?: string
          comments?: Json | null
          created_at?: string
          cta_text?: string | null
          file_url?: string | null
          headline?: string | null
          id?: string
          platform?: string | null
          source?: string | null
          status?: string
          title?: string
          trigger_campaign_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creatives_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      csv_import_logs: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string
          error_rows: number
          errors: Json | null
          file_name: string
          id: string
          import_type: string
          imported_rows: number
          skipped_rows: number
          status: string
          total_rows: number
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string
          error_rows?: number
          errors?: Json | null
          file_name: string
          id?: string
          import_type: string
          imported_rows?: number
          skipped_rows?: number
          status?: string
          total_rows?: number
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string
          error_rows?: number
          errors?: Json | null
          file_name?: string
          id?: string
          import_type?: string
          imported_rows?: number
          skipped_rows?: number
          status?: string
          total_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "csv_import_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_ads: {
        Row: {
          category: string | null
          client_id: string | null
          created_at: string | null
          file_type: string | null
          file_url: string | null
          id: string
          name: string | null
        }
        Insert: {
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          name?: string | null
        }
        Update: {
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      daily_metrics: {
        Row: {
          ad_spend: number | null
          calls: number | null
          clicks: number | null
          client_id: string
          commitment_dollars: number | null
          commitments: number | null
          created_at: string
          ctr: number | null
          date: string
          funded_dollars: number | null
          funded_investors: number | null
          id: string
          impressions: number | null
          leads: number | null
          reconnect_calls: number | null
          reconnect_showed: number | null
          showed_calls: number | null
          spam_leads: number | null
          updated_at: string
        }
        Insert: {
          ad_spend?: number | null
          calls?: number | null
          clicks?: number | null
          client_id: string
          commitment_dollars?: number | null
          commitments?: number | null
          created_at?: string
          ctr?: number | null
          date: string
          funded_dollars?: number | null
          funded_investors?: number | null
          id?: string
          impressions?: number | null
          leads?: number | null
          reconnect_calls?: number | null
          reconnect_showed?: number | null
          showed_calls?: number | null
          spam_leads?: number | null
          updated_at?: string
        }
        Update: {
          ad_spend?: number | null
          calls?: number | null
          clicks?: number | null
          client_id?: string
          commitment_dollars?: number | null
          commitments?: number | null
          created_at?: string
          ctr?: number | null
          date?: string
          funded_dollars?: number | null
          funded_investors?: number | null
          id?: string
          impressions?: number | null
          leads?: number | null
          reconnect_calls?: number | null
          reconnect_showed?: number | null
          showed_calls?: number | null
          spam_leads?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reports: {
        Row: {
          client_experience_done: boolean | null
          created_at: string
          id: string
          member_id: string
          report_date: string
          report_type: string
          self_assessment: number | null
          tasks_snapshot: Json | null
          top_priorities: Json | null
          touchpoint_count: number | null
          touchpoint_notes: string | null
          wins_shared: string | null
        }
        Insert: {
          client_experience_done?: boolean | null
          created_at?: string
          id?: string
          member_id: string
          report_date: string
          report_type?: string
          self_assessment?: number | null
          tasks_snapshot?: Json | null
          top_priorities?: Json | null
          touchpoint_count?: number | null
          touchpoint_notes?: string | null
          wins_shared?: string | null
        }
        Update: {
          client_experience_done?: boolean | null
          created_at?: string
          id?: string
          member_id?: string
          report_date?: string
          report_type?: string
          self_assessment?: number | null
          tasks_snapshot?: Json | null
          top_priorities?: Json | null
          touchpoint_count?: number | null
          touchpoint_notes?: string | null
          wins_shared?: string | null
        }
        Relationships: []
      }
      dashboard_preferences: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          preference_type: string | null
          preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          preference_type?: string | null
          preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          preference_type?: string | null
          preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      funded_investors: {
        Row: {
          calls_to_fund: number | null
          client_id: string
          commitment_amount: number | null
          created_at: string
          external_id: string
          first_contact_at: string | null
          funded_amount: number
          funded_at: string
          id: string
          lead_id: string | null
          name: string | null
          time_to_fund_days: number | null
        }
        Insert: {
          calls_to_fund?: number | null
          client_id: string
          commitment_amount?: number | null
          created_at?: string
          external_id: string
          first_contact_at?: string | null
          funded_amount?: number
          funded_at?: string
          id?: string
          lead_id?: string | null
          name?: string | null
          time_to_fund_days?: number | null
        }
        Update: {
          calls_to_fund?: number | null
          client_id?: string
          commitment_amount?: number | null
          created_at?: string
          external_id?: string
          first_contact_at?: string | null
          funded_amount?: number
          funded_at?: string
          id?: string
          lead_id?: string | null
          name?: string | null
          time_to_fund_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "funded_investors_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funded_investors_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_status: {
        Row: {
          config: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          integration_name: string
          last_sync_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          integration_name: string
          last_sync_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          integration_name?: string
          last_sync_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          accredited: boolean | null
          assigned_user: string | null
          client_id: string
          created_at: string
          custom_fields: Json | null
          email: string | null
          external_id: string
          id: string
          investment_amount: number | null
          is_spam: boolean | null
          name: string | null
          phone: string | null
          pipeline_value: number | null
          source: string
          status: string | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          accredited?: boolean | null
          assigned_user?: string | null
          client_id: string
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          external_id: string
          id?: string
          investment_amount?: number | null
          is_spam?: boolean | null
          name?: string | null
          phone?: string | null
          pipeline_value?: number | null
          source?: string
          status?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          accredited?: boolean | null
          assigned_user?: string | null
          client_id?: string
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          external_id?: string
          id?: string
          investment_amount?: number | null
          is_spam?: boolean | null
          name?: string | null
          phone?: string | null
          pipeline_value?: number | null
          source?: string
          status?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      pagespeed_cache: {
        Row: {
          fetched_at: string
          id: string
          metrics: Json | null
          performance_score: number | null
          step_id: string
          strategy: string
          url: string
        }
        Insert: {
          fetched_at?: string
          id?: string
          metrics?: Json | null
          performance_score?: number | null
          step_id: string
          strategy?: string
          url: string
        }
        Update: {
          fetched_at?: string
          id?: string
          metrics?: Json | null
          performance_score?: number | null
          step_id?: string
          strategy?: string
          url?: string
        }
        Relationships: []
      }
      pending_meeting_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          id: string
          meeting_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          meeting_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          meeting_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_meeting_tasks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "agency_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          offer_description: string | null
          settings: Json
          type: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          offer_description?: string | null
          settings?: Json
          type?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          offer_description?: string | null
          settings?: Json
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz_funnels: {
        Row: {
          badge_text: string | null
          bottom_stats: Json | null
          brand_logo_url: string | null
          brand_name: string | null
          calendar_url: string | null
          client_id: string
          collect_contact: boolean | null
          created_at: string
          cta_text: string | null
          disclaimer_text: string | null
          hero_description: string | null
          hero_heading: string | null
          hero_stats: Json | null
          id: string
          is_active: boolean | null
          meta_pixel_id: string | null
          name: string
          primary_color: string | null
          questions: Json
          show_calendar: boolean | null
          slug: string | null
          subtitle: string | null
          thank_you_heading: string | null
          thank_you_message: string | null
          title: string
          updated_at: string
        }
        Insert: {
          badge_text?: string | null
          bottom_stats?: Json | null
          brand_logo_url?: string | null
          brand_name?: string | null
          calendar_url?: string | null
          client_id: string
          collect_contact?: boolean | null
          created_at?: string
          cta_text?: string | null
          disclaimer_text?: string | null
          hero_description?: string | null
          hero_heading?: string | null
          hero_stats?: Json | null
          id?: string
          is_active?: boolean | null
          meta_pixel_id?: string | null
          name?: string
          primary_color?: string | null
          questions?: Json
          show_calendar?: boolean | null
          slug?: string | null
          subtitle?: string | null
          thank_you_heading?: string | null
          thank_you_message?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          badge_text?: string | null
          bottom_stats?: Json | null
          brand_logo_url?: string | null
          brand_name?: string | null
          calendar_url?: string | null
          client_id?: string
          collect_contact?: boolean | null
          created_at?: string
          cta_text?: string | null
          disclaimer_text?: string | null
          hero_description?: string | null
          hero_heading?: string | null
          hero_stats?: Json | null
          id?: string
          is_active?: boolean | null
          meta_pixel_id?: string | null
          name?: string
          primary_color?: string | null
          questions?: Json
          show_calendar?: boolean | null
          slug?: string | null
          subtitle?: string | null
          thank_you_heading?: string | null
          thank_you_message?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_funnels_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_submissions: {
        Row: {
          answers: Json | null
          booking_date: string | null
          booking_time: string | null
          client_id: string
          completed: boolean | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          ip_address: string | null
          last_name: string | null
          phone: string | null
          quiz_funnel_id: string
          step_reached: number | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          answers?: Json | null
          booking_date?: string | null
          booking_time?: string | null
          client_id: string
          completed?: boolean | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          ip_address?: string | null
          last_name?: string | null
          phone?: string | null
          quiz_funnel_id: string
          step_reached?: number | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          answers?: Json | null
          booking_date?: string | null
          booking_time?: string | null
          client_id?: string
          completed?: boolean | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          ip_address?: string | null
          last_name?: string | null
          phone?: string | null
          quiz_funnel_id?: string
          step_reached?: number | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_submissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_submissions_quiz_funnel_id_fkey"
            columns: ["quiz_funnel_id"]
            isOneToOne: false
            referencedRelation: "quiz_funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_items: {
        Row: {
          amount: number | null
          created_at: string | null
          details: Json | null
          external_id: string | null
          id: string
          run_id: string | null
          source: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          details?: Json | null
          external_id?: string | null
          id?: string
          run_id?: string | null
          source?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          details?: Json | null
          external_id?: string | null
          id?: string
          run_id?: string | null
          source?: string | null
          status?: string | null
        }
        Relationships: []
      }
      reconciliation_runs: {
        Row: {
          client_id: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          matched_items: number | null
          status: string | null
          total_items: number | null
          unmatched_items: number | null
        }
        Insert: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          matched_items?: number | null
          status?: string | null
          total_items?: number | null
          unmatched_items?: number | null
        }
        Update: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          matched_items?: number | null
          status?: string | null
          total_items?: number | null
          unmatched_items?: number | null
        }
        Relationships: []
      }
      scraped_ads: {
        Row: {
          ad_url: string | null
          body_text: string | null
          client_id: string | null
          company: string | null
          created_at: string | null
          cta: string | null
          first_seen_at: string | null
          headline: string | null
          id: string
          image_url: string | null
          last_seen_at: string | null
          metadata: Json | null
          platform: string | null
          status: string | null
          video_url: string | null
        }
        Insert: {
          ad_url?: string | null
          body_text?: string | null
          client_id?: string | null
          company?: string | null
          created_at?: string | null
          cta?: string | null
          first_seen_at?: string | null
          headline?: string | null
          id?: string
          image_url?: string | null
          last_seen_at?: string | null
          metadata?: Json | null
          platform?: string | null
          status?: string | null
          video_url?: string | null
        }
        Update: {
          ad_url?: string | null
          body_text?: string | null
          client_id?: string | null
          company?: string | null
          created_at?: string | null
          cta?: string | null
          first_seen_at?: string | null
          headline?: string | null
          id?: string
          image_url?: string | null
          last_seen_at?: string | null
          metadata?: Json | null
          platform?: string | null
          status?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      scraping_schedule: {
        Row: {
          client_ids: Json | null
          created_at: string | null
          enabled: boolean | null
          id: string
          last_run_at: string | null
          scrape_time: string | null
          updated_at: string | null
          viral_hashtags: Json | null
        }
        Insert: {
          client_ids?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_run_at?: string | null
          scrape_time?: string | null
          updated_at?: string | null
          viral_hashtags?: Json | null
        }
        Update: {
          client_ids?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_run_at?: string | null
          scrape_time?: string | null
          updated_at?: string | null
          viral_hashtags?: Json | null
        }
        Relationships: []
      }
      scripts: {
        Row: {
          content: string
          created_at: string
          duration_seconds: number | null
          framework: string | null
          hook: string | null
          id: string
          project_id: string
          selected: boolean
          title: string
        }
        Insert: {
          content?: string
          created_at?: string
          duration_seconds?: number | null
          framework?: string | null
          hook?: string | null
          id?: string
          project_id: string
          selected?: boolean
          title?: string
        }
        Update: {
          content?: string
          created_at?: string
          duration_seconds?: number | null
          framework?: string | null
          hook?: string | null
          id?: string
          project_id?: string
          selected?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "scripts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      slack_activity_log: {
        Row: {
          ai_analysis: Json | null
          channel_id: string
          client_id: string | null
          created_at: string
          id: string
          linked_task_id: string | null
          message_text: string | null
          message_ts: string
          message_type: string | null
          thread_ts: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          channel_id: string
          client_id?: string | null
          created_at?: string
          id?: string
          linked_task_id?: string | null
          message_text?: string | null
          message_ts: string
          message_type?: string | null
          thread_ts?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          channel_id?: string
          client_id?: string | null
          created_at?: string
          id?: string
          linked_task_id?: string | null
          message_text?: string | null
          message_ts?: string
          message_type?: string | null
          thread_ts?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      slack_channel_mappings: {
        Row: {
          auto_create_tasks: boolean | null
          channel_id: string
          channel_name: string | null
          channel_type: string | null
          client_id: string
          created_at: string
          id: string
          monitor_messages: boolean | null
          updated_at: string
        }
        Insert: {
          auto_create_tasks?: boolean | null
          channel_id: string
          channel_name?: string | null
          channel_type?: string | null
          client_id: string
          created_at?: string
          id?: string
          monitor_messages?: boolean | null
          updated_at?: string
        }
        Update: {
          auto_create_tasks?: boolean | null
          channel_id?: string
          channel_name?: string | null
          channel_type?: string | null
          client_id?: string
          created_at?: string
          id?: string
          monitor_messages?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      sync_accuracy_log: {
        Row: {
          actual_value: number | null
          check_date: string
          client_id: string | null
          created_at: string | null
          discrepancy: number | null
          expected_value: number | null
          id: string
          metric: string | null
          status: string | null
        }
        Insert: {
          actual_value?: number | null
          check_date: string
          client_id?: string | null
          created_at?: string | null
          discrepancy?: number | null
          expected_value?: number | null
          id?: string
          metric?: string | null
          status?: string | null
        }
        Update: {
          actual_value?: number | null
          check_date?: string
          client_id?: string | null
          created_at?: string | null
          discrepancy?: number | null
          expected_value?: number | null
          id?: string
          metric?: string | null
          status?: string | null
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          client_id: string
          completed_at: string | null
          error_message: string | null
          id: string
          records_synced: number | null
          started_at: string
          status: string
          sync_type: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          error_message?: string | null
          id?: string
          records_synced?: number | null
          started_at?: string
          status?: string
          sync_type: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          error_message?: string | null
          id?: string
          records_synced?: number | null
          started_at?: string
          status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_runs: {
        Row: {
          client_id: string
          created_at: string
          duration_ms: number | null
          error_details: Json | null
          error_message: string | null
          finished_at: string | null
          id: string
          metadata: Json | null
          mode: string | null
          records_created: number | null
          records_errored: number | null
          records_processed: number | null
          records_updated: number | null
          started_at: string
          status: string
          sync_type: string
        }
        Insert: {
          client_id: string
          created_at?: string
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json | null
          mode?: string | null
          records_created?: number | null
          records_errored?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string
          status?: string
          sync_type: string
        }
        Update: {
          client_id?: string
          created_at?: string
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json | null
          mode?: string | null
          records_created?: number | null
          records_errored?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string
          status?: string
          sync_type?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      viral_tracking_targets: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          last_scraped_at: string | null
          platform: string | null
          type: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_scraped_at?: string | null
          platform?: string | null
          type?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_scraped_at?: string | null
          platform?: string | null
          type?: string | null
          value?: string
        }
        Relationships: []
      }
      viral_videos: {
        Row: {
          author: string | null
          caption: string | null
          created_at: string | null
          hashtag: string | null
          id: string
          likes: number | null
          platform: string | null
          scraped_at: string | null
          shares: number | null
          thumbnail_url: string | null
          url: string | null
          views: number | null
        }
        Insert: {
          author?: string | null
          caption?: string | null
          created_at?: string | null
          hashtag?: string | null
          id?: string
          likes?: number | null
          platform?: string | null
          scraped_at?: string | null
          shares?: number | null
          thumbnail_url?: string | null
          url?: string | null
          views?: number | null
        }
        Update: {
          author?: string | null
          caption?: string | null
          created_at?: string | null
          hashtag?: string | null
          id?: string
          likes?: number | null
          platform?: string | null
          scraped_at?: string | null
          shares?: number | null
          thumbnail_url?: string | null
          url?: string | null
          views?: number | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          client_id: string
          error_message: string | null
          id: string
          payload: Json | null
          processed_at: string
          status: string
          webhook_type: string
        }
        Insert: {
          client_id: string
          error_message?: string | null
          id?: string
          payload?: Json | null
          processed_at?: string
          status?: string
          webhook_type: string
        }
        Update: {
          client_id?: string
          error_message?: string | null
          id?: string
          payload?: Json | null
          processed_at?: string
          status?: string
          webhook_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_client_source_metrics: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          avg_calls_to_fund: number
          avg_time_to_fund: number
          client_id: string
          commitment_dollars: number
          funded_count: number
          funded_dollars: number
          reconnect_calls: number
          reconnect_showed: number
          showed_calls: number
          spam_leads: number
          total_calls: number
          total_leads: number
        }[]
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
