-- 검색 기능을 위한 마이그레이션

-- 1. pg_trgm 확장 활성화 (퍼지 검색)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. 검색 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_posts_title_trgm ON posts USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_posts_content_trgm ON posts USING gin(content gin_trgm_ops);

-- 3. 검색 함수 생성
CREATE OR REPLACE FUNCTION search_posts(
  search_query TEXT DEFAULT NULL,
  author_username_filter TEXT DEFAULT NULL,
  sort_by TEXT DEFAULT 'latest',
  limit_count INTEGER DEFAULT 20,
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
  author_id UUID,
  author_username TEXT,
  author_display_name TEXT,
  author_avatar_url TEXT,
  tags JSONB,
  likes_count BIGINT
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
    prof.id AS author_id,
    prof.username AS author_username,
    prof.display_name AS author_display_name,
    prof.avatar_url AS author_avatar_url,
    COALESCE(
      jsonb_agg(
        jsonb_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
      ) FILTER (WHERE t.id IS NOT NULL),
      '[]'::jsonb
    ) AS tags,
    COUNT(DISTINCT l.user_id) AS likes_count
  FROM posts p
  INNER JOIN profiles prof ON p.author_id = prof.id
  LEFT JOIN post_tags pt ON p.id = pt.post_id
  LEFT JOIN tags t ON pt.tag_id = t.id
  LEFT JOIN likes l ON p.id = l.post_id
  WHERE p.published = true
    AND (
      search_query IS NULL
      OR search_query = ''
      OR p.title ILIKE '%' || search_query || '%'
      OR p.content ILIKE '%' || search_query || '%'
    )
    AND (
      author_username_filter IS NULL
      OR author_username_filter = ''
      OR prof.username = author_username_filter
    )
  GROUP BY p.id, prof.id
  ORDER BY
    CASE WHEN sort_by = 'latest' THEN p.published_at END DESC,
    CASE WHEN sort_by = 'oldest' THEN p.published_at END ASC,
    CASE WHEN sort_by = 'popular' THEN COUNT(DISTINCT l.user_id) END DESC,
    CASE WHEN sort_by = 'views' THEN p.views END DESC,
    p.published_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION search_posts IS '검색, 필터, 정렬 기능이 포함된 게시글 조회 함수';
