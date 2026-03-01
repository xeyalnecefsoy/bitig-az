-- Update default groups with newly generated avatars and banners

UPDATE groups
SET 
  icon_url = '/groups/philosophy_avatar.png',
  cover_url = '/groups/philosophy_banner.png'
WHERE slug = 'felsefe';

UPDATE groups
SET 
  icon_url = '/groups/history_avatar.png',
  cover_url = '/groups/history_banner.png'
WHERE slug = 'tarix';

UPDATE groups
SET 
  icon_url = '/groups/lit_avatar.png',
  cover_url = '/groups/lit_banner.png'
WHERE slug = 'bədii-ədəbiyyat';

UPDATE groups
SET 
  icon_url = '/groups/tech_avatar.png',
  cover_url = '/groups/tech_banner.png'
WHERE slug = 'texnologiya';
