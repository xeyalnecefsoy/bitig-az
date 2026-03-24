/** Supabase `.select()` fragment for post rows with likes, comments, polls (matches `context/social` feed). */
export const SOCIAL_POST_ENRICHED_SELECT = `
  *,
  likes (user_id),
  comments (
    id, user_id, content, created_at, parent_comment_id,
    comment_likes (user_id)
  ),
  polls (
    expires_at,
    poll_options (
      id, text,
      poll_votes (user_id)
    )
  )
`

/**
 * Same shape without nested `comment_likes` — used when the full select fails (missing table, RLS, or stale local DB).
 * Comment like counts fall back to 0 in `mapCommentFromSupabase`.
 */
export const SOCIAL_POST_FEED_SELECT_FALLBACK = `
  *,
  likes (user_id),
  comments (
    id, user_id, content, created_at, parent_comment_id
  ),
  polls (
    expires_at,
    poll_options (
      id, text,
      poll_votes (user_id)
    )
  )
`

/** No nested polls — if `polls` / `poll_votes` relation breaks PostgREST. */
export const SOCIAL_POST_FEED_SELECT_MINIMAL = `
  *,
  likes (user_id),
  comments (
    id, user_id, content, created_at, parent_comment_id
  )
`

/** Oldest-compatible comments shape (no parent_comment_id). */
export const SOCIAL_POST_FEED_SELECT_BARE = `
  *,
  likes (user_id),
  comments (
    id, user_id, content, created_at
  )
`
