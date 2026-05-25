-- Función llamada por el cron de refresh (cada 5 min).
-- Refresca las materialized views de ranking y resumen de usuario.
CREATE OR REPLACE FUNCTION fn_refresh_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ranking_global;
END;
$$;
