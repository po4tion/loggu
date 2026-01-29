-- 읽는 시간(reading_time_minutes) 컬럼 추가

-- 1. posts 테이블에 reading_time_minutes 컬럼 추가
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER DEFAULT 1;

-- 2. 읽는 시간 계산 함수 생성
CREATE OR REPLACE FUNCTION calculate_reading_time(content TEXT)
RETURNS INTEGER AS $$
BEGIN
  -- 한글 기준 분당 약 500자 읽기 속도로 계산, 최소 1분
  RETURN GREATEST(1, CEIL(LENGTH(COALESCE(content, '')) / 500.0))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. 트리거 함수: 글 저장 시 자동으로 읽는 시간 계산
CREATE OR REPLACE FUNCTION update_reading_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.reading_time_minutes := calculate_reading_time(NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 트리거 생성 (INSERT, UPDATE 시 실행)
DROP TRIGGER IF EXISTS trigger_update_reading_time ON posts;
CREATE TRIGGER trigger_update_reading_time
  BEFORE INSERT OR UPDATE OF content ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_reading_time();

-- 5. 기존 게시글의 읽는 시간 업데이트
UPDATE posts SET reading_time_minutes = calculate_reading_time(content);

-- 6. 기존 search_posts 함수 삭제 후 재생성 (반환 타입 변경을 위해)
DROP FUNCTION IF EXISTS search_posts(TEXT, TEXT, TEXT, INTEGER, INTEGER);

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
  likes_count BIGINT,
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
    COUNT(DISTINCT l.user_id) AS likes_count,
    p.reading_time_minutes
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

COMMENT ON FUNCTION search_posts IS '검색, 필터, 정렬, 읽는 시간 기능이 포함된 게시글 조회 함수';
