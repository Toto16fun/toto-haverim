-- A.1 מילון כינויים לשמות קבוצות
create table if not exists public.team_aliases (
  id bigserial primary key,
  canonical text not null,
  alias text not null,
  unique (canonical, alias)
);

-- RLS policies for team_aliases
alter table public.team_aliases enable row level security;

create policy "Everyone can view team aliases"
  on public.team_aliases for select
  using (true);

create policy "Admin can manage team aliases"
  on public.team_aliases for all
  using ((auth.jwt() ->> 'email'::text) = 'tomercohen1995@gmail.com'::text);

-- דוגמאות seed
insert into public.team_aliases (canonical, alias) values
  ('מכבי תל אביב','מכבי ת"א'),
  ('מכבי תל אביב','מכבי תל-אביב'),
  ('הפועל באר שבע','הפועל ב"ש'),
  ('Manchester United','Man United'),
  ('Manchester United','Man Utd'),
  ('Tottenham Hotspur','Spurs')
on conflict do nothing;

-- A.2 פונקציה לנרמול שם קבוצה לפי alias
create or replace function public.normalize_team_name(p_name text)
returns text language sql stable as $$
  select coalesce(
    (select canonical from public.team_aliases where lower(alias)=lower(p_name) limit 1),
    p_name
  );
$$;

-- A.3 פונקציית ולידציה ל‑JSON של משחקים (16 בדיוק, ללא ריקים)
create or replace function public.validate_fixtures_json(p_json jsonb)
returns boolean language plpgsql immutable as $$
declare cnt int; bad int; begin
  select jsonb_array_length(p_json->'games') into cnt;
  if coalesce(cnt,0) <> 16 then return false; end if;
  select count(*) into bad from jsonb_to_recordset(p_json->'games') as x(home text, away text)
    where coalesce(nullif(trim(home),''), '') = '' or coalesce(nullif(trim(away),''), '') = '';
  if bad > 0 then return false; end if;
  return true;
end;$$;

-- Create storage bucket for fixture images
insert into storage.buckets (id, name, public) values ('fixture-images', 'fixture-images', true)
on conflict do nothing;

-- Storage policies for fixture images
create policy "Anyone can view fixture images"
  on storage.objects for select
  using (bucket_id = 'fixture-images');

create policy "Admin can upload fixture images"
  on storage.objects for insert
  with check (bucket_id = 'fixture-images' AND (auth.jwt() ->> 'email'::text) = 'tomercohen1995@gmail.com'::text);

-- Update toto_rounds table to ensure draft status support
alter table public.toto_rounds alter column status set default 'draft';