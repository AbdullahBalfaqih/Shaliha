
CREATE OR REPLACE VIEW public.user_bookings_view AS
SELECT
    b.id,
    b.guest_id,
    b.booking_date,
    b.period,
    b.status,
    p.id AS property_id,
    p.title AS property_title,
    p.images AS property_images,
    p.location AS property_location,
    p.allow_reschedule AS property_allow_reschedule,
    p.host_id,
    -- Check if a review exists for this booking
    EXISTS (
        SELECT 1
        FROM public.reviews r
        WHERE r.booking_id = b.id
    ) AS has_review
FROM
    public.bookings b
JOIN
    public.properties p ON b.property_id = p.id;
