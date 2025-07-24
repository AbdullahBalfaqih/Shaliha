-- Drop existing tables in reverse order of dependency to ensure clean setup
DROP TABLE IF EXISTS "reviews" CASCADE;
DROP TABLE IF EXISTS "cancellation_requests" CASCADE;
DROP TABLE IF EXISTS "reschedule_requests" CASCADE;
DROP TABLE IF EXISTS "bookings" CASCADE;
DROP TABLE IF EXISTS "wishlist_items" CASCADE;
DROP TABLE IF EXISTS "wishlists" CASCADE;
DROP TABLE IF EXISTS "bank_accounts" CASCADE;
DROP TABLE IF EXISTS "properties" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TYPE IF EXISTS "user_role";

-- Create custom types (Enums)
CREATE TYPE "user_role" AS ENUM ('admin', 'host', 'user');

-- Create users table
-- This table stores user information for all roles.
CREATE TABLE "users" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "full_name" text,
    "email" text UNIQUE,
    "phone" text UNIQUE NOT NULL,
    "password" text NOT NULL, -- Note: Storing plain text passwords is not secure for production.
    "role" user_role DEFAULT 'user',
    "avatar_url" text
);

-- Create properties table
-- Stores all details about the chalets, pools, etc.
CREATE TABLE "properties" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "host_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "title" text NOT NULL,
    "title_en" text NOT NULL,
    "type" text NOT NULL,
    "type_en" text NOT NULL,
    "governorate" text NOT NULL,
    "city" text NOT NULL,
    "location" text NOT NULL,
    "location_en" text NOT NULL,
    "area" real,
    "guests" integer NOT NULL,
    "bedrooms" integer NOT NULL,
    "bathrooms" integer NOT NULL,
    "lounges" integer,
    "description" text,
    "description_en" text,
    "images" text[],
    "amenities" text[],
    "price_per_night" real NOT NULL,
    "currency" text NOT NULL,
    "rating" real NOT NULL DEFAULT 0,
    "review_count" integer NOT NULL DEFAULT 0,
    "dedicated_for" text NOT NULL,
    "dedicated_for_en" text NOT NULL,
    "booking_system" text NOT NULL,
    "morning_period" jsonb,
    "evening_period" jsonb,
    "is_active" boolean NOT NULL DEFAULT false,
    "cancellation_policy" text,
    "cancellation_policy_en" text,
    "allow_reschedule" boolean NOT NULL DEFAULT true,
    "coordinates" jsonb,
    "discount_codes" jsonb,
    "created_at" timestamp with time zone DEFAULT now()
);

-- Create bookings table
-- Stores booking information, linking users and properties.
CREATE TABLE "bookings" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "guest_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "property_id" uuid NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE, -- This defines the relationship
    "host_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
    "booking_date" date NOT NULL,
    "period" text NOT NULL,
    "price" real NOT NULL,
    "service_fee" real NOT NULL,
    "total_amount" real NOT NULL,
    "currency" text NOT NULL,
    "status" text NOT NULL DEFAULT 'pending',
    "payment_proof_url" text,
    "created_at" timestamp with time zone DEFAULT now()
);

-- Create reviews table
CREATE TABLE "reviews" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "property_id" uuid NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE,
    "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "rating" real NOT NULL,
    "comment" text,
    "created_at" timestamp with time zone DEFAULT now()
);

-- Create wishlists and wishlist_items tables
CREATE TABLE "wishlists" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "wishlist_items" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "wishlist_id" uuid NOT NULL REFERENCES "wishlists"("id") ON DELETE CASCADE,
    "property_id" uuid NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT now()
);

-- Create bank_accounts table
CREATE TABLE "bank_accounts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "bank_name" text NOT NULL,
    "account_holder" text NOT NULL,
    "account_number" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now()
);

-- Create cancellation_requests table
CREATE TABLE "cancellation_requests" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "booking_id" uuid NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
    "guest_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "property_id" uuid NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE,
    "host_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
    "status" text NOT NULL DEFAULT 'pending',
    "created_at" timestamp with time zone DEFAULT now()
);

-- Create reschedule_requests table
CREATE TABLE "reschedule_requests" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "booking_id" uuid NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
    "guest_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "property_id" uuid NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE,
    "host_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
    "new_date" date NOT NULL,
    "new_period" text NOT NULL,
    "status" text NOT NULL DEFAULT 'pending',
    "created_at" timestamp with time zone DEFAULT now()
);
