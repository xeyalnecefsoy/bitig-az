-- 1. Create a public storage bucket for group images
insert into storage.buckets (id, name, public) 
values ('groups', 'groups', true) 
on conflict do nothing;

-- 2. Update existing group records to point to the new Supabase Storage bucket URLs
UPDATE public.groups 
SET 
  cover_url = 'https://gqqbjzakyjevgpjvnlmb.supabase.co/storage/v1/object/public/groups/philosophy_banner.png',
  icon_url = 'https://gqqbjzakyjevgpjvnlmb.supabase.co/storage/v1/object/public/groups/philosophy_avatar.png' 
WHERE slug = 'felsefe';

UPDATE public.groups 
SET 
  cover_url = 'https://gqqbjzakyjevgpjvnlmb.supabase.co/storage/v1/object/public/groups/history_banner.png',
  icon_url = 'https://gqqbjzakyjevgpjvnlmb.supabase.co/storage/v1/object/public/groups/history_avatar.png' 
WHERE slug = 'tarix';

UPDATE public.groups 
SET 
  cover_url = 'https://gqqbjzakyjevgpjvnlmb.supabase.co/storage/v1/object/public/groups/lit_banner.png',
  icon_url = 'https://gqqbjzakyjevgpjvnlmb.supabase.co/storage/v1/object/public/groups/lit_avatar.png' 
WHERE slug = 'bədii-ədəbiyyat';

UPDATE public.groups 
SET 
  cover_url = 'https://gqqbjzakyjevgpjvnlmb.supabase.co/storage/v1/object/public/groups/tech_banner.png',
  icon_url = 'https://gqqbjzakyjevgpjvnlmb.supabase.co/storage/v1/object/public/groups/tech_avatar.png' 
WHERE slug = 'texnologiya';
