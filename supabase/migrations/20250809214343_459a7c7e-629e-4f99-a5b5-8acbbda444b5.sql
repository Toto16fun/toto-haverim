-- Fix security issues - add search_path to functions
create or replace function public.normalize_team_name(p_name text)
returns text 
language sql stable 
security definer
set search_path to ''
as $$
  select coalesce(
    (select canonical from public.team_aliases where lower(alias)=lower(p_name) limit 1),
    p_name
  );
$$;

create or replace function public.validate_fixtures_json(p_json jsonb)
returns boolean 
language plpgsql immutable 
security definer
set search_path to ''
as $$
declare cnt int; bad int; begin
  select jsonb_array_length(p_json->'games') into cnt;
  if coalesce(cnt,0) <> 16 then return false; end if;
  select count(*) into bad from jsonb_to_recordset(p_json->'games') as x(home text, away text)
    where coalesce(nullif(trim(home),''), '') = '' or coalesce(nullif(trim(away),''), '') = '';
  if bad > 0 then return false; end if;
  return true;
end;$$;