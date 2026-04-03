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
          replicate_api_key: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          replicate_api_key?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          replicate_api_key?: string | null;
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
      rooms: {
        Row: {
          id: string;
          floor_plan_id: string;
          name: string;
          color: string;
          vertices: Json;
          x: number;
          y: number;
          width_px: number;
          height_px: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          floor_plan_id: string;
          name: string;
          color?: string;
          vertices: Json;
          x: number;
          y: number;
          width_px: number;
          height_px: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          color?: string;
          vertices?: Json;
          x?: number;
          y?: number;
          width_px?: number;
          height_px?: number;
          sort_order?: number;
          updated_at?: string;
        };
      };
      room_photos: {
        Row: {
          id: string;
          project_id: string;
          floor_plan_id: string | null;
          room_id: string | null;
          image_path: string;
          name: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          floor_plan_id?: string | null;
          room_id?: string | null;
          image_path: string;
          name?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          floor_plan_id?: string | null;
          room_id?: string | null;
          image_path?: string;
          name?: string;
          sort_order?: number;
          updated_at?: string;
        };
      };
      style_generations: {
        Row: {
          id: string;
          project_id: string;
          source_photo_id: string | null;
          room_id: string | null;
          style_preset: string | null;
          prompt: string;
          negative_prompt: string | null;
          denoise_strength: number;
          result_image_path: string | null;
          status: string;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          source_photo_id?: string | null;
          room_id?: string | null;
          style_preset?: string | null;
          prompt: string;
          negative_prompt?: string | null;
          denoise_strength?: number;
          result_image_path?: string | null;
          status?: string;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          source_photo_id?: string | null;
          room_id?: string | null;
          style_preset?: string | null;
          prompt?: string;
          negative_prompt?: string | null;
          denoise_strength?: number;
          result_image_path?: string | null;
          status?: string;
          error_message?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}
