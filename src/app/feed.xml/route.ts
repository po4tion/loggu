import { createClient } from '@/lib/supabase/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export async function GET() {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('posts')
    .select(
      `
      title,
      slug,
      excerpt,
      content,
      published_at,
      profiles!posts_author_id_fkey (
        username,
        display_name
      )
    `
    )
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(50)

  const feedItems = (posts || [])
    .map((post) => {
      const author = post.profiles as unknown as {
        username: string
        display_name: string | null
      }
      const authorName = author?.display_name || author?.username || 'Unknown'
      const pubDate = post.published_at
        ? new Date(post.published_at).toUTCString()
        : new Date().toUTCString()

      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${SITE_URL}/posts/${post.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/posts/${post.slug}</guid>
      <description><![CDATA[${post.excerpt || ''}]]></description>
      <pubDate>${pubDate}</pubDate>
      <author>${authorName}</author>
    </item>`
    })
    .join('')

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>loggu</title>
    <link>${SITE_URL}</link>
    <description>글을 작성하고 공유하는 블로그 플랫폼</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    ${feedItems}
  </channel>
</rss>`

  return new Response(feed, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
