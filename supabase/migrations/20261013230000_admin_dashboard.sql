CREATE TABLE public.admin_users (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_users FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_rsvp_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_users AS admin
        WHERE admin.user_id = (SELECT auth.uid())
    );
$function$;

CREATE OR REPLACE FUNCTION public.admin_list_rsvp_data()
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

CREATE OR REPLACE FUNCTION public.admin_add_guests(p_guests jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_guest record;
    v_guest_ids bigint[] := ARRAY[]::bigint[];
    v_guest_id bigint;
    v_guest_count integer;
BEGIN
    IF NOT public.is_rsvp_admin() THEN
        RAISE EXCEPTION 'Admin access required.';
    END IF;

    IF coalesce(jsonb_typeof(p_guests), '') <> 'array' THEN
        RAISE EXCEPTION 'Provide one guest or a pair of guests.';
    END IF;

    v_guest_count := jsonb_array_length(p_guests);
    IF v_guest_count NOT BETWEEN 1 AND 2 THEN
        RAISE EXCEPTION 'Provide one guest or a pair of guests.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM jsonb_to_recordset(p_guests) AS entry(first_name text, last_name text)
        WHERE nullif(btrim(entry.first_name), '') IS NULL
    ) THEN
        RAISE EXCEPTION 'Each guest must have a first name.';
    END IF;

    FOR v_guest IN
        SELECT entry.first_name, entry.last_name
        FROM jsonb_to_recordset(p_guests) AS entry(first_name text, last_name text)
    LOOP
        INSERT INTO public.guests (first_name, last_name)
        VALUES (btrim(v_guest.first_name), nullif(btrim(v_guest.last_name), ''))
        RETURNING id INTO v_guest_id;

        v_guest_ids := array_append(v_guest_ids, v_guest_id);
    END LOOP;

    IF v_guest_count = 2 THEN
        INSERT INTO public.guest_relationships (
            guest_id,
            related_guest_id,
            relationship_type
        )
        VALUES (v_guest_ids[1], v_guest_ids[2], 'couple');
    END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.is_rsvp_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_rsvp_data() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_add_guests(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_rsvp_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_rsvp_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_guests(jsonb) TO authenticated;
