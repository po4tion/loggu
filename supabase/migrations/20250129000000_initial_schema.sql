-- ============================================
-- Blog Platform Initial Schema
-- ============================================
-- This migration creates all tables, functions, triggers, indexes, and RLS policies
-- Based on docs/DATABASE.md specification

-- ============================================
-- 1. FUNCTIONS
-- ============================================

-- Function: update_updated_at_column
-- Automatically updates the updated_at column on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: set_published_at_timestamp
-- Automatically sets published_at when post is published
CREATE OR REPLACE FUNCTION set_published_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Set published_at when published becomes true and published_at is NULL
  IF NEW.published = true AND NEW.published_at IS NULL THEN
    NEW.published_at = NOW();
  END IF;

  -- Clear published_at when published becomes false
  IF NEW.published = false THEN
    NEW.published_at = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: handle_new_user
-- Creates a profile automatically when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_name', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: increment_post_views
-- Increments view count for a post (bypasses RLS)
CREATE OR REPLACE FUNCTION increment_post_views(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET views = views + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. TABLES
-- ============================================

-- Table: profiles
-- User profile information (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL CHECK (length(username) >= 3 AND length(username) <= 30),
  display_name TEXT CHECK (length(display_name) <= 50),
  bio TEXT CHECK (length(bio) <= 500),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$')
);

COMMENT ON TABLE profiles IS 'User profile information';
COMMENT ON COLUMN profiles.username IS 'Unique username (used in URL)';
COMMENT ON COLUMN profiles.display_name IS 'Display name';
COMMENT ON COLUMN profiles.bio IS 'User bio (max 500 chars)';

-- Table: posts
-- Blog posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
  slug TEXT UNIQUE NOT NULL CHECK (length(slug) >= 1 AND length(slug) <= 200),
  content TEXT,
  excerpt TEXT CHECK (length(excerpt) <= 500),
  cover_image_url TEXT,
  published BOOLEAN DEFAULT false NOT NULL,
  published_at TIMESTAMPTZ,
  views INTEGER DEFAULT 0 NOT NULL CHECK (views >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT published_at_check CHECK (
    (published = false AND published_at IS NULL) OR
    (published = true AND published_at IS NOT NULL)
  )
);

COMMENT ON TABLE posts IS 'Blog posts';
COMMENT ON COLUMN posts.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN posts.excerpt IS 'Post summary (max 500 chars)';
COMMENT ON COLUMN posts.published IS 'Publication status';
COMMENT ON COLUMN posts.published_at IS 'Publication timestamp (only when published=true)';

-- Table: tags
-- Tag information
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL CHECK (length(name) >= 1 AND length(name) <= 50),
  slug TEXT UNIQUE NOT NULL CHECK (length(slug) >= 1 AND length(slug) <= 50),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT tag_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

COMMENT ON TABLE tags IS 'Tag information';
COMMENT ON COLUMN tags.name IS 'Tag display name (e.g., JavaScript)';
COMMENT ON COLUMN tags.slug IS 'Tag URL identifier (e.g., javascript)';

-- Table: post_tags
-- Many-to-many relationship between posts and tags
CREATE TABLE post_tags (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  PRIMARY KEY (post_id, tag_id)
);

COMMENT ON TABLE post_tags IS 'Post-tag junction table';

-- Table: comments
-- Comments with nested replies support
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT no_self_parent CHECK (id != parent_id)
);

COMMENT ON TABLE comments IS 'Comments with nested reply support';
COMMENT ON COLUMN comments.parent_id IS 'Parent comment ID (for replies)';
COMMENT ON COLUMN comments.content IS 'Comment content (1-2000 chars)';

-- Table: likes
-- Post likes
CREATE TABLE likes (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  PRIMARY KEY (user_id, post_id)
);

COMMENT ON TABLE likes IS 'Post likes';

-- ============================================
-- 3. INDEXES
-- ============================================

-- profiles indexes
CREATE INDEX idx_profiles_username ON profiles(username);

-- posts indexes
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_published ON posts(published, published_at DESC) WHERE published = true;
CREATE INDEX idx_posts_created ON posts(created_at DESC);

-- tags indexes
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_name ON tags(name);

-- post_tags indexes
CREATE INDEX idx_post_tags_post ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag ON post_tags(tag_id);

-- comments indexes
CREATE INDEX idx_comments_post ON comments(post_id, created_at DESC);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_parent ON comments(parent_id) WHERE parent_id IS NOT NULL;

-- likes indexes
CREATE INDEX idx_likes_post ON likes(post_id);
CREATE INDEX idx_likes_user ON likes(user_id);
CREATE INDEX idx_likes_created ON likes(created_at DESC);

-- ============================================
-- 4. TRIGGERS
-- ============================================

-- Trigger: update_profiles_updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: update_posts_updated_at
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: set_published_at
CREATE TRIGGER set_published_at
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION set_published_at_timestamp();

-- Trigger: update_comments_updated_at
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: on_auth_user_created
-- Automatically creates a profile when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES
-- ============================================

-- profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- posts policies
CREATE POLICY "Published posts and own posts are viewable"
  ON posts FOR SELECT
  USING (published = true OR auth.uid() = author_id);

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = author_id);

-- tags policies
CREATE POLICY "Tags are viewable by everyone"
  ON tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create tags"
  ON tags FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- post_tags policies
CREATE POLICY "Post tags are viewable by everyone"
  ON post_tags FOR SELECT
  USING (true);

CREATE POLICY "Users can add tags to own posts"
  ON post_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_tags.post_id
      AND posts.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tags from own posts"
  ON post_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_tags.post_id
      AND posts.author_id = auth.uid()
    )
  );

-- comments policies
CREATE POLICY "Comments on published posts are viewable"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = comments.post_id
      AND posts.published = true
    )
  );

CREATE POLICY "Authenticated users can create comments on published posts"
  ON comments FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = comments.post_id
      AND posts.published = true
    )
  );

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = author_id);

-- likes policies
CREATE POLICY "Likes are viewable by everyone"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like published posts"
  ON likes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = likes.post_id
      AND posts.published = true
    )
  );

CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 7. QUERY FUNCTIONS
-- ============================================

-- Function: get_posts_with_tags
-- Returns posts with author info, tags, and like count (optimized query)
CREATE OR REPLACE FUNCTION get_posts_with_tags(
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
    COUNT(l.user_id) AS likes_count
  FROM posts p
  INNER JOIN profiles prof ON p.author_id = prof.id
  LEFT JOIN post_tags pt ON p.id = pt.post_id
  LEFT JOIN tags t ON pt.tag_id = t.id
  LEFT JOIN likes l ON p.id = l.post_id
  WHERE p.published = true
  GROUP BY p.id, prof.id
  ORDER BY p.published_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_posts_with_tags IS 'Returns published posts with author info, tags, and like count';
