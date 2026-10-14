CREATE OR REPLACE FUNCTION public.search_guest_names(p_search text)
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
    SELECT
        guest.id,
        guest.first_name,
        guest.last_name
    FROM public.guests AS guest
    WHERE char_length(btrim(coalesce(p_search, ''))) >= 2
      AND position(
          lower(btrim(p_search))
          IN lower(concat_ws(' ', guest.first_name, guest.last_name))
      ) > 0
    ORDER BY guest.first_name, guest.last_name
    LIMIT 10;
$function$;

REVOKE ALL ON FUNCTION public.search_guest_names(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_guest_names(text) TO anon, authenticated;
