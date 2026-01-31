'use client'

import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

export interface PublishedPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
  published_at: string | null
  updated_at: string
  views: number
}

async function fetchPublishedPosts(authorId: string): Promise<PublishedPost[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, cover_image_url, published_at, updated_at, views')
    .eq('author_id', authorId)
    .eq('published', true)
    .order('published_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export function usePublishedPosts(authorId: string) {
  return useQuery({
    queryKey: ['published-posts', authorId],
    queryFn: () => fetchPublishedPosts(authorId),
    enabled: !!authorId,
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  })
}
