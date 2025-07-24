
-- Create custom enum types
CREATE TYPE public.user_role AS ENUM ('admin', 'host', 'user');

-- USERS Table
-- Stores user information. This table is now managed manually.
CREATE TABLE public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text,
    avatar_url text,
    role public.user_role,
    phone text UNIQUE,
    email text UNIQUE,
    password text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Add comments for clarity
COMMENT ON TABLE public.users IS 'Stores user information for manual authentication.';

-- PROPERTIES Table
-- Stores details about each property/chalet.
CREATE TABLE public.properties (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    title_en text NOT NULL,
    type text NOT NULL,
    type_en text NOT NULL,
    location text NOT NULL,
    location_en text NOT NULL,
    governorate text NOT NULL,
    city text NOT NULL,
    description text,
    description_en text,
    images text[],
    price_per_night numeric NOT NULL,
    currency text NOT NULL DEFAULT 'SAR',
    guests integer NOT NULL DEFAULT 1,
    bedrooms integer NOT NULL DEFAULT 0,
    bathrooms integer NOT NULL DEFAULT 0,
    area numeric,
    amenities text[],
    rating numeric NOT NULL DEFAULT 0,
    review_count integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    dedicated_for text NOT NULL,
    dedicated_for_en text NOT NULL,
    cancellation_policy text,
    cancellation_policy_en text,
    coordinates jsonb,
    booking_system text NOT NULL DEFAULT 'single_period',
    morning_period jsonb,
    evening_period jsonb,
    discount_codes jsonb,
    allow_reschedule boolean NOT NULL DEFAULT true
);
COMMENT ON TABLE public.properties IS 'Stores all data related to rentable properties like chalets and pools.';

-- BOOKINGS Table
-- Records all bookings made by users.
CREATE TABLE public.bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    booking_date date NOT NULL,
    period text NOT NULL, -- e.g., 'morning', 'evening', 'full_day'
    price numeric NOT NULL,
    service_fee numeric NOT NULL,
    total_amount numeric NOT NULL,
    currency text NOT NULL,
    status text NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
    payment_proof_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.bookings IS 'Contains records of all bookings.';

-- REVIEWS Table
-- Stores user reviews for properties.
CREATE TABLE public.reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating numeric NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.reviews IS 'User reviews and ratings for properties.';

-- WISHLISTS Table
-- A parent table for each user's wishlist.
CREATE TABLE public.wishlists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.wishlists IS 'Each user has one wishlist.';

-- WISHLIST_ITEMS Table
-- Stores the properties a user has added to their wishlist.
CREATE TABLE public.wishlist_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wishlist_id uuid NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
    property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (wishlist_id, property_id)
);
COMMENT ON TABLE public.wishlist_items IS 'Associates properties with wishlists.';

-- BANK_ACCOUNTS Table
-- Stores bank account information for hosts.
CREATE TABLE public.bank_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    bank_name text NOT NULL,
    account_holder text NOT NULL,
    account_number text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.bank_accounts IS 'Stores bank account details for hosts to receive payments.';

-- CANCELLATION_REQUESTS Table
CREATE TABLE public.cancellation_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
    guest_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
    status text NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.cancellation_requests IS 'Tracks user requests to cancel a booking.';

-- RESCHEDULE_REQUESTS Table
CREATE TABLE public.reschedule_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
    guest_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
    new_date date NOT NULL,
    new_period text NOT NULL,
    status text NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.reschedule_requests IS 'Tracks user requests to reschedule a booking.';

-- Automatically create a wishlist for each new user.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wishlists (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable RLS for all tables except for the manually handled 'users' table
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancellation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reschedule_requests ENABLE ROW LEVEL SECURITY;

-- Policies for properties
CREATE POLICY "Anyone can view active properties" ON public.properties FOR SELECT USING (is_active = true);
CREATE POLICY "Hosts can view their own inactive properties" ON public.properties FOR SELECT USING (host_id = (SELECT auth.uid()));
CREATE POLICY "Hosts can create properties" ON public.properties FOR INSERT WITH CHECK (host_id = (SELECT auth.uid()));
CREATE POLICY "Hosts can update their own properties" ON public.properties FOR UPDATE USING (host_id = (SELECT auth.uid()));

-- Policies for bookings
CREATE POLICY "Users can see their own bookings" ON public.bookings FOR SELECT USING (guest_id = (SELECT auth.uid()));
CREATE POLICY "Hosts can see bookings for their properties" ON public.bookings FOR SELECT USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = bookings.property_id AND properties.host_id = (SELECT auth.uid())));
CREATE POLICY "Authenticated users can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for reviews
CREATE POLICY "Anyone can read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews for their completed bookings" ON public.reviews FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM bookings WHERE bookings.property_id = reviews.property_id AND bookings.guest_id = (SELECT auth.uid()) AND bookings.status = 'completed'));

-- Policies for wishlists
CREATE POLICY "Users can manage their own wishlists" ON public.wishlists FOR ALL USING (user_id = (SELECT auth.uid()));

-- Policies for wishlist_items
CREATE POLICY "Users can manage items in their own wishlist" ON public.wishlist_items FOR ALL USING (EXISTS (SELECT 1 FROM wishlists WHERE wishlists.id = wishlist_items.wishlist_id AND wishlists.user_id = (SELECT auth.uid())));

-- Policies for bank_accounts
CREATE POLICY "Hosts can manage their own bank accounts" ON public.bank_accounts FOR ALL USING (user_id = (SELECT auth.uid()));

-- Policies for cancellation_requests
CREATE POLICY "Users can manage their own requests" ON public.cancellation_requests FOR ALL USING (guest_id = (SELECT auth.uid()));

-- Policies for reschedule_requests
CREATE POLICY "Users can manage their own requests" ON public.reschedule_requests FOR ALL USING (guest_id = (SELECT auth.uid()));

