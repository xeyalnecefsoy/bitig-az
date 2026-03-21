/** Supabase `.select()` fragment for post rows with likes, comments, polls (matches `context/social` feed). */
export const SOCIAL_POST_ENRICHED_SELECT = `
  *,
  likes (user_id),
  comments (
    id, user_id, content, created_at
  ),
  polls (
    expires_at,
    poll_options (
      id, text,
      poll_votes (user_id)
    )
  )
`
