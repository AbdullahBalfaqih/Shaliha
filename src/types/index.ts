
import type { Database } from "@/lib/supabase/database.types";

export type Amenity = 
  | "wifi" 
  | "pool" 
  | "kitchen" 
  | "parking" 
  | "ac"
  | "tv"
  | "power_backup"
  | "speakers"
  | "bbq";

export type Review = Database['public']['Tables']['reviews']['Row'] & {
  author: Pick<Database['public']['Tables']['users']['Row'], 'full_name' | 'avatar_url'> | null,
  properties: Pick<Database['public']['Tables']['properties']['Row'], 'title'> | null,
};

export interface Host {
    name: string;
    avatar: string;
}

export interface Coordinates {
    lat: number;
    lng: number;
}

export type DedicatedFor = "عوائل" | "عزاب" | "كلاهما";
export type DedicatedForEn = "Families" | "Singles" | "Both";

export interface DiscountCode {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
}

export type BookingSystem = "single_period" | "dual_period";
export type BookingPeriod = "morning" | "evening" | "full_day";

export interface PeriodDetails {
  checkIn: string;
  checkOut: string;
  price: number;
}

export interface BookedDate {
  date: string; // "YYYY-MM-DD"
  periods: BookingPeriod[]; // ["morning"], ["evening"], or ["morning", "evening"]
}

export type Currency = "SAR" | "YER";


export interface Property {
  id: string;
  title: string;
  title_en: string;
  type: "شاليه" | "مسبح" | "مزرعة" | "فيلا" | "شقة";
  type_en: "Chalet" | "Pool" | "Farm" | "Villa" | "Apartment";
  location: string;
  location_en: string;
  price_per_night: number; // For single period
  currency: Currency;
  rating: number;
  review_count: number;
  guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: Amenity[];
  images: string[];
  description: string;
  description_en: string;
  reviews: Review[];
  host: Host;
  coordinates: Coordinates;
  dedicatedFor: DedicatedFor;
  dedicatedFor_en: DedicatedForEn;
  discount_codes?: DiscountCode[];
  
  booking_system: BookingSystem;
  morning_period?: PeriodDetails;
  evening_period?: PeriodDetails;
  bookedDates?: BookedDate[];
  
  has_deposit: boolean;
  deposit_amount: number | null;
  cancellation_policy?: string;
  cancellation_policy_en?: string;
  allow_reschedule?: boolean;
  is_active: boolean;
  host_id: string;
  lounges?: number;
}

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed';

export type Booking = Database['public']['Tables']['bookings']['Row'] & {
    properties: Pick<Database['public']['Tables']['properties']['Row'], 'title' | 'id' | 'images' | 'location' | 'allow_reschedule' | 'host_id'>;
    guest: Pick<Database['public']['Tables']['users']['Row'], 'full_name' | 'phone'>;
    reviews: { id: string }[];
};

export type CancellationRequest = Database['public']['Tables']['cancellation_requests']['Row'] & {
    properties: Pick<Database['public']['Tables']['properties']['Row'], 'title'> | null;
    guest: Pick<Database['public']['Tables']['users']['Row'], 'full_name' | 'phone'> | null;
};

export type RescheduleRequest = Database['public']['Tables']['reschedule_requests']['Row'] & {
    properties: Pick<Database['public']['Tables']['properties']['Row'], 'title'> | null;
    guest: Pick<Database['public']['Tables']['users']['Row'], 'full_name' | 'phone'> | null;
};

    