-- Seed books table with initial audiobook data
-- Use ON CONFLICT to update existing records or insert new ones
INSERT INTO books (id, title, author, price, rating, length, cover, description, genre) VALUES
  ('dunesaga', 'Dune: The Saga Begins', 'Frank Herbert', 14.99, 4.8, '21h 2m', '/dune.jpg', 'A sweeping epic of politics, religion, and ecology on the desert planet Arrakis.', 'Sci-Fi'),
  ('atomic', 'Atomic Habits', 'James Clear', 11.99, 4.7, '5h 35m', '/atomic_habits.jpg', 'Build better habits and systems for continuous improvement with practical strategies.', 'Nonfiction'),
  ('hobbit', 'The Hobbit', 'J.R.R. Tolkien', 12.49, 4.9, '10h 24m', '/the_hobbit.jpg', 'Bilbo Baggins embarks on an unexpected journey filled with dragons and dwarves.', 'Fantasy'),
  ('martian', 'The Martian', 'Andy Weir', 13.99, 4.6, '10h 53m', '/martian.jpg', 'A stranded astronaut fights to survive on Mars using ingenuity and humor.', 'Sci-Fi'),
  ('becoming', 'Becoming', 'Michelle Obama', 10.99, 4.8, '19h 3m', '/becoming.jpg', 'An intimate, powerful memoir by the former First Lady of the United States.', 'Memoir'),
  ('sapiens', 'Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', 15.49, 4.7, '15h 17m', '/sapiens.jpg', 'A profound exploration of humanity''s past and our impact on the world.', 'History')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  price = EXCLUDED.price,
  rating = EXCLUDED.rating,
  length = EXCLUDED.length,
  cover = EXCLUDED.cover,
  description = EXCLUDED.description,
  genre = EXCLUDED.genre;
