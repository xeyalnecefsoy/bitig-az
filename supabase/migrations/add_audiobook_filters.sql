alter table public.books
add column if not exists has_ambience boolean default false,
add column if not exists voice_type text default 'single' check (voice_type in ('single', 'multiple', 'radio_theater')),
add column if not exists has_sound_effects boolean default false;
