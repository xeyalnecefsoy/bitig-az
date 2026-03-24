/** Supabase `.select()` fragment for post rows with likes, comments, polls (matches social context feed). */
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

/** Used when full select fails (e.g. missing `comment_likes` table on this Supabase project). */
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

export const SOCIAL_POST_FEED_SELECT_MINIMAL = `
  *,
  likes (user_id),
  comments (
    id, user_id, content, created_at, parent_comment_id
  )
`

export const SOCIAL_POST_FEED_SELECT_BARE = `
  *,
  likes (user_id),
  comments (
    id, user_id, content, created_at
  )
`
