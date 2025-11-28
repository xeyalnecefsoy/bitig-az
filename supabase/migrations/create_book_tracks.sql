-- Create book_tracks table
create table if not exists book_tracks (
  id uuid default gen_random_uuid() primary key,
  book_id text references books(id) on delete cascade not null,
  title text not null,
  audio_url text not null,
  duration integer, -- in seconds
  position integer default 0, -- for ordering
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table book_tracks enable row level security;

-- Policies
drop policy if exists "Public tracks are viewable by everyone." on book_tracks;
create policy "Public tracks are viewable by everyone." on book_tracks for select using (true);

drop policy if exists "Admins can manage tracks." on book_tracks;
create policy "Admins can manage tracks." on book_tracks for all using (is_admin());

-- Create index for ordering
create index if not exists idx_book_tracks_book_id_position on book_tracks(book_id, position);

-- Storage bucket for audiobooks (if not exists)
insert into storage.buckets (id, name, public)
values ('audiobooks', 'audiobooks', true)
on conflict (id) do nothing;

-- Storage policies
drop policy if exists "Audiobooks are publicly accessible" on storage.objects;
create policy "Audiobooks are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'audiobooks' );

drop policy if exists "Admins can upload audiobooks" on storage.objects;
create policy "Admins can upload audiobooks"
  on storage.objects for insert
  with check ( bucket_id = 'audiobooks' and is_admin() );

drop policy if exists "Admins can update audiobooks" on storage.objects;
create policy "Admins can update audiobooks"
  on storage.objects for update
  using ( bucket_id = 'audiobooks' and is_admin() );

drop policy if exists "Admins can delete audiobooks" on storage.objects;
create policy "Admins can delete audiobooks"
  on storage.objects for delete
  using ( bucket_id = 'audiobooks' and is_admin() );
