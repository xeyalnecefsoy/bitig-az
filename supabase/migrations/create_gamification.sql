-- ============================================
-- BITIG: GAMIFICATION MIGRATION
-- Challenges, Achievements, Statistics
-- ============================================

-- 1. Challenges Table
create table if not exists public.challenges (
  id uuid default gen_random_uuid() primary key,
  title_az text not null,
  title_en text not null,
  description_az text,
  description_en text,
  type text not null check (type in ('books', 'hours', 'streak', 'reviews')),
  target integer not null,
  period text check (period in ('daily', 'weekly', 'monthly', 'yearly', 'all_time')),
  badge_icon text, -- emoji or icon name
  badge_color text default '#22c55e', -- hex color
  xp_reward integer default 100,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamp with time zone default now()
);

alter table challenges enable row level security;
create policy "Challenges are viewable by everyone" on challenges for select using (true);

-- 2. User Challenges (Progress tracking)
create table if not exists public.user_challenges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  challenge_id uuid references challenges(id) on delete cascade not null,
  progress integer default 0,
  completed boolean default false,
  completed_at timestamp with time zone,
  started_at timestamp with time zone default now(),
  unique(user_id, challenge_id)
);

alter table user_challenges enable row level security;
create policy "Users view own challenges" on user_challenges for select using (auth.uid() = user_id);
create policy "Users manage own challenges" on user_challenges for all using (auth.uid() = user_id);

-- 3. Achievements/Badges
create table if not exists public.achievements (
  id uuid default gen_random_uuid() primary key,
  name_az text not null,
  name_en text not null,
  description_az text,
  description_en text,
  icon text, -- emoji or icon name
  color text default '#f59e0b',
  category text check (category in ('reading', 'social', 'streak', 'special')),
  requirement_type text, -- e.g., 'books_read', 'reviews_written', 'streak_days'
  requirement_value integer,
  xp_reward integer default 50,
  is_secret boolean default false,
  created_at timestamp with time zone default now()
);

alter table achievements enable row level security;
create policy "Achievements viewable by everyone" on achievements for select using (true);

-- 4. User Achievements
create table if not exists public.user_achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  achievement_id uuid references achievements(id) on delete cascade not null,
  unlocked_at timestamp with time zone default now(),
  unique(user_id, achievement_id)
);

alter table user_achievements enable row level security;
create policy "User achievements are public" on user_achievements for select using (true);
create policy "Users unlock achievements" on user_achievements for insert with check (auth.uid() = user_id);

-- 5. Add XP to profiles
alter table profiles add column if not exists xp integer default 0;
alter table profiles add column if not exists level integer default 1;

-- 6. Seed some default challenges
insert into challenges (title_az, title_en, description_az, description_en, type, target, period, badge_icon, xp_reward, sort_order) values
  ('İlk Kitab', 'First Book', 'Birinci kitabını tamamla', 'Complete your first book', 'books', 1, 'all_time', '📖', 100, 1),
  ('Kitab Kurdu', 'Bookworm', '5 kitab tamamla', 'Complete 5 books', 'books', 5, 'all_time', '📚', 250, 2),
  ('Aylıq Məqsəd', 'Monthly Goal', 'Bu ay 3 kitab dinlə', 'Listen to 3 books this month', 'books', 3, 'monthly', '🎯', 150, 3),
  ('7 Günlük Streak', '7 Day Streak', '7 gün ardıcıl dinlə', 'Listen for 7 days in a row', 'streak', 7, 'all_time', '🔥', 200, 4),
  ('Tənqidçi', 'Critic', '5 rəy yaz', 'Write 5 reviews', 'reviews', 5, 'all_time', '✍️', 150, 5),
  ('10 Saat', '10 Hours', '10 saat dinlə', 'Listen for 10 hours', 'hours', 36000, 'all_time', '⏰', 200, 6)
on conflict do nothing;

-- 7. Seed some achievements
insert into achievements (name_az, name_en, description_az, description_en, icon, category, requirement_type, requirement_value, xp_reward) values
  ('Yeni Başlayan', 'Newcomer', 'Bitig-ə xoş gəldin!', 'Welcome to Bitig!', '👋', 'special', 'signup', 1, 10),
  ('İlk Addım', 'First Step', 'İlk kitabını dinləməyə başla', 'Start listening to your first book', '👣', 'reading', 'books_started', 1, 25),
  ('Bitirici', 'Finisher', 'İlk kitabını tamamla', 'Complete your first book', '🏁', 'reading', 'books_read', 1, 50),
  ('Maraton', 'Marathon', '24 saat dinlə', 'Listen for 24 hours total', '🏃', 'reading', 'hours_listened', 86400, 100),
  ('Sosial Kəpənək', 'Social Butterfly', '10 istifadəçini izlə', 'Follow 10 users', '🦋', 'social', 'following', 10, 50),
  ('Yanğın', 'On Fire', '30 günlük streak', '30 day streak', '🔥', 'streak', 'streak_days', 30, 300)
on conflict do nothing;

-- 8. Function to check and award achievements
create or replace function check_user_achievements(p_user_id uuid)
returns void as $$
declare
  v_profile record;
  v_achievement record;
  v_progress record;
begin
  -- Get user profile
  select * into v_profile from profiles where id = p_user_id;
  
  -- Check each achievement
  for v_achievement in select * from achievements where is_secret = false loop
    -- Skip if already unlocked
    if exists (select 1 from user_achievements where user_id = p_user_id and achievement_id = v_achievement.id) then
      continue;
    end if;
    
    -- Check requirement
    case v_achievement.requirement_type
      when 'books_read' then
        if v_profile.books_read >= v_achievement.requirement_value then
          insert into user_achievements (user_id, achievement_id) values (p_user_id, v_achievement.id);
          update profiles set xp = xp + v_achievement.xp_reward where id = p_user_id;
        end if;
      when 'reviews_written' then
        if v_profile.reviews_count >= v_achievement.requirement_value then
          insert into user_achievements (user_id, achievement_id) values (p_user_id, v_achievement.id);
          update profiles set xp = xp + v_achievement.xp_reward where id = p_user_id;
        end if;
      when 'streak_days' then
        if v_profile.current_streak >= v_achievement.requirement_value then
          insert into user_achievements (user_id, achievement_id) values (p_user_id, v_achievement.id);
          update profiles set xp = xp + v_achievement.xp_reward where id = p_user_id;
        end if;
      else
        null; -- Skip unknown types
    end case;
  end loop;
  
  -- Update level based on XP (every 500 XP = 1 level)
  update profiles 
  set level = greatest(1, floor(xp / 500) + 1)
  where id = p_user_id;
end;
$$ language plpgsql security definer;
