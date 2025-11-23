-- Create a function that handles the new user insertion
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url, bio, updated_at)
  values (
    new.id,
    split_part(new.email, '@', 1),
    new.raw_user_meta_data->>'avatar_url',
    '',
    now()
  );
  return new;
end;
$$;

-- Create the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
