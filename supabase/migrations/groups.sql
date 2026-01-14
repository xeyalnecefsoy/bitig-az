-- ============================================
-- GROUPS (COMMUNITIES) MIGRATION
-- ============================================

-- 1. Create Groups Table
create table if not exists public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  slug text not null unique,
  description text,
  icon_url text, -- Icon/Logo of the group
  cover_url text, -- Banner image
  is_official boolean default false, -- Official Bitig groups
  created_by uuid references profiles(id) on delete set null,
  members_count integer default 0,
  posts_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Groups
alter table public.groups enable row level security;

create policy "Groups are viewable by everyone" 
  on groups for select 
  using (true);

create policy "Authenticated users can create groups" 
  on groups for insert 
  with check (auth.role() = 'authenticated');

-- "Group admins can update their groups" policy moved down needed tables are created

-- 2. Create Group Members Table
create table if not exists public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  role text default 'member' check (role in ('admin', 'moderator', 'member')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, user_id)
);

-- RLS for Group Members
alter table public.group_members enable row level security;

create policy "Group members are viewable by everyone" 
  on group_members for select 
  using (true);

create policy "Users can join groups" 
  on group_members for insert 
  with check (auth.uid() = user_id);

create policy "Users can leave groups" 
  on group_members for delete 
  using (auth.uid() = user_id);

-- NOW create the policy on groups that references group_members
create policy "Group admins can update their groups" 
  on groups for update 
  using (
    exists (
      select 1 from group_members 
      where group_id = groups.id 
      and user_id = auth.uid() 
      and role in ('admin', 'moderator')
    )
    OR
    exists ( -- Site admins can also update
      select 1 from profiles
      where id = auth.uid()
      and role in ('admin', 'coadmin')
    )
  );

-- 3. Add group_id to Posts table
alter table public.posts 
add column if not exists group_id uuid references groups(id) on delete set null;

-- 4. Initial Seed Data (Official Groups)
-- Note: We use DO block to prevent errors if running multiple times
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM groups WHERE slug = 'felsefe') THEN
    INSERT INTO groups (name, slug, description, is_official, icon_url)
    VALUES 
      ('Fəlsəfə Dünyası', 'felsefe', 'Düşüncə, məntiq və fəlsəfi müzakirələr üçün məkan.', true, '/icons/groups/philosophy.png');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM groups WHERE slug = 'tarix') THEN
    INSERT INTO groups (name, slug, description, is_official, icon_url)
    VALUES 
      ('Tarix və Mədəniyyət', 'tarix', 'Tarixi hadisələr, şəxsiyyətlər və mədəniyyət haqqında.', true, '/icons/groups/history.png');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM groups WHERE slug = 'bədii-ədəbiyyat') THEN
    INSERT INTO groups (name, slug, description, is_official, icon_url)
    VALUES 
      ('Bədii Ədəbiyyat', 'bədii-ədəbiyyat', 'Romanlar, hekayələr və poeziya sevərlər üçün.', true, '/icons/groups/literature.png');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM groups WHERE slug = 'texnologiya') THEN
    INSERT INTO groups (name, slug, description, is_official, icon_url)
    VALUES 
      ('Texnologiya və Elm', 'texnologiya', 'Ən son texnoloji yeniliklər və elmi kəşflər.', true, '/icons/groups/tech.png');
  END IF;
END $$;

-- 5. Triggers for Counts (Optional but recommended for performance)

-- Update member count function
create or replace function update_group_member_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update groups set members_count = members_count + 1 where id = new.group_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update groups set members_count = members_count - 1 where id = old.group_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Update post count function
create or replace function update_group_post_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT' and new.group_id is not null) then
    update groups set posts_count = posts_count + 1 where id = new.group_id;
  elsif (TG_OP = 'DELETE' and old.group_id is not null) then
    update groups set posts_count = posts_count - 1 where id = old.group_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Create triggers
drop trigger if exists on_group_member_change on group_members;
create trigger on_group_member_change
  after insert or delete on group_members
  for each row execute procedure update_group_member_count();

drop trigger if exists on_group_post_change on posts;
create trigger on_group_post_change
  after insert or delete on posts
  for each row execute procedure update_group_post_count();
