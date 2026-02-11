export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_suggestions: {
        Row: {
          created_at: string | null
          description: string
          id: string
          is_read: boolean | null
          priority: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          is_read?: boolean | null
          priority?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          is_read?: boolean | null
          priority?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_plans: {
        Row: {
          completed: boolean | null
          created_at: string | null
          date: string
          duration: number | null
          id: string
          measures: string | null
          note: string | null
          piece: string
          priority: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          date?: string
          duration?: number | null
          id?: string
          measures?: string | null
          note?: string | null
          piece: string
          priority?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          date?: string
          duration?: number | null
          id?: string
          measures?: string | null
          note?: string | null
          piece?: string
          priority?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_rankings: {
        Row: {
          current_song: string | null
          date: string
          grit_score: number | null
          id: string
          is_practicing: boolean | null
          net_practice_time: number | null
          practice_started_at: string | null
          rank: number | null
          user_id: string
        }
        Insert: {
          current_song?: string | null
          date?: string
          grit_score?: number | null
          id?: string
          is_practicing?: boolean | null
          net_practice_time?: number | null
          practice_started_at?: string | null
          rank?: number | null
          user_id: string
        }
        Update: {
          current_song?: string | null
          date?: string
          grit_score?: number | null
          id?: string
          is_practicing?: boolean | null
          net_practice_time?: number | null
          practice_started_at?: string | null
          rank?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_rankings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      designated_pieces: {
        Row: {
          category: string | null
          composer: string
          difficulty: string | null
          full_name: string
          id: string
          school_id: string
          title: string
        }
        Insert: {
          category?: string | null
          composer: string
          difficulty?: string | null
          full_name: string
          id?: string
          school_id: string
          title: string
        }
        Update: {
          category?: string | null
          composer?: string
          difficulty?: string | null
          full_name?: string
          id?: string
          school_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "designated_pieces_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      drill_cards: {
        Row: {
          action: string | null
          confidence: number | null
          created_at: string | null
          duration: number | null
          icon: string | null
          id: string
          measures: string | null
          recurrence: number | null
          song: string
          tempo: number | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action?: string | null
          confidence?: number | null
          created_at?: string | null
          duration?: number | null
          icon?: string | null
          id?: string
          measures?: string | null
          recurrence?: number | null
          song: string
          tempo?: number | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action?: string | null
          confidence?: number | null
          created_at?: string | null
          duration?: number | null
          icon?: string | null
          id?: string
          measures?: string | null
          recurrence?: number | null
          song?: string
          tempo?: number | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drill_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_requests: {
        Row: {
          accept_deadline: string | null
          accepted_at: string | null
          clarification_request: string | null
          clarification_response: string | null
          completed_at: string | null
          composer: string
          created_at: string | null
          credit_amount: number | null
          decline_reason: string | null
          description: string
          face_blurred: boolean | null
          id: string
          measure_end: number
          measure_start: number
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          piece: string
          problem_type: Database["public"]["Enums"]["problem_type"]
          sent_at: string | null
          status: Database["public"]["Enums"]["feedback_request_status"] | null
          student_id: string
          submit_deadline: string | null
          submitted_at: string | null
          teacher_id: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          accept_deadline?: string | null
          accepted_at?: string | null
          clarification_request?: string | null
          clarification_response?: string | null
          completed_at?: string | null
          composer: string
          created_at?: string | null
          credit_amount?: number | null
          decline_reason?: string | null
          description: string
          face_blurred?: boolean | null
          id?: string
          measure_end: number
          measure_start: number
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          piece: string
          problem_type: Database["public"]["Enums"]["problem_type"]
          sent_at?: string | null
          status?: Database["public"]["Enums"]["feedback_request_status"] | null
          student_id: string
          submit_deadline?: string | null
          submitted_at?: string | null
          teacher_id: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          accept_deadline?: string | null
          accepted_at?: string | null
          clarification_request?: string | null
          clarification_response?: string | null
          completed_at?: string | null
          composer?: string
          created_at?: string | null
          credit_amount?: number | null
          decline_reason?: string | null
          description?: string
          face_blurred?: boolean | null
          id?: string
          measure_end?: number
          measure_start?: number
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          piece?: string
          problem_type?: Database["public"]["Enums"]["problem_type"]
          sent_at?: string | null
          status?: Database["public"]["Enums"]["feedback_request_status"] | null
          student_id?: string
          submit_deadline?: string | null
          submitted_at?: string | null
          teacher_id?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_requests_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      feedbacks: {
        Row: {
          comments: Json
          demo_video_url: string | null
          id: string
          practice_card: Json | null
          request_id: string
          submitted_at: string | null
        }
        Insert: {
          comments?: Json
          demo_video_url?: string | null
          id?: string
          practice_card?: Json | null
          request_id: string
          submitted_at?: string | null
        }
        Update: {
          comments?: Json
          demo_video_url?: string | null
          id?: string
          practice_card?: Json | null
          request_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "feedback_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      piece_analyses: {
        Row: {
          analyzed_at: string | null
          common_mistakes: string[] | null
          estimated_duration: number | null
          form: string | null
          id: string
          key_signature: string | null
          overall_difficulty: Database["public"]["Enums"]["difficulty_level"] | null
          piece_id: string
          practice_recommendations: string[] | null
          sections: Json
          time_signature: string | null
          total_measures: number
        }
        Insert: {
          analyzed_at?: string | null
          common_mistakes?: string[] | null
          estimated_duration?: number | null
          form?: string | null
          id?: string
          key_signature?: string | null
          overall_difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          piece_id: string
          practice_recommendations?: string[] | null
          sections?: Json
          time_signature?: string | null
          total_measures: number
        }
        Update: {
          analyzed_at?: string | null
          common_mistakes?: string[] | null
          estimated_duration?: number | null
          form?: string | null
          id?: string
          key_signature?: string | null
          overall_difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          piece_id?: string
          practice_recommendations?: string[] | null
          sections?: Json
          time_signature?: string | null
          total_measures?: number
        }
        Relationships: [
          {
            foreignKeyName: "piece_analyses_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
        ]
      }
      piece_practice_data: {
        Row: {
          average_accuracy: number | null
          completion_percentage: number | null
          id: string
          last_practiced_at: string | null
          measure_progress: Json | null
          piece_id: string
          session_count: number | null
          total_practice_time: number | null
          user_id: string
        }
        Insert: {
          average_accuracy?: number | null
          completion_percentage?: number | null
          id?: string
          last_practiced_at?: string | null
          measure_progress?: Json | null
          piece_id: string
          session_count?: number | null
          total_practice_time?: number | null
          user_id: string
        }
        Update: {
          average_accuracy?: number | null
          completion_percentage?: number | null
          id?: string
          last_practiced_at?: string | null
          measure_progress?: Json | null
          piece_id?: string
          session_count?: number | null
          total_practice_time?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "piece_practice_data_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_practice_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pieces: {
        Row: {
          analysis_status: Database["public"]["Enums"]["analysis_status"] | null
          composer_full_name: string
          composer_nationality: string | null
          composer_short_name: string
          created_at: string | null
          id: string
          key: string | null
          movement: number | null
          movement_title: string | null
          nickname: string | null
          opus: string | null
          title: string
        }
        Insert: {
          analysis_status?: Database["public"]["Enums"]["analysis_status"] | null
          composer_full_name: string
          composer_nationality?: string | null
          composer_short_name: string
          created_at?: string | null
          id?: string
          key?: string | null
          movement?: number | null
          movement_title?: string | null
          nickname?: string | null
          opus?: string | null
          title: string
        }
        Update: {
          analysis_status?: Database["public"]["Enums"]["analysis_status"] | null
          composer_full_name?: string
          composer_nationality?: string | null
          composer_short_name?: string
          created_at?: string | null
          id?: string
          key?: string | null
          movement?: number | null
          movement_title?: string | null
          nickname?: string | null
          opus?: string | null
          title?: string
        }
        Relationships: []
      }
      practice_sessions: {
        Row: {
          audio_url: string | null
          composer: string | null
          created_at: string | null
          end_time: string
          id: number
          label: string | null
          measure_end: number | null
          measure_start: number | null
          piece_id: string | null
          piece_name: string
          practice_time: number
          practice_type: Database["public"]["Enums"]["practice_type"] | null
          start_time: string
          synced: boolean | null
          todo_note: string | null
          total_time: number
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          composer?: string | null
          created_at?: string | null
          end_time: string
          id?: number
          label?: string | null
          measure_end?: number | null
          measure_start?: number | null
          piece_id?: string | null
          piece_name: string
          practice_time: number
          practice_type?: Database["public"]["Enums"]["practice_type"] | null
          start_time: string
          synced?: boolean | null
          todo_note?: string | null
          total_time: number
          user_id: string
        }
        Update: {
          audio_url?: string | null
          composer?: string | null
          created_at?: string | null
          end_time?: string
          id?: number
          label?: string | null
          measure_end?: number | null
          measure_start?: number | null
          piece_id?: string | null
          piece_name?: string
          practice_time?: number
          practice_type?: Database["public"]["Enums"]["practice_type"] | null
          start_time?: string
          synced?: boolean | null
          todo_note?: string | null
          total_time?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_todos: {
        Row: {
          completed_at: string | null
          completed_repetitions: number | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          measure_end: number
          measure_start: number
          note: string | null
          song_id: string | null
          song_title: string
          sort_order: number | null
          target_repetitions: number | null
          target_tempo: number | null
          technique: Database["public"]["Enums"]["technique_type"] | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_repetitions?: number | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          measure_end: number
          measure_start: number
          note?: string | null
          song_id?: string | null
          song_title: string
          sort_order?: number | null
          target_repetitions?: number | null
          target_tempo?: number | null
          technique?: Database["public"]["Enums"]["technique_type"] | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_repetitions?: number | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          measure_end?: number
          measure_start?: number
          note?: string | null
          song_id?: string | null
          song_title?: string
          sort_order?: number | null
          target_repetitions?: number | null
          target_tempo?: number | null
          technique?: Database["public"]["Enums"]["technique_type"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_todos_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_todos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          current_piece: string | null
          daily_goal: number | null
          grit_score: number | null
          id: string
          instrument: Database["public"]["Enums"]["instrument_type"]
          level: string | null
          name: string | null
          nickname: string
          streak_days: number | null
          total_practice_hours: number | null
          updated_at: string | null
          weekly_goal: number | null
        }
        Insert: {
          created_at?: string | null
          current_piece?: string | null
          daily_goal?: number | null
          grit_score?: number | null
          id: string
          instrument?: Database["public"]["Enums"]["instrument_type"]
          level?: string | null
          name?: string | null
          nickname: string
          streak_days?: number | null
          total_practice_hours?: number | null
          updated_at?: string | null
          weekly_goal?: number | null
        }
        Update: {
          created_at?: string | null
          current_piece?: string | null
          daily_goal?: number | null
          grit_score?: number | null
          id?: string
          instrument?: Database["public"]["Enums"]["instrument_type"]
          level?: string | null
          name?: string | null
          nickname?: string
          streak_days?: number | null
          total_practice_hours?: number | null
          updated_at?: string | null
          weekly_goal?: number | null
        }
        Relationships: []
      }
      recordings: {
        Row: {
          audio_url: string | null
          created_at: string | null
          date: string
          duration: number
          dynamics: Json | null
          focus_areas: Json | null
          id: string
          improvement: string | null
          piece_title: string
          rhythm: Json | null
          score: number | null
          tempo: Json | null
          user_id: string
          waveform: Json | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          date?: string
          duration: number
          dynamics?: Json | null
          focus_areas?: Json | null
          id?: string
          improvement?: string | null
          piece_title: string
          rhythm?: Json | null
          score?: number | null
          tempo?: Json | null
          user_id: string
          waveform?: Json | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          date?: string
          duration?: number
          dynamics?: Json | null
          focus_areas?: Json | null
          id?: string
          improvement?: string | null
          piece_title?: string
          rhythm?: Json | null
          score?: number | null
          tempo?: Json | null
          user_id?: string
          waveform?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "recordings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      room_memberships: {
        Row: {
          id: string
          joined_at: string | null
          room_id: string
          uploaded_free_pieces: Json | null
          uploaded_piece_ids: string[] | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          room_id: string
          uploaded_free_pieces?: Json | null
          uploaded_piece_ids?: string[] | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          room_id?: string
          uploaded_free_pieces?: Json | null
          uploaded_piece_ids?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_memberships_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      room_videos: {
        Row: {
          duration: number | null
          face_blurred: boolean | null
          helpful_count: number | null
          id: string
          piece_composer: string
          piece_id: string | null
          piece_title: string
          room_id: string
          section: string | null
          tags: string[] | null
          uploaded_at: string | null
          user_id: string
          user_name: string | null
          video_url: string | null
        }
        Insert: {
          duration?: number | null
          face_blurred?: boolean | null
          helpful_count?: number | null
          id?: string
          piece_composer: string
          piece_id?: string | null
          piece_title: string
          room_id: string
          section?: string | null
          tags?: string[] | null
          uploaded_at?: string | null
          user_id: string
          user_name?: string | null
          video_url?: string | null
        }
        Update: {
          duration?: number | null
          face_blurred?: boolean | null
          helpful_count?: number | null
          id?: string
          piece_composer?: string
          piece_id?: string | null
          piece_title?: string
          room_id?: string
          section?: string | null
          tags?: string[] | null
          uploaded_at?: string | null
          user_id?: string
          user_name?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_videos_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "designated_pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_videos_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string | null
          id: string
          member_count: number | null
          school_id: string
          video_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          member_count?: number | null
          school_id: string
          video_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          member_count?: number | null
          school_id?: string
          video_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string | null
          deadline: string | null
          id: string
          name: string
          short_name: string
          type: Database["public"]["Enums"]["school_type"]
          year: number
        }
        Insert: {
          created_at?: string | null
          deadline?: string | null
          id?: string
          name: string
          short_name: string
          type: Database["public"]["Enums"]["school_type"]
          year: number
        }
        Update: {
          created_at?: string | null
          deadline?: string | null
          id?: string
          name?: string
          short_name?: string
          type?: Database["public"]["Enums"]["school_type"]
          year?: number
        }
        Relationships: []
      }
      song_analyses: {
        Row: {
          composer: string
          content: Json
          created_at: string | null
          difficulty_level: string | null
          id: string
          key: string | null
          opus: string | null
          title: string
          updated_at: string | null
          verification_status: string | null
        }
        Insert: {
          composer: string
          content: Json
          created_at?: string | null
          difficulty_level?: string | null
          id?: string
          key?: string | null
          opus?: string | null
          title: string
          updated_at?: string | null
          verification_status?: string | null
        }
        Update: {
          composer?: string
          content?: Json
          created_at?: string | null
          difficulty_level?: string | null
          id?: string
          key?: string | null
          opus?: string | null
          title?: string
          updated_at?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      songs: {
        Row: {
          composer: string | null
          created_at: string | null
          duration: string | null
          id: string
          last_practiced_at: string | null
          opus: string | null
          title: string
          user_id: string
        }
        Insert: {
          composer?: string | null
          created_at?: string | null
          duration?: string | null
          id?: string
          last_practiced_at?: string | null
          opus?: string | null
          title: string
          user_id: string
        }
        Update: {
          composer?: string | null
          created_at?: string | null
          duration?: string | null
          id?: string
          last_practiced_at?: string | null
          opus?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "songs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          avg_response_time: number | null
          badges: Database["public"]["Enums"]["teacher_badge"][] | null
          bio: string | null
          career: Json | null
          completed_count: number | null
          created_at: string | null
          id: string
          name: string
          price_credits: number | null
          profile_image: string | null
          rating: number | null
          response_rate: number | null
          review_count: number | null
          specialty: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          avg_response_time?: number | null
          badges?: Database["public"]["Enums"]["teacher_badge"][] | null
          bio?: string | null
          career?: Json | null
          completed_count?: number | null
          created_at?: string | null
          id?: string
          name: string
          price_credits?: number | null
          profile_image?: string | null
          rating?: number | null
          response_rate?: number | null
          review_count?: number | null
          specialty?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          avg_response_time?: number | null
          badges?: Database["public"]["Enums"]["teacher_badge"][] | null
          bio?: string | null
          career?: Json | null
          completed_count?: number | null
          created_at?: string | null
          id?: string
          name?: string
          price_credits?: number | null
          profile_image?: string | null
          rating?: number | null
          response_rate?: number | null
          review_count?: number | null
          specialty?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_data: {
        Row: {
          completed: boolean | null
          date: string
          day_of_week: number
          id: string
          minutes: number | null
          target: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          date: string
          day_of_week: number
          id?: string
          minutes?: number | null
          target?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          date?: string
          day_of_week?: number
          id?: string
          minutes?: number | null
          target?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_data_user_id_fkey"
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
      [_ in never]: never
    }
    Enums: {
      analysis_status: "completed" | "pending" | "failed"
      difficulty_level: "easy" | "medium" | "hard" | "very_hard"
      feedback_request_status:
        | "DRAFT"
        | "HELD"
        | "SENT"
        | "ACCEPTED"
        | "DECLINED"
        | "EXPIRED"
        | "SUBMITTED"
        | "COMPLETED"
        | "DISPUTED"
        | "REFUNDED"
      instrument_type:
        | "piano"
        | "violin"
        | "cello"
        | "flute"
        | "clarinet"
        | "guitar"
        | "vocal"
      payment_status: "pending" | "held" | "released" | "refunded"
      practice_type: "partial" | "routine" | "runthrough"
      problem_type:
        | "rhythm"
        | "tempo"
        | "hands"
        | "pedal"
        | "voicing"
        | "technique"
        | "expression"
        | "other"
      school_type: "designated" | "free"
      teacher_badge: "expert" | "fast" | "top_rated"
      technique_type:
        | "dotted"
        | "staccato"
        | "legato"
        | "octave"
        | "arpeggio"
        | "scale"
        | "trill"
        | "dynamics"
        | "pedal"
        | "rhythm"
        | "other"
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
