DROP FUNCTION IF EXISTS public.submit_couple_rsvp(bigint, boolean);

CREATE FUNCTION public.submit_couple_rsvp(
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
        submitted_at,
        updated_at
    )
    SELECT
        (entry.value->>'guest_id')::bigint,
        p_attending,
        nullif(btrim(entry.value->>'dietary_requirements'), ''),
        nullif(btrim(entry.value->>'accessibility_requirements'), ''),
        now(),
        now()
    FROM jsonb_array_elements(p_requirements) AS entry(value)
    ON CONFLICT (guest_id)
    DO UPDATE SET
        attending = EXCLUDED.attending,
        dietary_requirements = EXCLUDED.dietary_requirements,
        accessibility_requirements = EXCLUDED.accessibility_requirements,
        submitted_at = EXCLUDED.submitted_at,
        updated_at = EXCLUDED.updated_at;
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_couple_rsvp(bigint, boolean, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_couple_rsvp(bigint, boolean, jsonb) TO anon, authenticated;
