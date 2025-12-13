-- Add R2 storage fields to book_tracks table
-- This migration adds support for Cloudflare R2 audio storage

-- Add r2_key column to store the R2 object key
ALTER TABLE book_tracks ADD COLUMN IF NOT EXISTS r2_key TEXT;

-- Add format column to store audio format (opus, mp3, wav, etc.)
ALTER TABLE book_tracks ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'mp3';

-- Add file_size column for tracking storage usage
ALTER TABLE book_tracks ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Create index for faster lookups by r2_key
CREATE INDEX IF NOT EXISTS idx_book_tracks_r2_key ON book_tracks(r2_key) WHERE r2_key IS NOT NULL;

-- Comment: After running this migration, you can start uploading audio to Cloudflare R2
-- The r2_key field will store the path like: audiobooks/{book_id}/{track-title-timestamp}.opus
-- The audio_url field is kept for backwards compatibility with existing tracks
