ALTER TABLE public.guest_rsvps
ADD COLUMN IF NOT EXISTS spotify_choice text;

CREATE OR REPLACE FUNCTION public.submit_couple_rsvp(
    p_guest_id bigint,
    p_attending boolean,
    p_requirements jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_guest_ids bigint[];
BEGIN
    IF p_attending IS NULL THEN
        RAISE EXCEPTION 'An attendance response is required.';
    END IF;

    IF jsonb_typeof(p_requirements) <> 'array' THEN
        RAISE EXCEPTION 'Guest requirements must be provided as an array.';
    END IF;

    SELECT array_agg(target.id)
    INTO v_guest_ids
    FROM (
        SELECT guest.id
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
    ) AS target;

    IF v_guest_ids IS NULL THEN
        RAISE EXCEPTION 'The selected guest was not found.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM unnest(v_guest_ids) AS target(guest_id)
        WHERE (
            SELECT count(*)
            FROM jsonb_array_elements(p_requirements) AS entry(value)
            WHERE (entry.value->>'guest_id')::bigint = target.guest_id
        ) <> 1
    ) OR EXISTS (
        SELECT 1
        FROM jsonb_array_elements(p_requirements) AS entry(value)
        WHERE NOT ((entry.value->>'guest_id')::bigint = ANY(v_guest_ids))
    ) THEN
        RAISE EXCEPTION 'Requirements must be provided exactly once for each guest on this invitation.';
    END IF;

    INSERT INTO public.guest_rsvps (
        guest_id,
        attending,
        dietary_requirements,
        accessibility_requirements,
        spotify_choice,
        submitted_at,
        updated_at
    )
    SELECT
        (entry.value->>'guest_id')::bigint,
        p_attending,
        nullif(btrim(entry.value->>'dietary_requirements'), ''),
        nullif(btrim(entry.value->>'accessibility_requirements'), ''),
        nullif(btrim(entry.value->>'spotify_choice'), ''),
        now(),
        now()
    FROM jsonb_array_elements(p_requirements) AS entry(value)
    ON CONFLICT (guest_id)
    DO UPDATE SET
        attending = EXCLUDED.attending,
        dietary_requirements = EXCLUDED.dietary_requirements,
        accessibility_requirements = EXCLUDED.accessibility_requirements,
        spotify_choice = EXCLUDED.spotify_choice,
        submitted_at = EXCLUDED.submitted_at,
        updated_at = EXCLUDED.updated_at;
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_couple_rsvp(bigint, boolean, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_couple_rsvp(bigint, boolean, jsonb) TO anon, authenticated;

DROP FUNCTION public.admin_list_rsvp_data();

CREATE FUNCTION public.admin_list_rsvp_data()
RETURNS TABLE (
    guest_id bigint,
    first_name text,
    last_name text,
    relationship_type text,
    related_guest_id bigint,
    related_first_name text,
    related_last_name text,
    attending boolean,
    dietary_requirements text,
    accessibility_requirements text,
    spotify_choice text,
    submitted_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    IF NOT public.is_rsvp_admin() THEN
        RAISE EXCEPTION 'Admin access required.';
    END IF;

    RETURN QUERY
    SELECT
        guest.id,
        guest.first_name,
        guest.last_name,
        relationship.relationship_type,
        partner.id,
        partner.first_name,
        partner.last_name,
        rsvp.attending,
        rsvp.dietary_requirements,
        rsvp.accessibility_requirements,
        rsvp.spotify_choice,
        rsvp.submitted_at
    FROM public.guests AS guest
    LEFT JOIN LATERAL (
        SELECT relation.relationship_type, CASE
            WHEN relation.guest_id = guest.id THEN relation.related_guest_id
            ELSE relation.guest_id
        END AS partner_id
        FROM public.guest_relationships AS relation
        WHERE relation.guest_id = guest.id
           OR relation.related_guest_id = guest.id
        ORDER BY relation.id
        LIMIT 1
    ) AS relationship ON true
    LEFT JOIN public.guests AS partner
        ON partner.id = relationship.partner_id
       AND partner.id <> guest.id
    LEFT JOIN public.guest_rsvps AS rsvp ON rsvp.guest_id = guest.id
    ORDER BY guest.first_name, guest.last_name, guest.id;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_list_rsvp_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_rsvp_data() TO authenticated;
