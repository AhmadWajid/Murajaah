export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      memorization_items: {
        Row: {
          id: string;
          user_id: string;
          surah: number;
          ayah_start: number;
          ayah_end: number;
          interval_days: number;
          next_review: string;
          ease_factor: number;
          review_count: number;
          last_reviewed: string | null;
          completed_today: string | null;
          created_at: string;
          memorization_age: number | null;
          individual_ratings: Record<string, any> | null;
          individual_recall_quality: Record<string, any> | null;
          ruku_start: number | null;
          ruku_end: number | null;
          ruku_count: number | null;
          difficulty_level: 'easy' | 'medium' | 'hard' | null;
          name: string | null;
          description: string | null;
          tags: string[] | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          surah: number;
          ayah_start: number;
          ayah_end: number;
          interval_days?: number;
          next_review: string;
          ease_factor?: number;
          review_count?: number;
          last_reviewed?: string | null;
          completed_today?: string | null;
          created_at?: string;
          memorization_age?: number | null;
          individual_ratings?: Record<string, any> | null;
          individual_recall_quality?: Record<string, any> | null;
          ruku_start?: number | null;
          ruku_end?: number | null;
          ruku_count?: number | null;
          difficulty_level?: 'easy' | 'medium' | 'hard' | null;
          name?: string | null;
          description?: string | null;
          tags?: string[] | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          surah?: number;
          ayah_start?: number;
          ayah_end?: number;
          interval_days?: number;
          next_review?: string;
          ease_factor?: number;
          review_count?: number;
          last_reviewed?: string | null;
          completed_today?: string | null;
          created_at?: string;
          memorization_age?: number | null;
          individual_ratings?: Record<string, any> | null;
          individual_recall_quality?: Record<string, any> | null;
          ruku_start?: number | null;
          ruku_end?: number | null;
          ruku_count?: number | null;
          difficulty_level?: 'easy' | 'medium' | 'hard' | null;
          name?: string | null;
          description?: string | null;
          tags?: string[] | null;
          updated_at?: string;
        };
      };
      mistakes: {
        Row: {
          id: string;
          user_id: string;
          surah: number;
          ayah: number;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          surah: number;
          ayah: number;
          timestamp?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          surah?: number;
          ayah?: number;
          timestamp?: string;
          created_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          selected_reciter: string;
          hide_mistakes: boolean;
          last_page: number;
          arabic_font_size: number;
          translation_font_size: number;
          font_target_arabic: boolean;
          font_size: number;
          padding: number;
          layout_mode: 'single' | 'spread';
          selected_language: string;
          selected_translation: string;
          enable_tajweed: boolean;
          audio_loop_mode: string;
          audio_custom_loop: Record<string, any>;
          audio_playback_speed: number;
          show_word_by_word_tooltip: boolean;
          mobile_header_hidden: boolean;
          user_timezone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          selected_reciter?: string;
          hide_mistakes?: boolean;
          last_page?: number;
          arabic_font_size?: number;
          translation_font_size?: number;
          font_target_arabic?: boolean;
          font_size?: number;
          padding?: number;
          layout_mode?: 'single' | 'spread';
          selected_language?: string;
          selected_translation?: string;
          enable_tajweed?: boolean;
          audio_loop_mode?: string;
          audio_custom_loop?: Record<string, any>;
          audio_playback_speed?: number;
          show_word_by_word_tooltip?: boolean;
          mobile_header_hidden?: boolean;
          user_timezone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          selected_reciter?: string;
          hide_mistakes?: boolean;
          last_page?: number;
          arabic_font_size?: number;
          translation_font_size?: number;
          font_target_arabic?: boolean;
          font_size?: number;
          padding?: number;
          layout_mode?: 'single' | 'spread';
          selected_language?: string;
          selected_translation?: string;
          enable_tajweed?: boolean;
          audio_loop_mode?: string;
          audio_custom_loop?: Record<string, any>;
          audio_playback_speed?: number;
          show_word_by_word_tooltip?: boolean;
          mobile_header_hidden?: boolean;
          user_timezone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      storage_metadata: {
        Row: {
          id: string;
          user_id: string;
          last_sync: string;
          version: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          last_sync?: string;
          version?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          last_sync?: string;
          version?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      due_items: {
        Row: {
          id: string;
          user_id: string;
          surah: number;
          ayah_start: number;
          ayah_end: number;
          interval_days: number;
          next_review: string;
          ease_factor: number;
          review_count: number;
          last_reviewed: string | null;
          completed_today: string | null;
          created_at: string;
          memorization_age: number | null;
          individual_ratings: Record<string, any> | null;
          individual_recall_quality: Record<string, any> | null;
          ruku_start: number | null;
          ruku_end: number | null;
          ruku_count: number | null;
          difficulty_level: 'easy' | 'medium' | 'hard' | null;
          name: string | null;
          description: string | null;
          tags: string[] | null;
          updated_at: string;
          review_status: 'due' | 'upcoming' | 'future';
        };
      };
      recent_mistakes: {
        Row: {
          id: string;
          user_id: string;
          surah: number;
          ayah: number;
          timestamp: string;
          created_at: string;
          days_ago: number;
        };
      };
    };
  };
}