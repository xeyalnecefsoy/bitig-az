-- Insert sample audiobook tracks for testing
-- Using free sample audio files from SoundHelix

-- First, ensure we have a book to attach tracks to
-- You can replace 'dunesaga' with any book ID from your books table

-- Add tracks for testing (using publicly available test audio files)
INSERT INTO book_tracks (book_id, title, audio_url, duration, position) VALUES
  ('dunesaga', 'Prologue: The Desert Planet', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 360, 0),
  ('dunesaga', 'Chapter 1: Arrakis Awakens', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 360, 1),
  ('dunesaga', 'Chapter 2: The Spice Must Flow', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 360, 2),
  ('dunesaga', 'Chapter 3: House Atreides', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', 360, 3),
  ('dunesaga', 'Chapter 4: The Fremen', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', 360, 4)
ON CONFLICT DO NOTHING;

-- Add tracks for another book (Atomic Habits)
INSERT INTO book_tracks (book_id, title, audio_url, duration, position) VALUES
  ('atomic', 'Introduction: The Power of Habits', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', 360, 0),
  ('atomic', 'Part 1: The Fundamentals', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', 360, 1),
  ('atomic', 'Part 2: The Four Laws', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', 360, 2)
ON CONFLICT DO NOTHING;

-- Note: These are placeholder audio files for testing purposes only.
-- Replace with actual audiobook files in production.
