'use server'

import { createClient } from '@/lib/supabase/server'

interface CreateDraftResult {
  id: string
  slug: string
}

export async function createDraft(authorId: string): Promise<CreateDraftResult | null> {
  const supabase = await createClient()

  // Generate unique slug for draft
  const timestamp = Date.now().toString(36)
  const randomSuffix = Math.random().toString(36).substring(2, 6)
  const slug = `draft-${timestamp}-${randomSuffix}`

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: authorId,
      title: 'Untitled',
      slug,
      content: null,
      excerpt: null,
      cover_image_url: null,
      published: false,
    })
    .select('id, slug')
    .single()

  if (error) {
    console.error('Failed to create draft:', error)
    return null
  }

  return data
}

export async function deleteDraft(postId: string, authorId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('author_id', authorId)
    .eq('published', false)

  if (error) {
    console.error('Failed to delete draft:', error)
    return false
  }

  return true
}
