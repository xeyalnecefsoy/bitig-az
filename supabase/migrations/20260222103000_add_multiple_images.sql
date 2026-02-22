-- Add image_urls array column to allow multiple images per post
alter table posts
add column image_urls text[];

-- Migrate existing data (if any) from image_url to image_urls
update posts
set image_urls = array[image_url]
where image_url is not null;

-- Optionally, drop the old column (we will do this to keep it clean)
alter table posts
drop column if exists image_url;
