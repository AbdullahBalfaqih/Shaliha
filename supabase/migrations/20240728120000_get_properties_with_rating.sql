
create or replace function get_properties_with_ratings(
    p_city text default null,
    p_type text default null,
    p_dedicated_for text default null,
    p_max_price float default null,
    p_amenities text[] default null,
    p_q text default null
)
returns table (
    id uuid,
    title text,
    title_en text,
    type text,
    type_en text,
    location text,
    location_en text,
    price_per_night float,
    currency text,
    guests int,
    bedrooms int,
    bathrooms int,
    amenities text[],
    images text[],
    description text,
    description_en text,
    host_id uuid,
    coordinates jsonb,
    dedicated_for text,
    dedicated_for_en text,
    discount_codes jsonb,
    booking_system text,
    morning_period jsonb,
    evening_period jsonb,
    cancellation_policy text,
    cancellation_policy_en text,
    allow_reschedule boolean,
    is_active boolean,
    created_at timestamptz,
    lounges int,
    rating float,
    review_count int
) as $$
begin
    return query
    select
        p.id,
        p.title,
        p.title_en,
        p.type,
        p.type_en,
        p.location,
        p.location_en,
        p.price_per_night,
        p.currency,
        p.guests,
        p.bedrooms,
        p.bathrooms,
        p.amenities,
        p.images,
        p.description,
        p.description_en,
        p.host_id,
        p.coordinates,
        p.dedicated_for,
        p.dedicated_for_en,
        p.discount_codes,
        p.booking_system,
        p.morning_period,
        p.evening_period,
        p.cancellation_policy,
        p.cancellation_policy_en,
        p.allow_reschedule,
        p.is_active,
        p.created_at,
        p.lounges,
        coalesce(avg(r.rating), 0)::float as rating,
        count(r.id)::int as review_count
    from
        properties p
    left join
        reviews r on p.id = r.property_id
    where
        p.is_active = true
        and (p_city is null or p.governorate = p_city)
        and (p_type is null or p.type = p_type)
        and (p_dedicated_for is null or p.dedicated_for = p_dedicated_for or p.dedicated_for = 'كلاهما')
        and (p_max_price is null or p.price_per_night <= p_max_price)
        and (p_amenities is null or p.amenities @> p_amenities)
        and (p_q is null or p.title ilike '%' || p_q || '%' or p.location ilike '%' || p_q || '%')
    group by
        p.id;
end;
$$ language plpgsql;
