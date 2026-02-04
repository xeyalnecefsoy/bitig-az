alter table user_books 
add column if not exists updated_at timestamp with time zone default now();
