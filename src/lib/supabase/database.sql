-- ChaletSpot Database Schema
-- Version 1.1

-- ========== EXTENSIONS ==========
-- Enable UUID generation
create extension if not exists "uuid-ossp" with schema "extensions";

-- ========== TYPES ==========
-- Define custom types (enums) to ensure data consistency.
drop type if exists "public"."user_role" cascade;
create type "public"."user_role" as enum ('user', 'host', 'admin');

drop type if exists "public"."booking_type" cascade;
create type "public"."booking_type" as enum ('platform', 'manual', 'blocked');

-- ========== TABLES ==========

-- 1. USERS
-- Stores public user information. The actual auth user is in auth.users.
create table if not exists "public"."users" (
    "id" uuid not null,
    "full_name" text,
    "avatar_url" text,
    "phone" text unique,
    "email" text unique,
    "role" public.user_role default 'user',
    "password" text, -- In a real app, this should be a hashed value. For this project, it's stored as plain text.
    primary key ("id")
);
comment on table "public"."users" is 'Public profile data for each user.';

-- 2. PROPERTIES
-- Stores all details about the properties (chalets, pools, etc.).
create table if not exists "public"."properties" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "host_id" uuid not null references "public"."users" on delete cascade,
    "title" text not null,
    "title_en" text,
    "description" text,
    "description_en" text,
    "type" text not null,
    "type_en" text,
    "location" text not null,
    "location_en" text,
    "governorate" text not null,
    "city" text not null,
    "area" numeric,
    "coordinates" jsonb, -- { "lat": 15.3694, "lng": 44.1910 }
    "price_per_night" numeric not null,
    "currency" text not null default 'SAR',
    "guests" integer not null default 1,
    "bedrooms" integer not null default 0,
    "bathrooms" integer not null default 0,
    "lounges" integer,
    "amenities" text[], -- e.g., ARRAY['wifi', 'pool']
    "images" text[],
    "dedicated_for" text, -- For Families, Singles, Both
    "dedicated_for_en" text,
    "is_active" boolean not null default false,
    "booking_system" text not null,
    "morning_period" jsonb, -- { "checkIn": "08:00", "checkOut": "18:00", "price": 500 }
    "evening_period" jsonb, -- { "checkIn": "20:00", "checkOut": "06:00", "price": 450 }
    "discount_codes" jsonb, -- Storing as a single JSON object which is an array
    "has_deposit" boolean not null default false,
    "deposit_amount" numeric,
    "cancellation_policy" text,
    "cancellation_policy_en" text,
    "allow_reschedule" boolean not null default true,
    "rating" numeric not null default 0,
    "review_count" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    primary key ("id")
);
-- Add indexes for faster queries
create index if not exists "properties_host_id_idx" on "public"."properties" ("host_id");
create index if not exists "properties_is_active_idx" on "public"."properties" ("is_active");
create index if not exists "properties_location_idx" on "public"."properties" ("governorate", "city");


-- 3. BOOKINGS
-- Records all bookings made by users.
create table if not exists "public"."bookings" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "guest_id" uuid references "public"."users" on delete set null,
    "host_id" uuid references "public"."users" on delete set null,
    "property_id" uuid not null references "public"."properties" on delete cascade,
    "booking_date" date not null,
    "period" text not null,
    "status" text not null default 'pending',
    "price" numeric,
    "total_amount" numeric,
    "currency" text,
    "service_fee" numeric,
    "payment_proof_url" text,
    "type" public.booking_type not null default 'platform',
    "guest_details" jsonb, -- For manual bookings: { "name": "John Doe", "phone": "123456789" }
    "created_at" timestamp with time zone not null default now(),
    primary key ("id")
);
-- Add indexes for faster queries
create index if not exists "bookings_guest_id_idx" on "public"."bookings" ("guest_id");
create index if not exists "bookings_property_id_idx" on "public"."bookings" ("property_id");
create index if not exists "bookings_host_id_idx" on "public"."bookings" ("host_id");


-- 4. REVIEWS
-- Stores user reviews for properties.
create table if not exists "public"."reviews" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "author_id" uuid not null references "public"."users" on delete cascade,
    "property_id" uuid not null references "public"."properties" on delete cascade,
    "property_host_id" uuid references "public"."users" on delete set null,
    "booking_id" uuid unique references "public"."bookings" on delete set null,
    "rating" smallint not null check (rating >= 1 and rating <= 5),
    "comment" text,
    "created_at" timestamp with time zone not null default now(),
    primary key ("id")
);
-- Add indexes for faster queries
create index if not exists "reviews_property_id_idx" on "public"."reviews" ("property_id");
create index if not exists "reviews_author_id_idx" on "public"."reviews" ("author_id");


-- 5. WISHLISTS
create table if not exists "public"."wishlists" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null unique references "public"."users" on delete cascade,
    "created_at" timestamp with time zone not null default now(),
    primary key ("id")
);

create table if not exists "public"."wishlist_items" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "wishlist_id" uuid not null references "public"."wishlists" on delete cascade,
    "property_id" uuid not null references "public"."properties" on delete cascade,
    "created_at" timestamp with time zone not null default now(),
    primary key ("id"),
    unique ("wishlist_id", "property_id")
);

-- 6. BANK ACCOUNTS
create table if not exists "public"."bank_accounts" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null references "public"."users" on delete cascade,
    "bank_name" text not null,
    "account_holder" text not null,
    "account_number" text not null,
    "created_at" timestamp with time zone not null default now(),
    primary key ("id")
);
create index if not exists "bank_accounts_user_id_idx" on "public"."bank_accounts" ("user_id");

-- 7. CANCELLATION & RESCHEDULE REQUESTS
create table if not exists "public"."cancellation_requests" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "booking_id" uuid not null references "public"."bookings" on delete cascade,
    "property_id" uuid not null references "public"."properties" on delete cascade,
    "guest_id" uuid not null references "public"."users" on delete cascade,
    "host_id" uuid references "public"."users" on delete set null,
    "status" text not null default 'pending',
    "created_at" timestamp with time zone not null default now(),
    primary key ("id")
);

create table if not exists "public"."reschedule_requests" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "booking_id" uuid not null references "public"."bookings" on delete cascade,
    "property_id" uuid not null references "public"."properties" on delete cascade,
    "guest_id" uuid not null references "public"."users" on delete cascade,
    "host_id" uuid references "public"."users" on delete set null,
    "new_date" date not null,
    "new_period" text not null,
    "status" text not null default 'pending',
    "created_at" timestamp with time zone not null default now(),
    primary key ("id")
);

-- RLS policies will be managed via Supabase UI or a separate script for security.
-- Ensure to enable RLS for all tables and set appropriate policies.
-- Example: alter table public.properties enable row level security;

    