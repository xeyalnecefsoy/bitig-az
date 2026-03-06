-- Add status columns to posts and comments for moderation
alter table public.posts 
  add column if not exists status text default 'pending' 
  check (status in ('pending', 'approved', 'flagged', 'rejected'));

alter table public.comments
  add column if not exists status text default 'pending'
  check (status in ('pending', 'approved', 'flagged', 'rejected'));

-- Create AI Moderation Logs Table
create table if not exists public.ai_moderation_logs (
  id uuid default gen_random_uuid() primary key,
  entity_id uuid not null, -- the ID of the post or comment
  entity_type text not null check (entity_type in ('post', 'comment')),
  action text not null check (action in ('approved', 'flagged', 'error')),
  reason text, -- The explanation returned by DeepSeek API
  confidence numeric(5,2), -- Optional confidence score from AI
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on logs
alter table public.ai_moderation_logs enable row level security;

-- Only admins can view moderation logs
create policy "Admins can view moderation logs" 
  on public.ai_moderation_logs 
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coadmin', 'superadmin'))
  );

-- Admins can manage moderation logs
create policy "Admins can insert moderation logs" 
  on public.ai_moderation_logs 
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coadmin', 'superadmin'))
  );

-- The Edge function uses service_role key, so it bypasses RLS for inserting logs.
