
-- Drop existing tables if they exist to start fresh
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


-- Create ENUM for user roles
CREATE TYPE "user_role" AS ENUM ('admin', 'host', 'user');

-- Create Users table
CREATE TABLE "users" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "full_name" text,
    "avatar_url" text,
    "email" text UNIQUE,
    "phone" text UNIQUE,
    "password" text, -- Note: Storing plain text passwords is not secure for production. Use hashed passwords.
    "role" user_role DEFAULT 'user'
);

-- Create Properties table
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
    "dedicated_for" text NOT NULL,
    "dedicated_for_en" text NOT NULL,
    "guests" integer NOT NULL,
    "bedrooms" integer NOT NULL,
    "bathrooms" integer NOT NULL,
    "lounges" integer,
    "amenities" text[],
    "booking_system" text NOT NULL,
    "price_per_night" real NOT NULL,
    "currency" text NOT NULL,
    "morning_period" jsonb,
    "evening_period" jsonb,
    "description" text,
    "description_en" text,
    "discount_codes" jsonb,
    "images" text[],
    "coordinates" jsonb,
    "is_active" boolean DEFAULT true NOT NULL,
    "allow_reschedule" boolean DEFAULT true NOT NULL,
    "cancellation_policy" text,
    "cancellation_policy_en" text,
    "rating" real DEFAULT 0 NOT NULL,
    "review_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create Bookings table
CREATE TABLE "bookings" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "guest_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "property_id" uuid NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE,
    "host_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
    "booking_date" text NOT NULL,
    "period" text NOT NULL,
    "price" real NOT NULL,
    "service_fee" real NOT NULL,
    "total_amount" real NOT NULL,
    "currency" text NOT NULL,
    "status" text DEFAULT 'pending' NOT NULL,
    "payment_proof_url" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create Reviews table
CREATE TABLE "reviews" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "property_id" uuid NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE,
    "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "property_host_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
    "rating" real NOT NULL,
    "comment" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create Bank Accounts table
CREATE TABLE "bank_accounts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "bank_name" text NOT NULL,
    "account_holder" text NOT NULL,
    "account_number" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create Wishlists table
CREATE TABLE "wishlists" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create Wishlist Items table
CREATE TABLE "wishlist_items" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "wishlist_id" uuid NOT NULL REFERENCES "wishlists"("id") ON DELETE CASCADE,
    "property_id" uuid NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE("wishlist_id", "property_id")
);

-- Create Cancellation Requests table
CREATE TABLE "cancellation_requests" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "booking_id" uuid NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
    "guest_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "host_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
    "property_id" uuid NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE,
    "status" text DEFAULT 'pending' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create Reschedule Requests table
CREATE TABLE "reschedule_requests" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "booking_id" uuid NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
    "guest_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "host_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
    "property_id" uuid NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE,
    "new_date" text NOT NULL,
    "new_period" text NOT NULL,
    "status" text DEFAULT 'pending' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS Policies
-- Add your RLS policies here if needed for production, for example:
-- ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view active properties" ON properties FOR SELECT USING (is_active = true);
