'use client'

import { createClient } from '@/lib/supabase/client'
import { useCallback, useEffect, useRef, useState } from 'react'
import slugify from 'slugify'

import { useDebounce } from './use-debounce'

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface AutoSaveData {
  title: string
  content: string
  excerpt?: string
  cover_image_url?: string
}

// New interface for update-only mode (postId required)
interface UseAutoSaveUpdateOptions {
  postId: string
  authorId: string
  delay?: number
}

interface UseAutoSaveUpdateReturn {
  status: AutoSaveStatus
  lastSavedAt: Date | null
  save: (data: AutoSaveData) => Promise<void>
}

// Legacy interface for backward compatibility (creates post if needed)
interface UseAutoSaveOptions {
  authorId: string
  delay?: number
}

interface UseAutoSaveReturn {
  postId: string | null
  status: AutoSaveStatus
  lastSavedAt: Date | null
  save: (data: AutoSaveData) => Promise<string | null>
}

function createSlug(title: string): string {
  const baseSlug = slugify(title, {
    lower: true,
    strict: true,
    locale: 'ko',
  })
  const timestamp = Date.now().toString(36)
  return baseSlug ? `${baseSlug}-${timestamp}` : timestamp
}

/**
 * New auto-save hook for update-only mode
 * postId is required - the post must already exist
 */
export function useAutoSaveUpdate(
  data: AutoSaveData,
  options: UseAutoSaveUpdateOptions
): UseAutoSaveUpdateReturn {
  const { postId, authorId, delay = 1000 } = options

  const [status, setStatus] = useState<AutoSaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const debouncedData = useDebounce(data, delay)
  const isFirstSave = useRef(true)
  const isSaving = useRef(false)
  const lastSavedData = useRef<string>('')

  const save = useCallback(
    async (saveData: AutoSaveData): Promise<void> => {
      if (isSaving.current) return

      // Create a hash of the data to compare
      const dataHash = JSON.stringify(saveData)
      if (dataHash === lastSavedData.current) return

      isSaving.current = true
      setStatus('saving')

      const supabase = createClient()

      try {
        // Use fallback title if empty (database constraint requires length >= 1)
        const titleToSave = saveData.title.trim() || 'Untitled'

        const { error } = await supabase
          .from('posts')
          .update({
            title: titleToSave,
            content: saveData.content || null,
            excerpt: saveData.excerpt || null,
            cover_image_url: saveData.cover_image_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', postId)
          .eq('author_id', authorId)

        if (error) {
          setStatus('error')
          isSaving.current = false
          return
        }

        lastSavedData.current = dataHash
        setStatus('saved')
        setLastSavedAt(new Date())
        isSaving.current = false
      } catch {
        setStatus('error')
        isSaving.current = false
      }
    },
    [postId, authorId]
  )

  // Auto-save when debounced data changes
  useEffect(() => {
    // Skip first render and initialize lastSavedData with initial state
    if (isFirstSave.current) {
      isFirstSave.current = false
      lastSavedData.current = JSON.stringify(debouncedData)
      return
    }

    // Save with a small delay to batch updates
    const timeoutId = setTimeout(() => {
      save(debouncedData)
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [debouncedData, save])

  return {
    status,
    lastSavedAt,
    save,
  }
}

/**
 * Legacy auto-save hook that creates a post if needed
 * Kept for backward compatibility
 */
export function useAutoSave(
  data: AutoSaveData,
  options: UseAutoSaveOptions
): UseAutoSaveReturn {
  const { authorId, delay = 1000 } = options

  const [postId, setPostId] = useState<string | null>(null)
  const [status, setStatus] = useState<AutoSaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const debouncedData = useDebounce(data, delay)
  const isFirstSave = useRef(true)
  const isSaving = useRef(false)

  const save = useCallback(
    async (saveData: AutoSaveData): Promise<string | null> => {
      if (isSaving.current) return postId

      // 제목이 없으면 저장하지 않음
      if (!saveData.title.trim()) {
        return postId
      }

      isSaving.current = true
      setStatus('saving')

      const supabase = createClient()

      try {
        if (!postId) {
          // 새 글 생성 (임시저장)
          const newSlug = createSlug(saveData.title)
          const { data: newPost, error } = await supabase
            .from('posts')
            .insert({
              author_id: authorId,
              title: saveData.title,
              slug: newSlug,
              content: saveData.content || null,
              excerpt: saveData.excerpt || null,
              cover_image_url: saveData.cover_image_url || null,
              published: false,
            })
            .select('id, slug')
            .single()

          if (error) {
            setStatus('error')
            isSaving.current = false
            return null
          }

          setPostId(newPost.id)
          setStatus('saved')
          setLastSavedAt(new Date())
          isSaving.current = false
          return newPost.id
        } else {
          // 기존 글 업데이트
          const { error } = await supabase
            .from('posts')
            .update({
              title: saveData.title,
              content: saveData.content || null,
              excerpt: saveData.excerpt || null,
              cover_image_url: saveData.cover_image_url || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', postId)

          if (error) {
            setStatus('error')
            isSaving.current = false
            return postId
          }

          setStatus('saved')
          setLastSavedAt(new Date())
          isSaving.current = false
          return postId
        }
      } catch {
        setStatus('error')
        isSaving.current = false
        return postId
      }
    },
    [authorId, postId]
  )

  // debounce된 데이터가 변경될 때마다 자동 저장
  useEffect(() => {
    // 첫 렌더링 시에는 저장하지 않음
    if (isFirstSave.current) {
      isFirstSave.current = false
      return
    }

    // 제목이 없으면 저장하지 않음
    if (!debouncedData.title.trim()) {
      return
    }

    // 비동기로 저장 실행 (lint 규칙 준수)
    const timeoutId = setTimeout(() => {
      save(debouncedData)
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [debouncedData, save])

  return {
    postId,
    status,
    lastSavedAt,
    save,
  }
}
