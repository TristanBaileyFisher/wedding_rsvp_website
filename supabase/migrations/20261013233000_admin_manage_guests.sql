CREATE OR REPLACE FUNCTION public.admin_link_couple(
    p_guest_id bigint,
    p_partner_id bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    IF NOT public.is_rsvp_admin() THEN
        RAISE EXCEPTION 'Admin access required.';
    END IF;

    IF p_guest_id IS NULL OR p_partner_id IS NULL OR p_guest_id = p_partner_id THEN
        RAISE EXCEPTION 'Select two different guests.';
    END IF;

    IF (
        SELECT count(*)
        FROM public.guests AS guest
        WHERE guest.id IN (p_guest_id, p_partner_id)
    ) <> 2 THEN
        RAISE EXCEPTION 'One or both selected guests do not exist.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.guest_relationships AS relationship
        WHERE relationship.guest_id IN (p_guest_id, p_partner_id)
           OR relationship.related_guest_id IN (p_guest_id, p_partner_id)
    ) THEN
        RAISE EXCEPTION 'Both guests must be unlinked before creating a couple relationship.';
    END IF;

    INSERT INTO public.guest_relationships (
        guest_id,
        related_guest_id,
        relationship_type
    )
    VALUES (p_guest_id, p_partner_id, 'couple');
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_delete_guest(p_guest_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    IF NOT public.is_rsvp_admin() THEN
        RAISE EXCEPTION 'Admin access required.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.guests AS guest
        WHERE guest.id = p_guest_id
    ) THEN
        RAISE EXCEPTION 'The selected guest does not exist.';
    END IF;

    DELETE FROM public.guest_rsvps AS rsvp
    WHERE rsvp.guest_id = p_guest_id;

    DELETE FROM public.guest_relationships AS relationship
    WHERE relationship.guest_id = p_guest_id
       OR relationship.related_guest_id = p_guest_id;

    DELETE FROM public.guests AS guest
    WHERE guest.id = p_guest_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_link_couple(bigint, bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_guest(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_link_couple(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_guest(bigint) TO authenticated;
