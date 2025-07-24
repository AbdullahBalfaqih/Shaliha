-- ChaletSpot Database Migration Script
-- Version 1.0 to 1.1
-- This script modifies the existing database schema to add new features
-- like deposits, manual bookings, and custom cancellation policies.

-- Note: Always back up your database before running a migration script.

BEGIN;

-- ========== MODIFY ENUMS ==========
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_type') THEN
        CREATE TYPE "public"."booking_type" AS ENUM ('platform', 'manual', 'blocked');
    ELSE
        -- Add new values to existing enum. This is safer than dropping and recreating.
        ALTER TYPE "public"."booking_type" ADD VALUE IF NOT EXISTS 'platform';
        ALTER TYPE "public"."booking_type" ADD VALUE IF NOT EXISTS 'manual';
        ALTER TYPE "public"."booking_type" ADD VALUE IF NOT EXISTS 'blocked';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE "public"."user_role" AS ENUM ('user', 'host', 'admin');
    END IF;
END $$;


-- ========== ALTER users TABLE ==========
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password text;
-- Add the role column if it doesn't exist, using TEXT type for now.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text;
-- Now, safely alter the column type to the enum
ALTER TABLE public.users ALTER COLUMN role TYPE public.user_role USING role::public.user_role;
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'user';


-- ========== ALTER properties TABLE ==========
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS has_deposit boolean NOT NULL DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS deposit_amount numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS cancellation_policy text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS cancellation_policy_en text;
-- Convert enum columns to text for more flexibility
ALTER TABLE public.properties ALTER COLUMN type TYPE text;
ALTER TABLE public.properties ALTER COLUMN booking_system TYPE text;
ALTER TABLE public.properties ALTER COLUMN currency TYPE text;
ALTER TABLE public.properties ALTER COLUMN dedicated_for TYPE text;
ALTER TABLE public.properties ALTER COLUMN dedicated_for_en TYPE text;


-- ========== ALTER bookings TABLE ==========
ALTER TABLE public.bookings RENAME COLUMN IF EXISTS user_id TO guest_id;
ALTER TABLE public.bookings RENAME COLUMN IF EXISTS total_price TO total_amount;
ALTER TABLE public.bookings RENAME COLUMN IF EXISTS booking_period TO period;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS host_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS type public.booking_type NOT NULL DEFAULT 'platform';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_details jsonb;
-- Adjust columns to use text type
ALTER TABLE public.bookings ALTER COLUMN status TYPE text;
ALTER TABLE public.bookings ALTER COLUMN period TYPE text;
ALTER TABLE public.bookings ALTER COLUMN currency TYPE text;
ALTER TABLE public.bookings ALTER COLUMN status SET DEFAULT 'pending';


-- ========== ALTER reviews TABLE ==========
ALTER TABLE public.reviews RENAME COLUMN IF EXISTS user_id TO author_id;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS property_host_id uuid REFERENCES public.users(id) ON DELETE SET NULL;


-- ========== ALTER bank_accounts TABLE ==========
ALTER TABLE public.bank_accounts RENAME COLUMN IF EXISTS host_id TO user_id;
ALTER TABLE public.bank_accounts DROP COLUMN IF EXISTS is_default;


-- ========== RECREATE REQUESTS TABLES ==========
DROP TABLE IF EXISTS public.cancellation_requests CASCADE;
DROP TABLE IF EXISTS public.reschedule_requests CASCADE;
DROP TYPE IF EXISTS public.request_status CASCADE;

CREATE TABLE public.cancellation_requests (
    "id" uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "booking_id" uuid NOT NULL,
    "property_id" uuid NOT NULL,
    "guest_id" uuid NOT NULL,
    "host_id" uuid,
    "status" text NOT NULL DEFAULT 'pending',
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY ("id"),
    CONSTRAINT fk_booking FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_property FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE,
    CONSTRAINT fk_guest FOREIGN KEY (guest_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_host FOREIGN KEY (host_id) REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TABLE public.reschedule_requests (
    "id" uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "booking_id" uuid NOT NULL,
    "property_id" uuid NOT NULL,
    "guest_id" uuid NOT NULL,
    "host_id" uuid,
    "new_date" date NOT NULL,
    "new_period" text NOT NULL,
    "status" text NOT NULL DEFAULT 'pending',
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY ("id"),
    CONSTRAINT fk_booking FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_property FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE,
    CONSTRAINT fk_guest FOREIGN KEY (guest_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_host FOREIGN KEY (host_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- ========== DROP old helper function and trigger ==========
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop unused old enums
DROP TYPE IF EXISTS public.property_type CASCADE;
DROP TYPE IF EXISTS public.property_booking_system CASCADE;
DROP TYPE IF EXISTS public.currency_type CASCADE;
DROP TYPE IF EXISTS public.booking_period CASCADE;
DROP TYPE IF EXISTS public.booking_status CASCADE;

COMMIT;

-- Note: RLS policies should be reviewed and applied in the Supabase Dashboard UI
-- to ensure the security of your application after these schema changes.
