export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      contexts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          content: string
          project_id: string
          user_id: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          content: string
          project_id: string
          user_id: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          content?: string
          project_id?: string
          user_id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "contexts_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contexts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      agents: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          model: string
          temperature: number
          max_tokens: number | null
          system_prompt: string
          project_id: string
          user_id: string
          memory_enabled: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          model: string
          temperature: number
          max_tokens?: number | null
          system_prompt: string
          project_id: string
          user_id: string
          memory_enabled?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          model?: string
          temperature?: number
          max_tokens?: number | null
          system_prompt?: string
          project_id?: string
          user_id?: string
          memory_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "agents_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          name: string | null
          avatar_url: string | null
          password_hash: string | null
          role: string | null
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
          name?: string | null
          avatar_url?: string | null
          password_hash?: string | null
          role?: string | null
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          name?: string | null
          avatar_url?: string | null
          password_hash?: string | null
          role?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          provider: string
          api_key_encrypted: string
          name: string
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          provider: string
          api_key_encrypted: string
          name: string
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          provider?: string
          api_key_encrypted?: string
          name?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      api_usage: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          project_id: string | null
          agent_id: string | null
          provider: string
          model: string
          tokens_prompt: number
          tokens_completion: number
          tokens_total: number
          status: string
          duration_ms: number | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          project_id?: string | null
          agent_id?: string | null
          provider: string
          model: string
          tokens_prompt: number
          tokens_completion: number
          tokens_total: number
          status?: string
          duration_ms?: number | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          project_id?: string | null
          agent_id?: string | null
          provider?: string
          model?: string
          tokens_prompt?: number
          tokens_completion?: number
          tokens_total?: number
          status?: string
          duration_ms?: number | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_usage_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_usage_agent_id_fkey"
            columns: ["agent_id"]
            referencedRelation: "agents"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_presets: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string
          base_prompt: string
          category: string
          recommended_model: string
          recommended_provider: string
          icon: string
          temperature: number
          memory_toggle: boolean
          tone: string
          tags: string[] | null
          is_system: boolean
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description: string
          base_prompt: string
          category: string
          recommended_model: string
          recommended_provider: string
          icon: string
          temperature?: number
          memory_toggle?: boolean
          tone?: string
          tags?: string[] | null
          is_system?: boolean
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string
          base_prompt?: string
          category?: string
          recommended_model?: string
          recommended_provider?: string
          icon?: string
          temperature?: number
          memory_toggle?: boolean
          tone?: string
          tags?: string[] | null
          is_system?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_presets_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      versions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          content_id: string
          content_type: string
          content_snapshot: Json
          metadata: Json | null
          project_id: string
          user_id: string
          parent_version_id: string | null
          is_current: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          content_id: string
          content_type: string
          content_snapshot: Json
          metadata?: Json | null
          project_id: string
          user_id: string
          parent_version_id?: string | null
          is_current?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          content_id?: string
          content_type?: string
          content_snapshot?: Json
          metadata?: Json | null
          project_id?: string
          user_id?: string
          parent_version_id?: string | null
          is_current?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "versions_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "versions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "versions_parent_version_id_fkey"
            columns: ["parent_version_id"]
            referencedRelation: "versions"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_ratings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          agent_id: string
          user_id: string
          rating: number
          feedback: string | null
          session_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          agent_id: string
          user_id: string
          rating: number
          feedback?: string | null
          session_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          agent_id?: string
          user_id?: string
          rating?: number
          feedback?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_ratings_agent_id_fkey"
            columns: ["agent_id"]
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_ratings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
  }
} 