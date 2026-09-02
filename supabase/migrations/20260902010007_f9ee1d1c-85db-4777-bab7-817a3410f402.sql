REVOKE EXECUTE ON FUNCTION public.compute_round_scores_sql(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_league_id(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_league_admin(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.join_league_with_code(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.normalize_team_name(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_fixtures_json(jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;