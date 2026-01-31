'use client'

import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

export interface DraftPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
  updated_at: string
  created_at: string
}

async function fetchDrafts(authorId: string): Promise<DraftPost[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, cover_image_url, updated_at, created_at')
    .eq('author_id', authorId)
    .eq('published', false)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export function useDrafts(authorId: string) {
  return useQuery({
    queryKey: ['drafts', authorId],
    queryFn: () => fetchDrafts(authorId),
    enabled: !!authorId,
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  })
}
