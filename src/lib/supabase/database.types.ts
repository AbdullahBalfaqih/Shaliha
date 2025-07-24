
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
      bank_accounts: {
        Row: {
          account_holder: string
          account_number: string
          bank_name: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          account_holder: string
          account_number: string
          bank_name: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          account_holder?: string
          account_number?: string
          bank_name?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          created_at: string
          currency: string | null
          guest_details: Json | null
          guest_id: string | null
          host_id: string | null
          id: string
          payment_proof_url: string | null
          period: string
          price: number | null
          property_id: string
          service_fee: number | null
          status: string
          total_amount: number | null
          type: Database["public"]["Enums"]["booking_type"]
        }
        Insert: {
          booking_date: string
          created_at?: string
          currency?: string | null
          guest_details?: Json | null
          guest_id?: string | null
          host_id?: string | null
          id?: string
          payment_proof_url?: string | null
          period: string
          price?: number | null
          property_id: string
          service_fee?: number | null
          status?: string
          total_amount?: number | null
          type?: Database["public"]["Enums"]["booking_type"]
        }
        Update: {
          booking_date?: string
          created_at?: string
          currency?: string | null
          guest_details?: Json | null
          guest_id?: string | null
          host_id?: string | null
          id?: string
          payment_proof_url?: string | null
          period?: string
          price?: number | null
          property_id?: string
          service_fee?: number | null
          status?: string
          total_amount?: number | null
          type?: Database["public"]["Enums"]["booking_type"]
        }
        Relationships: [
          {
            foreignKeyName: "bookings_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellation_requests: {
        Row: {
          booking_id: string
          created_at: string
          guest_id: string
          host_id: string | null
          id: string
          property_id: string
          status: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          guest_id: string
          host_id?: string | null
          id?: string
          property_id: string
          status?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          guest_id?: string
          host_id?: string | null
          id?: string
          property_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cancellation_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellation_requests_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellation_requests_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellation_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          guest_id: string
          host_id: string
          id: string
          property_id: string
        }
        Insert: {
          created_at?: string
          guest_id: string
          host_id: string
          id?: string
          property_id: string
        }
        Update: {
          created_at?: string
          guest_id?: string
          host_id?: string
          id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          allow_reschedule: boolean
          amenities: string[] | null
          area: number | null
          bathrooms: number
          bedrooms: number
          booking_system: string
          cancellation_policy: string | null
          cancellation_policy_en: string | null
          city: string
          coordinates: Json | null
          created_at: string
          currency: string
          dedicated_for: Database["public"]["Enums"]["property_dedicated_for"]
          dedicated_for_en: string
          description: string | null
          description_en: string | null
          discount_codes: Json | null
          deposit_amount: number | null
          has_deposit: boolean
          evening_period: Json | null
          governorate: string
          guests: number
          host_id: string
          id: string
          images: string[] | null
          is_active: boolean
          location: string
          location_en: string
          lounges: number | null
          morning_period: Json | null
          price_per_night: number
          rating: number
          review_count: number
          title: string
          title_en: string
          type: Database["public"]["Enums"]["property_type"]
          type_en: string
        }
        Insert: {
          allow_reschedule?: boolean
          amenities?: string[] | null
          area?: number | null
          bathrooms: number
          bedrooms: number
          booking_system: string
          cancellation_policy?: string | null
          cancellation_policy_en?: string | null
          city: string
          coordinates?: Json | null
          created_at?: string
          currency: string
          dedicated_for: Database["public"]["Enums"]["property_dedicated_for"]
          dedicated_for_en: string
          description?: string | null
          description_en?: string | null
          discount_codes?: Json | null
          deposit_amount?: number | null
          has_deposit?: boolean
          evening_period?: Json | null
          governorate: string
          guests: number
          host_id: string
          id?: string
          images?: string[] | null
          is_active?: boolean
          location: string
          location_en: string
          lounges?: number | null
          morning_period?: Json | null
          price_per_night: number
          rating?: number
          review_count?: number
          title: string
          title_en: string
          type: Database["public"]["Enums"]["property_type"]
          type_en: string
        }
        Update: {
          allow_reschedule?: boolean
          amenities?: string[] | null
          area?: number | null
          bathrooms?: number
          bedrooms?: number
          booking_system?: string
          cancellation_policy?: string | null
          cancellation_policy_en?: string | null
          city?: string
          coordinates?: Json | null
          created_at?: string
          currency?: string
          dedicated_for?: Database["public"]["Enums"]["property_dedicated_for"]
          dedicated_for_en?: string
          description?: string | null
          description_en?: string | null
          discount_codes?: Json | null
          deposit_amount?: number | null
          has_deposit?: boolean
          evening_period?: Json | null
          governorate?: string
          guests?: number
          host_id?: string
          id?: string
          images?: string[] | null
          is_active?: boolean
          location?: string
          location_en?: string
          lounges?: number | null
          morning_period?: Json | null
          price_per_night?: number
          rating?: number
          review_count?: number
          title?: string
          title_en?: string
          type?: Database["public"]["Enums"]["property_type"]
          type_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reschedule_requests: {
        Row: {
          booking_id: string
          created_at: string
          guest_id: string
          host_id: string | null
          id: string
          new_date: string
          new_period: string
          property_id: string
          status: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          guest_id: string
          host_id?: string | null
          id?: string
          new_date: string
          new_period: string
          property_id: string
          status?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          guest_id?: string
          host_id?: string | null
          id?: string
          new_date?: string
          new_period?: string
          property_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reschedule_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reschedule_requests_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reschedule_requests_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reschedule_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_id: string
          booking_id: string | null
          comment: string | null
          created_at: string
          id: string
          property_host_id: string | null
          property_id: string
          rating: number
        }
        Insert: {
          author_id: string
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          property_host_id?: string | null
          property_id: string
          rating: number
        }
        Update: {
          author_id?: string
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          property_host_id?: string | null
          property_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_property_host_id_fkey"
            columns: ["property_host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          email: string | null
          full_name: string | null
          id: string
          password: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          password?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          password?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          property_id: string
          wishlist_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          wishlist_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
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
      booking_type: "platform" | "manual" | "blocked"
      user_role: "admin" | "host" | "user"
      property_type: "شاليه" | "مسبح" | "مزرعة" | "فيلا" | "شقة"
      property_dedicated_for: "عوائل" | "عزاب" | "كلاهما"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
