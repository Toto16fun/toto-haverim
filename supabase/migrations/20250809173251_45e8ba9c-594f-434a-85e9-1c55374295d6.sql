-- Add columns to toto_rounds table
alter table public.toto_rounds
  add column if not exists status text check (status in ('draft','active','locked','finished')) default 'draft',
  add column if not exists group_id bigint,
  add column if not exists created_by uuid references auth.users(id);

-- Add columns to games table
alter table public.games
  add column if not exists kickoff_at timestamptz,
  add column if not exists result text check (result in ('1','X','2'));

-- Add columns to user_bets table
alter table public.user_bets
  add column if not exists is_autofilled boolean default false,
  add constraint user_bets_round_user_uni unique (round_id, user_id);

-- Create predictions table
create table if not exists public.predictions (
  id bigint generated always as identity primary key,
  ticket_id bigint not null references public.user_bets(id) on delete cascade,
  match_id bigint not null references public.games(id) on delete cascade,
  pick text check (pick in ('1','X','2')) not null,
  unique (ticket_id, match_id, pick)
);

-- Create round_scores table
create table if not exists public.round_scores (
  round_id bigint references public.toto_rounds(id) on delete cascade,
  user_id uuid references auth.users(id),
  hits int not null,
  rank int,
  is_payer boolean default false,
  tiebreak_notes text,
  primary key (round_id, user_id)
);

-- Function to limit max 2 predictions per match per ticket
create or replace function public.trg_pred_max_two()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.predictions
      where ticket_id = new.ticket_id and match_id = new.match_id) >= 2 then
    raise exception 'Up to two picks allowed per match per ticket';
  end if;
  return new;
end;$$;

-- Trigger for max 2 predictions per match
create trigger predictions_max_two
before insert on public.predictions
for each row execute procedure public.trg_pred_max_two();

-- Function to limit max 3 double matches per ticket
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

-- Trigger for max 3 double matches
create trigger predictions_max_three_doubles
after insert or delete on public.predictions
for each row execute procedure public.trg_ticket_max_doubles();