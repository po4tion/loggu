'use client'

import { TiptapEditor } from '@/components/editor/tiptap-editor'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAutoSaveUpdate, type AutoSaveStatus } from '@/lib/hooks/use-auto-save'
import { createClient } from '@/lib/supabase/client'
import { postSchema, type PostFormData } from '@/lib/validations/post'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlignLeft,
  ArrowLeft,
  Check,
  Cloud,
  Image as ImageIcon,
  Loader2,
  Upload,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import slugify from 'slugify'

function createSlug(title: string): string {
  const baseSlug = slugify(title, {
    lower: true,
    strict: true,
    locale: 'ko',
  })
  const timestamp = Date.now().toString(36)
  return baseSlug ? `${baseSlug}-${timestamp}` : timestamp
}

function formatLastSaved(date: Date | null): string {
  if (!date) return ''
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 5) return '방금 저장됨'
  if (diffSec < 60) return `${diffSec}초 전 저장됨`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}분 전 저장됨`
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function AutoSaveIndicator({
  status,
  lastSavedAt,
}: {
  status: AutoSaveStatus
  lastSavedAt: Date | null
}) {
  const [displayTime, setDisplayTime] = useState<string>('')
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    if (status === 'saved') {
      const showTimer = setTimeout(() => {
        setShowSaved(true)
      }, 0)
      const hideTimer = setTimeout(() => {
        setShowSaved(false)
      }, 2000)
      return () => {
        clearTimeout(showTimer)
        clearTimeout(hideTimer)
      }
    }
  }, [status, lastSavedAt])

  useEffect(() => {
    if (!lastSavedAt) return

    const updateTime = () => {
      setDisplayTime(formatLastSaved(lastSavedAt))
    }
    updateTime()

    const interval = setInterval(updateTime, 10000)
    return () => clearInterval(interval)
  }, [lastSavedAt])

  if (status === 'idle' && !lastSavedAt) {
    return null
  }

  if (status === 'saving') {
    return (
      <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>저장 중...</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-1.5 text-sm text-red-500">
        <X className="h-3.5 w-3.5" />
        <span>저장 실패</span>
      </div>
    )
  }

  if (showSaved || (status === 'saved' && lastSavedAt)) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-500">
        <Check className="h-3.5 w-3.5" />
        <span>{showSaved ? '저장됨' : displayTime}</span>
      </div>
    )
  }

  if (lastSavedAt) {
    return (
      <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <Cloud className="h-3.5 w-3.5" />
        <span>{displayTime}</span>
      </div>
    )
  }

  return null
}

export interface UnifiedPostEditorInitialData {
  title: string
  content: string | null
  excerpt: string | null
  cover_image_url: string | null
  published: boolean
  slug: string
}

interface UnifiedPostEditorProps {
  postId: string
  authorId: string
  initialData: UnifiedPostEditorInitialData
}

export function UnifiedPostEditor({ postId, authorId, initialData }: UnifiedPostEditorProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [showCoverUpload, setShowCoverUpload] = useState(false)
  const [coverImage, setCoverImage] = useState<string | null>(initialData.cover_image_url)
  const [coverImagePath, setCoverImagePath] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showSubtitle, setShowSubtitle] = useState(!!initialData.excerpt)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, control, setValue } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: initialData.title,
      content: initialData.content || '',
      excerpt: initialData.excerpt || '',
      cover_image_url: initialData.cover_image_url || '',
      tags: [],
    },
  })

  const watchedTitle = useWatch({ control, name: 'title' })
  const watchedContent = useWatch({ control, name: 'content' })
  const watchedExcerpt = useWatch({ control, name: 'excerpt' })
  const watchedCoverImage = useWatch({ control, name: 'cover_image_url' })

  const { status, lastSavedAt } = useAutoSaveUpdate(
    {
      title: watchedTitle || '',
      content: watchedContent || '',
      excerpt: watchedExcerpt || '',
      cover_image_url: watchedCoverImage || '',
    },
    { postId, authorId, delay: 1000 }
  )

  // Invalidate drafts/published queries after save
  useEffect(() => {
    if (status === 'saved') {
      queryClient.invalidateQueries({ queryKey: ['drafts', authorId] })
      queryClient.invalidateQueries({ queryKey: ['published-posts', authorId] })
    }
  }, [status, queryClient, authorId])

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  const handleCoverUpload = async (file: File) => {
    if (!allowedTypes.includes(file.type)) return

    setIsUploading(true)
    const supabase = createClient()

    const fileExt = file.name.split('.').pop()
    const fileName = `${authorId}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage.from('covers').upload(fileName, file)

    if (error) {
      setIsUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('covers').getPublicUrl(data.path)

    setCoverImage(urlData.publicUrl)
    setCoverImagePath(data.path)
    setValue('cover_image_url', urlData.publicUrl)
    setShowCoverUpload(false)
    setIsUploading(false)
  }

  const handleRemoveCover = async () => {
    if (coverImagePath) {
      const supabase = createClient()
      await supabase.storage.from('covers').remove([coverImagePath])
    }
    setCoverImage(null)
    setCoverImagePath(null)
    setValue('cover_image_url', '')
  }

  const onSubmit = async (data: PostFormData, publish: boolean) => {
    setIsLoading(true)

    const supabase = createClient()

    // Use fallback title if empty (database constraint requires length >= 1)
    const titleToSave = data.title.trim() || 'Untitled'

    // Update slug if publishing and title changed
    const newSlug =
      publish && titleToSave !== initialData.title ? createSlug(titleToSave) : initialData.slug

    const { data: post, error } = await supabase
      .from('posts')
      .update({
        title: titleToSave,
        slug: newSlug,
        content: data.content || null,
        excerpt: data.excerpt || null,
        cover_image_url: data.cover_image_url || null,
        published: publish,
        published_at: publish && !initialData.published ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .select('id, slug')
      .single()

    if (error) {
      setIsLoading(false)
      return
    }

    // Handle tags
    await supabase.from('post_tags').delete().eq('post_id', postId)

    if (data.tags && data.tags.length > 0) {
      for (const tagName of data.tags) {
        let tagSlug = slugify(tagName, { lower: true, strict: true })
        if (!tagSlug) {
          tagSlug = `tag-${btoa(encodeURIComponent(tagName)).replace(/[+/=]/g, '-').toLowerCase()}`
        }

        let tagId: string | undefined

        const { data: newTag, error: insertTagError } = await supabase
          .from('tags')
          .insert({ name: tagName, slug: tagSlug })
          .select('id')
          .single()

        if (insertTagError) {
          if (insertTagError.code === '23505') {
            const { data: allTags } = await supabase.from('tags').select('id, name')
            const existingTag = allTags?.find((t) => t.name === tagName)
            tagId = existingTag?.id
          } else {
            continue
          }
        } else if (newTag) {
          tagId = newTag.id
        }

        if (tagId) {
          await supabase.from('post_tags').insert({
            post_id: postId,
            tag_id: tagId,
          })
        }
      }
    }

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['drafts', authorId] })
    queryClient.invalidateQueries({ queryKey: ['published-posts', authorId] })

    setIsLoading(false)

    if (publish) {
      router.push(`/posts/${post.slug}`)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="bg-background min-h-full">
      {/* Header */}
      <header className="border-border/40 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">홈으로</span>
          </Button>

          <div className="absolute left-1/2 -translate-x-1/2">
            <AutoSaveIndicator status={status} lastSavedAt={lastSavedAt} />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSubmit((data) => onSubmit(data, false))}
              disabled={isLoading}
            >
              {isLoading ? '저장 중...' : 'Preview'}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit((data) => onSubmit(data, true))}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? '발행 중...' : initialData.published ? 'Update' : 'Publish'}
            </Button>
          </div>
        </div>
      </header>

      {/* Editor Area */}
      <main className="mx-auto max-w-3xl px-4 py-12">
        {/* Add Cover / Add Subtitle buttons */}
        {(!coverImage || !showSubtitle) && (
          <div className="mb-8 flex items-center gap-4">
            {!coverImage && (
              <Popover open={showCoverUpload} onOpenChange={setShowCoverUpload}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="text-foreground/70 hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Add Cover
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[500px] p-0" sideOffset={8}>
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <span className="text-sm font-medium">Upload</span>
                    <button
                      type="button"
                      onClick={() => setShowCoverUpload(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-4">
                    <div
                      className="border-border hover:border-muted-foreground flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-10 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <button
                        type="button"
                        className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors"
                        disabled={isUploading}
                      >
                        <Upload className="h-4 w-4" />
                        {isUploading ? 'Uploading...' : 'Upload Image'}
                      </button>
                      <p className="text-muted-foreground mt-3 text-sm">
                        Recommended dimension is 1600 × 840
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleCoverUpload(file)
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {!showSubtitle && (
              <button
                type="button"
                onClick={() => setShowSubtitle(true)}
                className="text-foreground/70 hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
              >
                <AlignLeft className="h-4 w-4" />
                Add Subtitle
              </button>
            )}
          </div>
        )}

        {/* Cover Image */}
        {coverImage && (
          <div className="group relative mb-8 aspect-[1600/840] w-full overflow-hidden rounded-lg">
            <Image src={coverImage} alt="Cover" fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={handleRemoveCover}
              className="bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground absolute top-3 right-3 rounded-md p-2 opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100"
              title="Remove cover"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Title */}
        <input
          type="text"
          placeholder="Article Title..."
          className="text-foreground placeholder:text-foreground/50 w-full border-0 bg-transparent text-4xl font-bold focus:ring-0 focus:outline-none"
          {...register('title')}
        />

        {/* Subtitle */}
        {showSubtitle && (
          <div className="mt-4 flex items-center gap-2">
            <input
              type="text"
              placeholder="Article Subtitle..."
              autoComplete="off"
              className="text-foreground placeholder:text-foreground/50 flex-1 border-0 bg-transparent text-xl focus:ring-0 focus:outline-none"
              {...register('excerpt')}
            />
            <button
              type="button"
              onClick={() => {
                setShowSubtitle(false)
                setValue('excerpt', '')
              }}
              className="text-muted-foreground hover:text-foreground p-1 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Content Editor */}
        <div className="mt-8">
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <TiptapEditor
                content={field.value || ''}
                onChange={field.onChange}
                placeholder="Type '/' for commands..."
                minimal
                authorId={authorId}
              />
            )}
          />
        </div>
      </main>
    </div>
  )
}
