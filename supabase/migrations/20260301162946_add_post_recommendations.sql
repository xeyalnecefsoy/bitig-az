-- Migration: Add For You Post Recommendations Algorithm

-- 1. Create a function to get recommended posts
CREATE OR REPLACE FUNCTION get_recommended_posts_v1(p_user_id UUID, p_limit INT DEFAULT 20, p_offset INT DEFAULT 0)
RETURNS SETOF posts -- assuming we return standard post rows, but usually we return a custom table or just ordered posts
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.*
  FROM 
    posts p
  LEFT JOIN 
    likes l ON l.post_id = p.id
  LEFT JOIN 
    comments c ON c.post_id = p.id
  LEFT JOIN
    follows f ON f.following_id = p.user_id AND f.follower_id = p_user_id
  WHERE 
    -- Only consider posts from the last 14 days to keep the query fast and relevant
    p.created_at >= NOW() - INTERVAL '14 days'
  GROUP BY 
    p.id, f.id
  ORDER BY 
    -- The core algorithm: 
    -- Score = (Likes * 2.0) + (Comments * 3.0)
    -- Multiplier = 1.5 if the user follows the author, otherwise 1.0
    -- Gravity / Time Decay = (1 + hours_since_posted)^1.5
    (
      ( (COUNT(DISTINCT l.id) * 2.0) + (COUNT(DISTINCT c.id) * 3.0) )
      * (CASE WHEN f.id IS NOT NULL THEN 1.5 ELSE 1.0 END)
    ) / NULLIF(POWER(1 + EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600.0, 1.5), 0) DESC,
    p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
