-- Add username tracking table
create table if not exists public.username_changes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  previous_username text,
  new_username text not null,
  changed_at timestamp with time zone default now()
);

alter table public.username_changes enable row level security;
create policy "Users can view own username history" on username_changes for select using (auth.uid() = user_id);

-- Function to check username availability and validity
create or replace function can_change_username(p_user_id uuid, p_new_username text)
returns jsonb as $$
declare
  v_last_change timestamp with time zone;
  v_exists boolean;
  v_days_since_change integer;
  c_min_days integer := 30; -- 30 days limit
begin
  -- 1. Check format (letters, numbers, underscores, 3-20 chars)
  if not p_new_username ~ '^[a-zA-Z0-9_]{3,20}$' then
    return jsonb_build_object('allowed', false, 'reason', 'invalid_format');
  end if;

  -- 2. Check availability
  select exists(select 1 from profiles where username = p_new_username and id != p_user_id) into v_exists;
  if v_exists then
    return jsonb_build_object('allowed', false, 'reason', 'taken');
  end if;

  -- 3. Check time limit
  select changed_at into v_last_change 
  from username_changes 
  where user_id = p_user_id 
  order by changed_at desc 
  limit 1;

  if v_last_change is not null then
    v_days_since_change := extract(day from (now() - v_last_change));
    if v_days_since_change < c_min_days then
      return jsonb_build_object('allowed', false, 'reason', 'time_limit', 'days_left', c_min_days - v_days_since_change);
    end if;
  end if;

  return jsonb_build_object('allowed', true);
end;
$$ language plpgsql security definer;

-- Trigger to record history
create or replace function on_username_change()
returns trigger as $$
begin
  if (OLD.username is distinct from NEW.username) then
    insert into username_changes (user_id, previous_username, new_username)
    values (NEW.id, OLD.username, NEW.username);
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

-- Attach trigger
drop trigger if exists track_username_changes on profiles;
create trigger track_username_changes
  after update on profiles
  for each row execute function on_username_change();
