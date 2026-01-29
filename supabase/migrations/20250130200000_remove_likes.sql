-- Remove likes feature
-- Drop RLS policies first
DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
DROP POLICY IF EXISTS "Users can like posts" ON likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON likes;

-- Drop the likes table
DROP TABLE IF EXISTS likes;

-- Update search_posts function to remove likes_count
DROP FUNCTION IF EXISTS search_posts(TEXT, TEXT, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION search_posts(
  search_query TEXT DEFAULT NULL,
  author_username_filter TEXT DEFAULT NULL,
  sort_by TEXT DEFAULT 'latest',
  limit_count INTEGER DEFAULT 12,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  excerpt TEXT,
  cover_image_url TEXT,
  published_at TIMESTAMPTZ,
  views INTEGER,
  author_username TEXT,
  author_display_name TEXT,
  author_avatar_url TEXT,
  tags TEXT,
  reading_time_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.slug,
    p.excerpt,
    p.cover_image_url,
    p.published_at,
    p.views,
    pr.username AS author_username,
    pr.display_name AS author_display_name,
    pr.avatar_url AS author_avatar_url,
    (
      SELECT json_agg(t.name)::TEXT
      FROM post_tags pt
      JOIN tags t ON t.id = pt.tag_id
      WHERE pt.post_id = p.id
    ) AS tags,
    p.reading_time_minutes
  FROM posts p
  JOIN profiles pr ON pr.id = p.author_id
  WHERE p.published = true
    AND (
      search_query IS NULL
      OR search_query = ''
      OR p.title ILIKE '%' || search_query || '%'
      OR p.excerpt ILIKE '%' || search_query || '%'
      OR p.content ILIKE '%' || search_query || '%'
      OR EXISTS (
        SELECT 1
        FROM post_tags pt
        JOIN tags t ON t.id = pt.tag_id
        WHERE pt.post_id = p.id
          AND t.name ILIKE '%' || search_query || '%'
      )
    )
    AND (
      author_username_filter IS NULL
      OR author_username_filter = ''
      OR pr.username = author_username_filter
    )
  ORDER BY
    CASE WHEN sort_by = 'latest' THEN p.published_at END DESC,
    CASE WHEN sort_by = 'oldest' THEN p.published_at END ASC,
    CASE WHEN sort_by = 'views' THEN p.views END DESC,
    p.published_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;
