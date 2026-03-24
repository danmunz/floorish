export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          settings?: Json;
          updated_at?: string;
        };
      };
      floor_plans: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          image_path: string | null;
          pixels_per_foot: number | null;
          calibration_points: Json | null;
          calibration_distance_ft: number | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          image_path?: string | null;
          pixels_per_foot?: number | null;
          calibration_points?: Json | null;
          calibration_distance_ft?: number | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          image_path?: string | null;
          pixels_per_foot?: number | null;
          calibration_points?: Json | null;
          calibration_distance_ft?: number | null;
          sort_order?: number;
          updated_at?: string;
        };
      };
      furniture: {
        Row: {
          id: string;
          floor_plan_id: string;
          preset_id: string | null;
          name: string;
          x: number;
          y: number;
          width_px: number;
          height_px: number;
          rotation: number;
          color: string;
          shape: string;
          vertices: Json | null;
          locked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          floor_plan_id: string;
          preset_id?: string | null;
          name: string;
          x: number;
          y: number;
          width_px: number;
          height_px: number;
          rotation?: number;
          color: string;
          shape: string;
          vertices?: Json | null;
          locked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          preset_id?: string | null;
          name?: string;
          x?: number;
          y?: number;
          width_px?: number;
          height_px?: number;
          rotation?: number;
          color?: string;
          shape?: string;
          vertices?: Json | null;
          locked?: boolean;
          updated_at?: string;
        };
      };
      shares: {
        Row: {
          id: string;
          project_id: string;
          token: string;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          token: string;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          expires_at?: string | null;
        };
      };
    };
  };
}
