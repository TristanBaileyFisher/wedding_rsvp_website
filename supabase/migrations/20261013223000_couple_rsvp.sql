CREATE OR REPLACE FUNCTION public.get_couple_guests(p_guest_id bigint)
RETURNS TABLE (
    id bigint,
    first_name text,
    last_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
    SELECT guest.id, guest.first_name, guest.last_name
    FROM public.guests AS guest
    WHERE guest.id = p_guest_id
       OR guest.id IN (
           SELECT CASE
               WHEN relationship.guest_id = p_guest_id
                   THEN relationship.related_guest_id
               ELSE relationship.guest_id
           END
           FROM public.guest_relationships AS relationship
           WHERE relationship.relationship_type = 'couple'
             AND (
                 relationship.guest_id = p_guest_id
                 OR relationship.related_guest_id = p_guest_id
             )
       )
    ORDER BY (guest.id = p_guest_id) DESC, guest.first_name, guest.last_name;
$function$;

CREATE OR REPLACE FUNCTION public.submit_couple_rsvp(
    p_guest_id bigint,
    p_attending boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    IF p_attending IS NULL THEN
        RAISE EXCEPTION 'An attendance response is required.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.guests AS guest WHERE guest.id = p_guest_id
    ) THEN
        RAISE EXCEPTION 'The selected guest was not found.';
    END IF;

    INSERT INTO public.guest_rsvps (guest_id, attending, submitted_at, updated_at)
    SELECT guest.id, p_attending, now(), now()
    FROM public.guests AS guest
    WHERE guest.id = p_guest_id
       OR guest.id IN (
           SELECT CASE
               WHEN relationship.guest_id = p_guest_id
                   THEN relationship.related_guest_id
               ELSE relationship.guest_id
           END
           FROM public.guest_relationships AS relationship
           WHERE relationship.relationship_type = 'couple'
             AND (
                 relationship.guest_id = p_guest_id
                 OR relationship.related_guest_id = p_guest_id
             )
       )
    ON CONFLICT (guest_id)
    DO UPDATE SET
        attending = EXCLUDED.attending,
        submitted_at = EXCLUDED.submitted_at,
        updated_at = EXCLUDED.updated_at;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_couple_guests(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_couple_rsvp(bigint, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_couple_guests(bigint) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_couple_rsvp(bigint, boolean) TO anon, authenticated;
