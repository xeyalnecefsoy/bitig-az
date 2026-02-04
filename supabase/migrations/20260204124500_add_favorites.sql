alter table user_books 
add column if not exists is_favorite boolean default false;

-- Create an index for faster filtering by favorite status
create index if not exists idx_user_books_is_favorite on user_books(is_favorite);
