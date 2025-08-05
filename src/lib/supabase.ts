import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          website: string | null;
          industry: string | null;
          target_audience: string | null;
          brand_tone: string;
          goals: string[];
          platforms: string[];
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          website?: string | null;
          industry?: string | null;
          target_audience?: string | null;
          brand_tone?: string;
          goals?: string[];
          platforms?: string[];
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          website?: string | null;
          industry?: string | null;
          target_audience?: string | null;
          brand_tone?: string;
          goals?: string[];
          platforms?: string[];
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          company_id: string;
          prompt: string;
          tags: string[];
          campaign_id: string | null;
          media_url: string | null;
          generated_content: any;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          prompt: string;
          tags?: string[];
          campaign_id?: string | null;
          media_url?: string | null;
          generated_content?: any;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          prompt?: string;
          tags?: string[];
          campaign_id?: string | null;
          media_url?: string | null;
          generated_content?: any;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}