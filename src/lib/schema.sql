-- ChaletSpot Database Schema
-- Version 1.0

-- ========== EXTENSIONS ==========
-- Enable UUID generation
create extension if not exists "uuid-ossp" with schema "extensions";

-- ========== TYPES ==========
-- Define custom types (enums) to ensure data consistency.
create type "public"."user_role" as enum ('user', 'host', 'admin');
create type "public"."property_type" as enum ('شاليه', 'فيلا', 'مزرعة', 'مسبح', 'شقة');
create type "public"."property_booking_system" as enum ('single_period', 'dual_period');
create type "public"."booking_period" as enum ('morning', 'evening', 'full_day');
create type "public"."booking_status" as enum ('pending', 'confirmed', 'cancelled', 'completed');
create type "public"."request_status" as enum ('pending', 'accepted', 'rejected');
create type "public"."currency_type" as enum ('SAR', 'YER');

-- ========== TABLES ==========

-- 1. USERS
-- Stores public user information, extending the private `auth.users` table.
create table "public"."users" (
    "id" uuid not null references "auth"."users" on delete cascade,
    "full_name" text,
    "avatar_url" text,
    "phone" text unique,
    "email" text unique,
    "role" public.user_role not null default 'user'::user_role,
    "created_at" timestamp with time zone not null default now(),
    primary key ("id")
);
-- Add comments for clarity
comment on table "public"."users" is 'Public profile data for each user, linked to auth.users.';
comment on column "public"."users"."id" is 'Links to auth.users.id';

-- 2. PROPERTIES
-- Stores all details about the properties (chalets, pools, etc.).
create table "public"."properties" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "host_id" uuid not null references "public"."users" on delete cascade,
    "title" text not null,
    "title_en" text,
    "description" text,
    "description_en" text,
    "type" public.property_type not null,
    "location" text not null,
    "location_en" text,
    "coordinates" jsonb, -- { "lat": 15.3694, "lng": 44.1910 }
    "price_per_night" numeric not null,
    "currency" public.currency_type not null default 'SAR'::currency_type,
    "guests" integer not null default 1,
    "bedrooms" integer not null default 0,
    "bathrooms" integer not null default 0,
    "amenities" text[], -- e.g., ARRAY['wifi', 'pool']
    "images" text[],
    "dedicated_for" text, -- For Families, Singles, Both
    "dedicated_for_en" text,
    "is_active" boolean not null default false,
    "booking_system" public.property_booking_system not null,
    "morning_period" jsonb, -- { "checkIn": "08:00", "checkOut": "18:00", "price": 500 }
    "evening_period" jsonb, -- { "checkIn": "20:00", "checkOut": "06:00", "price": 450 }
    "discount_codes" jsonb[], -- ARRAY of { "code": "SUMMER24", "type": "percentage", "value": 10 }
    "cancellation_policy" text,
    "cancellation_policy_en" text,
    "allow_reschedule" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone,
    primary key ("id")
);
-- Add indexes for faster queries
create index "properties_host_id_idx" on "public"."properties" ("host_id");
create index "properties_type_idx" on "public"."properties" ("type");
create index "properties_is_active_idx" on "public"."properties" ("is_active");

-- 3. BOOKINGS
-- Records all bookings made by users.
create table "public"."bookings" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null references "public"."users" on delete cascade,
    "property_id" uuid not null references "public"."properties" on delete cascade,
    "booking_date" date not null,
    "booking_period" public.booking_period not null,
    "status" public.booking_status not null default 'pending'::booking_status,
    "total_price" numeric not null,
    "currency" public.currency_type not null,
    "service_fee" numeric not null,
    "payment_proof_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone,
    primary key ("id")
);
-- Add indexes for faster queries
create index "bookings_user_id_idx" on "public"."bookings" ("user_id");
create index "bookings_property_id_idx" on "public"."bookings" ("property_id");
create index "bookings_status_idx" on "public"."bookings" ("status");

-- 4. REVIEWS
-- Stores user reviews for properties.
create table "public"."reviews" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null references "public"."users" on delete cascade,
    "property_id" uuid not null references "public"."properties" on delete cascade,
    "booking_id" uuid not null unique references "public"."bookings" on delete cascade,
    "rating" smallint not null check (rating >= 1 and rating <= 5),
    "comment" text,
    "created_at" timestamp with time zone not null default now(),
    primary key ("id")
);
-- Add indexes for faster queries
create index "reviews_property_id_idx" on "public"."reviews" ("property_id");

-- 5. WISHLISTS
-- Manages user wishlists.
create table "public"."wishlists" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null unique references "public"."users" on delete cascade,
    "name" text not null default 'My Wishlist',
    primary key ("id")
);
-- Manages items within a wishlist (many-to-many relationship).
create table "public"."wishlist_items" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "wishlist_id" uuid not null references "public"."wishlists" on delete cascade,
    "property_id" uuid not null references "public"."properties" on delete cascade,
    primary key ("id"),
    unique ("wishlist_id", "property_id")
);

-- 6. BANK ACCOUNTS
-- Stores bank account details for hosts.
create table "public"."bank_accounts" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "host_id" uuid not null references "public"."users" on delete cascade,
    "bank_name" text not null,
    "account_holder" text not null,
    "account_number" text not null,
    "is_default" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    primary key ("id")
);
create index "bank_accounts_host_id_idx" on "public"."bank_accounts" ("host_id");

-- 7. CANCELLATION & RESCHEDULE REQUESTS
create table "public"."cancellation_requests" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "booking_id" uuid not null unique references "public"."bookings" on delete cascade,
    "reason" text,
    "status" public.request_status not null default 'pending'::request_status,
    "created_at" timestamp with time zone not null default now(),
    primary key ("id")
);

create table "public"."reschedule_requests" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "booking_id" uuid not null unique references "public"."bookings" on delete cascade,
    "new_date" date not null,
    "new_period" public.booking_period not null,
    "status" public.request_status not null default 'pending'::request_status,
    "created_at" timestamp with time zone not null default now(),
    primary key ("id")
);


-- ========== HELPER FUNCTIONS ==========

-- Function to create a public user profile automatically on new user signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, full_name, role, email, phone)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    (new.raw_user_meta_data->>'role')::public.user_role,
    new.email,
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

-- Trigger to execute the function on new user creation.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ========== ROW LEVEL SECURITY (RLS) POLICIES ==========
-- Enable RLS for all relevant tables.
alter table public.users enable row level security;
alter table public.properties enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.cancellation_requests enable row level security;
alter table public.reschedule_requests enable row level security;

-- ** USERS POLICIES **
-- Users can view any public profile.
create policy "Users can view all profiles" on public.users for select using (true);
-- Users can only update their own profile.
create policy "Users can update their own profile" on public.users for update using (auth.uid() = id);

-- ** PROPERTIES POLICIES **
-- Anyone can view active properties.
create policy "Anyone can view active properties" on public.properties for select using (is_active = true);
-- Hosts can view their own inactive properties.
create policy "Hosts can view their own inactive properties" on public.properties for select using (auth.uid() = host_id);
-- Hosts can insert new properties.
create policy "Hosts can create properties" on public.properties for insert with check ((select role from public.users where id = auth.uid()) = 'host'::user_role);
-- Hosts can only update their own properties.
create policy "Hosts can update their own properties" on public.properties for update using (auth.uid() = host_id);

-- ** BOOKINGS POLICIES **
-- Users can view their own bookings.
create policy "Users can see their own bookings" on public.bookings for select using (auth.uid() = user_id);
-- Hosts can view bookings for their properties.
create policy "Hosts can see bookings for their properties" on public.bookings for select using (exists (
  select 1 from public.properties where properties.id = bookings.property_id and properties.host_id = auth.uid()
));
-- Authenticated users can create bookings.
create policy "Authenticated users can create bookings" on public.bookings for insert with check (auth.role() = 'authenticated');

-- ** REVIEWS POLICIES **
-- Anyone can read reviews.
create policy "Anyone can read reviews" on public.reviews for select using (true);
-- Users can only create a review for a booking they made and completed.
create policy "Users can create reviews for their completed bookings" on public.reviews for insert with check (exists (
  select 1 from public.bookings where bookings.id = reviews.booking_id and bookings.user_id = auth.uid() and bookings.status = 'completed'::booking_status
));

-- ** BANK ACCOUNTS POLICIES **
-- Hosts can only view, create, and manage their own bank accounts.
create policy "Hosts can manage their own bank accounts" on public.bank_accounts for all using (auth.uid() = host_id);

-- You would continue to add policies for wishlists, cancellation_requests, etc. following the same principles.
-- For example, users can only manage their own wishlist.

-- Default policies for other tables (can be refined):
create policy "Users can manage their own wishlists" on public.wishlists for all using (auth.uid() = user_id);
create policy "Users can manage items in their own wishlist" on public.wishlist_items for all using (exists(
    select 1 from public.wishlists where wishlists.id = wishlist_items.wishlist_id and wishlists.user_id = auth.uid()
));
create policy "Users can manage their own requests" on public.cancellation_requests for all using (exists(
    select 1 from public.bookings where bookings.id = cancellation_requests.booking_id and bookings.user_id = auth.uid()
));
create policy "Users can manage their own requests" on public.reschedule_requests for all using (exists(
    select 1 from public.bookings where bookings.id = reschedule_requests.booking_id and bookings.user_id = auth.uid()
));
