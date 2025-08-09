-- Adding new columns to existing tables
alter table public.toto_rounds
  add column if not exists status text check (status in ('draft','active','locked','finished')) default 'draft',
  add column if not exists group_id bigint,
  add column if not exists created_by uuid references auth.users(id);

alter table public.games
  add column if not exists kickoff_at timestamptz,
  add column if not exists result text check (result in ('1','X','2'));

alter table public.user_bets
  add column if not exists is_autofilled boolean default false,
  add constraint user_bets_round_user_uni unique (round_id, user_id);

-- Creating new tables
create table if not exists public.predictions (
  id bigint generated always as identity primary key,
  ticket_id bigint not null references public.user_bets(id) on delete cascade,
  match_id bigint not null references public.games(id) on delete cascade,
  pick text check (pick in ('1','X','2')) not null,
  unique (ticket_id, match_id, pick)
);

create table if not exists public.round_scores (
  round_id bigint references public.toto_rounds(id) on delete cascade,
  user_id uuid references auth.users(id),
  hits int not null,
  rank int,
  is_payer boolean default false,
  tiebreak_notes text,
  primary key (round_id, user_id)
);

-- Creating triggers for validation
create or replace function public.trg_pred_max_two()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.predictions
      where ticket_id = new.ticket_id and match_id = new.match_id) >= 2 then
    raise exception 'Up to two picks allowed per match per ticket';
  end if;
  return new;
end;$$;

create trigger predictions_max_two
before insert on public.predictions
for each row execute procedure public.trg_pred_max_two();

create or replace function public.trg_ticket_max_doubles()
returns trigger language plpgsql as $$
declare
  doubles_count int;
begin
  select count(*) into doubles_count
  from (
    select match_id
    from public.predictions
    where ticket_id = new.ticket_id
    group by match_id
    having count(*) = 2
  ) t;
  if doubles_count > 3 then
    raise exception 'Maximum of 3 double matches per ticket exceeded';
  end if;
  return new;
end;$$;

create trigger predictions_max_three_doubles
after insert or delete on public.predictions
for each row execute procedure public.trg_ticket_max_doubles();