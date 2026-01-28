-- ============================================
-- Seed Data for Blog Platform
-- ============================================
-- This file contains initial data for the blog platform
-- Run with: supabase db reset (includes migrations + seed)

-- Insert default tags
-- These are common programming/tech tags for a dev blog
INSERT INTO tags (name, slug) VALUES
  ('JavaScript', 'javascript'),
  ('TypeScript', 'typescript'),
  ('React', 'react'),
  ('Next.js', 'nextjs'),
  ('Node.js', 'nodejs'),
  ('PostgreSQL', 'postgresql'),
  ('Supabase', 'supabase'),
  ('Tailwind CSS', 'tailwind-css')
ON CONFLICT (slug) DO NOTHING;
