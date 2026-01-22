-- CLEANUP DUPLICATES AND FIX COVERS

-- 1. First, let's delete existing books to clear duplicates
-- (Cascade will remove related records like book_tracks, reviews etc. - acceptable for dev reset)
delete from public.books;

-- 2. Insert clean data from lib/data.ts
insert into public.books (id, title, author, price, rating, length, cover, description, genre)
values 
  (
    'dunesaga', 
    'Dune: The Saga Begins', 
    'Frank Herbert', 
    14.99, 
    4.8, 
    '21h 2m', 
    '/dune.jpg', 
    'A sweeping epic of politics, religion, and ecology on the desert planet Arrakis.',
    'Sci-Fi'
  ),
  (
    'atomic', 
    'Atomic Habits', 
    'James Clear', 
    11.99, 
    4.7, 
    '5h 35m', 
    '/atomic_habits.jpg', 
    'Build better habits and systems for continuous improvement with practical strategies.',
    'Nonfiction'
  ),
  (
    'hobbit', 
    'The Hobbit', 
    'J.R.R. Tolkien', 
    12.49, 
    4.9, 
    '10h 24m', 
    '/the_hobbit.jpg', 
    'Bilbo Baggins embarks on an unexpected journey filled with dragons and dwarves.',
    'Fantasy'
  ),
  (
    'martian', 
    'The Martian', 
    'Andy Weir', 
    13.99, 
    4.6, 
    '10h 53m', 
    '/martian.jpg', 
    'A stranded astronaut fights to survive on Mars using ingenuity and humor.',
    'Sci-Fi'
  ),
  (
    'becoming', 
    'Becoming', 
    'Michelle Obama', 
    10.99, 
    4.8, 
    '19h 3m', 
    '/becoming.jpg', 
    'An intimate, powerful memoir by the former First Lady of the United States.',
    'Memoir'
  ),
  (
    'sapiens', 
    'Sapiens: A Brief History of Humankind', 
    'Yuval Noah Harari', 
    15.49, 
    4.7, 
    '15h 17m', 
    '/sapiens.jpg', 
    'A profound exploration of humanity’s past and our impact on the world.',
    'History'
  );

-- 3. Add tracks for these books (Sample tracks)
insert into public.book_tracks (title, duration, audio_url, book_id, position)
select 
  'Chapter 1', 
  300, 
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  id,
  1
from public.books;
