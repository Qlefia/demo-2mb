// AUTO-GENERATED via Supabase MCP `generate_typescript_types`. Do not edit by hand.
// Regenerate after every schema change to detect drift between Drizzle and live DB.
// Source of truth at runtime: src/lib/db/schema/*.

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_coaccess_requests: {
        Row: {
          account_id: string
          created_at: string
          id: string
          note: string | null
          requester_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["account_coaccess_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          note?: string | null
          requester_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["account_coaccess_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          note?: string | null
          requester_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["account_coaccess_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_coaccess_requests_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_coaccess_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          created_at: string
          employees: number | null
          founded_year: number | null
          hq_city: string | null
          hq_country: string | null
          id: string
          legal_form: string | null
          mailing_country_code: string | null
          mailing_locality: string | null
          mailing_postal_code: string | null
          mailing_street: string | null
          name: string
          opt_out_at: string | null
          public_private: Database["public"]["Enums"]["public_private"]
          updated_at: string
          website: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          employees?: number | null
          founded_year?: number | null
          hq_city?: string | null
          hq_country?: string | null
          id?: string
          legal_form?: string | null
          mailing_country_code?: string | null
          mailing_locality?: string | null
          mailing_postal_code?: string | null
          mailing_street?: string | null
          name: string
          opt_out_at?: string | null
          public_private?: Database["public"]["Enums"]["public_private"]
          updated_at?: string
          website?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          employees?: number | null
          founded_year?: number | null
          hq_city?: string | null
          hq_country?: string | null
          id?: string
          legal_form?: string | null
          mailing_country_code?: string | null
          mailing_locality?: string | null
          mailing_postal_code?: string | null
          mailing_street?: string | null
          name?: string
          opt_out_at?: string | null
          public_private?: Database["public"]["Enums"]["public_private"]
          updated_at?: string
          website?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          payload: Json
          prospect_id: string
          type: Database["public"]["Enums"]["activity_type"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          payload?: Json
          prospect_id: string
          type: Database["public"]["Enums"]["activity_type"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          payload?: Json
          prospect_id?: string
          type?: Database["public"]["Enums"]["activity_type"]
        }
        Relationships: [
          {
            foreignKeyName: "activities_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      case_embeddings: {
        Row: {
          case_id: string
          embedding: string
          model: string
          updated_at: string
        }
        Insert: {
          case_id: string
          embedding: string
          model?: string
          updated_at?: string
        }
        Update: {
          case_id?: string
          embedding?: string
          model?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_embeddings_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: true
            referencedRelation: "comparable_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      comparable_cases: {
        Row: {
          created_at: string
          facade_style: string | null
          id: string
          name: string
          pdf_url: string | null
          project_type: string | null
          region: string | null
          scale_units: number | null
          slug: string
          summary: string
          updated_at: string
          year: number | null
        }
        Insert: {
          created_at?: string
          facade_style?: string | null
          id?: string
          name: string
          pdf_url?: string | null
          project_type?: string | null
          region?: string | null
          scale_units?: number | null
          slug: string
          summary: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          created_at?: string
          facade_style?: string | null
          id?: string
          name?: string
          pdf_url?: string | null
          project_type?: string | null
          region?: string | null
          scale_units?: number | null
          slug?: string
          summary?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          account_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          languages: string[] | null
          linkedin_url: string | null
          opt_out_at: string | null
          phone: string | null
          role: string | null
          source_fetched_at: string | null
          source_provider: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          languages?: string[] | null
          linkedin_url?: string | null
          opt_out_at?: string | null
          phone?: string | null
          role?: string | null
          source_fetched_at?: string | null
          source_provider?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          languages?: string[] | null
          linkedin_url?: string | null
          opt_out_at?: string | null
          phone?: string | null
          role?: string | null
          source_fetched_at?: string | null
          source_provider?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          created_at: string
          currency: string
          id: string
          prospect_id: string
          stage: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          prospect_id: string
          stage?: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          prospect_id?: string
          stage?: Database["public"]["Enums"]["deal_stage"]
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_versions: {
        Row: {
          dossier_id: string
          generated_at: string
          generated_by: string | null
          id: string
          sections_diff: Json
          version: number
        }
        Insert: {
          dossier_id: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          sections_diff?: Json
          version: number
        }
        Update: {
          dossier_id?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          sections_diff?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "dossier_versions_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      dossiers: {
        Row: {
          ai_metadata: Json | null
          created_at: string
          id: string
          prospect_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          sections: Json
          status: Database["public"]["Enums"]["dossier_status"]
          suggested_playbook_id: string | null
          updated_at: string
          version: number
        }
        Insert: {
          ai_metadata?: Json | null
          created_at?: string
          id?: string
          prospect_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sections?: Json
          status?: Database["public"]["Enums"]["dossier_status"]
          suggested_playbook_id?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          ai_metadata?: Json | null
          created_at?: string
          id?: string
          prospect_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sections?: Json
          status?: Database["public"]["Enums"]["dossier_status"]
          suggested_playbook_id?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "dossiers_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossiers_suggested_playbook_id_fkey"
            columns: ["suggested_playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      enrichment_cache: {
        Row: {
          fetched_at: string
          id: string
          payload: Json
          provider: string
          query_hash: string
          ttl_seconds: number
        }
        Insert: {
          fetched_at?: string
          id?: string
          payload?: Json
          provider: string
          query_hash: string
          ttl_seconds: number
        }
        Update: {
          fetched_at?: string
          id?: string
          payload?: Json
          provider?: string
          query_hash?: string
          ttl_seconds?: number
        }
        Relationships: []
      }
      enrichment_jobs: {
        Row: {
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          job_key: string
          prospect_id: string
          provider: string
          started_at: string | null
          status: Database["public"]["Enums"]["enrichment_job_status"]
        }
        Insert: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          job_key: string
          prospect_id: string
          provider: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["enrichment_job_status"]
        }
        Update: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          job_key?: string
          prospect_id?: string
          provider?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["enrichment_job_status"]
        }
        Relationships: [
          {
            foreignKeyName: "enrichment_jobs_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_profile: {
        Row: {
          address_line: string
          created_at: string
          legal_name: string
          register_line: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          address_line: string
          created_at?: string
          legal_name: string
          register_line?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          address_line?: string
          created_at?: string
          legal_name?: string
          register_line?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_profile_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      playbooks: {
        Row: {
          body: string
          created_at: string
          id: string
          language: string
          name: string
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          language: string
          name: string
          updated_at?: string
          version?: number
          workspace_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          language?: string
          name?: string
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbooks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_share_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          proposal_id: string
          published_version_id: string | null
          revoked_at: string | null
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          proposal_id: string
          published_version_id?: string | null
          revoked_at?: string | null
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          proposal_id?: string
          published_version_id?: string | null
          revoked_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_share_tokens_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_share_tokens_published_version_id_fkey"
            columns: ["published_version_id"]
            isOneToOne: false
            referencedRelation: "proposal_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_versions: {
        Row: {
          blocks_diff: Json
          generated_at: string
          generated_by: string | null
          id: string
          proposal_id: string
          version: number
        }
        Insert: {
          blocks_diff?: Json
          generated_at?: string
          generated_by?: string | null
          id?: string
          proposal_id: string
          version: number
        }
        Update: {
          blocks_diff?: Json
          generated_at?: string
          generated_by?: string | null
          id?: string
          proposal_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_versions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          blocks: Json
          created_at: string
          created_by: string | null
          id: string
          issued_at: string | null
          language: Database["public"]["Enums"]["proposal_language"]
          metadata: Json | null
          project_name: string | null
          prospect_id: string
          published_version_id: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          title: string
          updated_at: string
          validity_days: number
          version: number
        }
        Insert: {
          blocks?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          issued_at?: string | null
          language?: Database["public"]["Enums"]["proposal_language"]
          metadata?: Json | null
          project_name?: string | null
          prospect_id: string
          published_version_id?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          title: string
          updated_at?: string
          validity_days?: number
          version?: number
        }
        Update: {
          blocks?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          issued_at?: string | null
          language?: Database["public"]["Enums"]["proposal_language"]
          metadata?: Json | null
          project_name?: string | null
          prospect_id?: string
          published_version_id?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          title?: string
          updated_at?: string
          validity_days?: number
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposals_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_published_version_id_fkey"
            columns: ["published_version_id"]
            isOneToOne: false
            referencedRelation: "proposal_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_sales_qa: {
        Row: {
          answer: string | null
          created_at: string
          created_by: string | null
          id: string
          prospect_id: string
          question: string
          updated_at: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          prospect_id: string
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          prospect_id?: string
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospect_sales_qa_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      prospects: {
        Row: {
          account_id: string
          created_at: string
          created_by: string | null
          id: string
          lost_reason: Database["public"]["Enums"]["lost_reason"] | null
          owner_id: string | null
          priority: number
          source: Database["public"]["Enums"]["prospect_source"]
          stage: Database["public"]["Enums"]["prospect_stage"]
          suggested_playbook_id: string | null
          territory: Database["public"]["Enums"]["territory"]
          triage_decision: Database["public"]["Enums"]["triage_decision"] | null
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          lost_reason?: Database["public"]["Enums"]["lost_reason"] | null
          owner_id?: string | null
          priority?: number
          source: Database["public"]["Enums"]["prospect_source"]
          stage?: Database["public"]["Enums"]["prospect_stage"]
          suggested_playbook_id?: string | null
          territory: Database["public"]["Enums"]["territory"]
          triage_decision?:
            | Database["public"]["Enums"]["triage_decision"]
            | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          lost_reason?: Database["public"]["Enums"]["lost_reason"] | null
          owner_id?: string | null
          priority?: number
          source?: Database["public"]["Enums"]["prospect_source"]
          stage?: Database["public"]["Enums"]["prospect_stage"]
          suggested_playbook_id?: string | null
          territory?: Database["public"]["Enums"]["territory"]
          triage_decision?:
            | Database["public"]["Enums"]["triage_decision"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospects_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_suggested_playbook_id_fkey"
            columns: ["suggested_playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_quota: {
        Row: {
          bucket_date: string
          created_at: string
          id: string
          limit_cap: number | null
          provider: string
          updated_at: string
          used: number
        }
        Insert: {
          bucket_date: string
          created_at?: string
          id?: string
          limit_cap?: number | null
          provider: string
          updated_at?: string
          used?: number
        }
        Update: {
          bucket_date?: string
          created_at?: string
          id?: string
          limit_cap?: number | null
          provider?: string
          updated_at?: string
          used?: number
        }
        Relationships: []
      }
      service_tags: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label_de: string
          label_en: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label_de: string
          label_en: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label_de?: string
          label_en?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string
          completed_at: string | null
          created_at: string
          due_at: string | null
          id: string
          playbook_id: string | null
          prospect_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
        }
        Insert: {
          assignee_id: string
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          playbook_id?: string | null
          prospect_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
        }
        Update: {
          assignee_id?: string
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          playbook_id?: string | null
          prospect_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      triggers: {
        Row: {
          account_id: string
          created_at: string
          id: string
          occurred_at: string
          payload: Json
          prospect_id: string | null
          source_url: string | null
          type: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          occurred_at: string
          payload?: Json
          prospect_id?: string | null
          source_url?: string | null
          type: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          occurred_at?: string
          payload?: Json
          prospect_id?: string | null
          source_url?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "triggers_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "triggers_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_client_segments: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          priority: number
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          priority?: number
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          priority?: number
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_client_segments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["workspace_member_role"]
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          role: Database["public"]["Enums"]["workspace_member_role"]
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["workspace_member_role"]
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_offer_matrix: {
        Row: {
          created_at: string
          pitch: string | null
          segment_id: string
          service_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          pitch?: string | null
          segment_id: string
          service_id: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          pitch?: string | null
          segment_id?: string
          service_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_offer_matrix_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "workspace_client_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_offer_matrix_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "workspace_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_offer_matrix_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_onboarding_state: {
        Row: {
          created_at: string
          status: Database["public"]["Enums"]["workspace_onboarding_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          status?: Database["public"]["Enums"]["workspace_onboarding_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          status?: Database["public"]["Enums"]["workspace_onboarding_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_onboarding_state_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          sort_order: number
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_services_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_role: { Args: never; Returns: string }
      current_territory: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_founder: { Args: never; Returns: boolean }
      is_ops: { Args: never; Returns: boolean }
      is_sales: { Args: never; Returns: boolean }
      is_sales_de: { Args: never; Returns: boolean }
      is_sales_uk: { Args: never; Returns: boolean }
      sales_territory: {
        Args: never
        Returns: Database["public"]["Enums"]["territory"]
      }
      stage_rank: {
        Args: { s: Database["public"]["Enums"]["prospect_stage"] }
        Returns: number
      }
      user_has_workspace_access: {
        Args: { target_ws: string }
        Returns: boolean
      }
    }
    Enums: {
      account_coaccess_status: "pending" | "approved" | "rejected"
      activity_type:
        | "stage_change"
        | "owner_change"
        | "audit"
        | "call"
        | "email"
        | "linkedin"
        | "note"
        | "dossier_delivered"
        | "opt_out"
        | "task_completed"
      deal_stage: "open" | "won" | "lost"
      dossier_status: "draft" | "in_review" | "ready" | "archived"
      enrichment_job_status:
        | "queued"
        | "running"
        | "success"
        | "failed"
        | "cancelled"
      lost_reason:
        | "icp_mismatch"
        | "no_budget"
        | "no_timing"
        | "competitor_won"
        | "no_response"
        | "other"
      proposal_language: "de" | "en"
      proposal_status: "draft" | "published"
      prospect_source:
        | "inbound_form"
        | "linkedin_outreach"
        | "competitionline"
        | "immobilienmanager"
        | "propertyweek"
        | "manual"
        | "referral"
      prospect_stage:
        | "new"
        | "triaged"
        | "enriching"
        | "dossier_in_progress"
        | "dossier_ready"
        | "1st_call"
        | "meeting_scheduled"
        | "proposal_sent"
        | "won"
        | "lost"
      public_private: "public" | "private" | "unknown"
      task_status: "open" | "in_progress" | "done" | "cancelled"
      territory: "DE" | "UK" | "EU_other"
      triage_decision: "accept" | "reject"
      workspace_member_role: "owner" | "admin" | "member"
      workspace_onboarding_status: "draft" | "in_review" | "confirmed"
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
      account_coaccess_status: ["pending", "approved", "rejected"],
      activity_type: [
        "stage_change",
        "owner_change",
        "audit",
        "call",
        "email",
        "linkedin",
        "note",
        "dossier_delivered",
        "opt_out",
        "task_completed",
      ],
      deal_stage: ["open", "won", "lost"],
      dossier_status: ["draft", "in_review", "ready", "archived"],
      enrichment_job_status: [
        "queued",
        "running",
        "success",
        "failed",
        "cancelled",
      ],
      lost_reason: [
        "icp_mismatch",
        "no_budget",
        "no_timing",
        "competitor_won",
        "no_response",
        "other",
      ],
      proposal_language: ["de", "en"],
      proposal_status: ["draft", "published"],
      prospect_source: [
        "inbound_form",
        "linkedin_outreach",
        "competitionline",
        "immobilienmanager",
        "propertyweek",
        "manual",
        "referral",
      ],
      prospect_stage: [
        "new",
        "triaged",
        "enriching",
        "dossier_in_progress",
        "dossier_ready",
        "1st_call",
        "meeting_scheduled",
        "proposal_sent",
        "won",
        "lost",
      ],
      public_private: ["public", "private", "unknown"],
      task_status: ["open", "in_progress", "done", "cancelled"],
      territory: ["DE", "UK", "EU_other"],
      triage_decision: ["accept", "reject"],
      workspace_member_role: ["owner", "admin", "member"],
      workspace_onboarding_status: ["draft", "in_review", "confirmed"],
    },
  },
} as const
