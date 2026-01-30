import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // 발행된 글 목록
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, updated_at')
    .eq('published', true)
    .order('published_at', { ascending: false })

  const postPages: MetadataRoute.Sitemap = (posts || []).map((post) => ({
    url: `${SITE_URL}/posts/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // 프로필 목록
  const { data: profiles } = await supabase.from('profiles').select('username')

  const profilePages: MetadataRoute.Sitemap = (profiles || []).map((profile) => ({
    url: `${SITE_URL}/@${profile.username}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 1,
  }))

  return [...postPages, ...profilePages]
}
