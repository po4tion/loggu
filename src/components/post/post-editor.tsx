'use client'

import { TiptapEditor } from '@/components/editor/tiptap-editor'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { createClient } from '@/lib/supabase/client'
import { postSchema, type PostFormData } from '@/lib/validations/post'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlignLeft, ArrowLeft, Image as ImageIcon, Upload, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
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

interface PostEditorProps {
  authorId: string
}

export function PostEditor({ authorId }: PostEditorProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showCoverUpload, setShowCoverUpload] = useState(false)
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [coverImagePath, setCoverImagePath] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showSubtitle, setShowSubtitle] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, control, setValue } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      cover_image_url: '',
      tags: [],
    },
  })

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
    const slug = createSlug(data.title)

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        author_id: authorId,
        title: data.title,
        slug,
        content: data.content || null,
        excerpt: data.excerpt || null,
        cover_image_url: data.cover_image_url || null,
        published: publish,
      })
      .select('id, slug')
      .single()

    if (error) {
      setIsLoading(false)
      return
    }

    // 태그 처리
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
            post_id: post.id,
            tag_id: tagId,
          })
        }
      }
    }

    setIsLoading(false)

    if (publish) {
      router.push(`/posts/${post.slug}`)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="bg-background min-h-screen">
      {/* 상단 툴바 */}
      <header className="border-border/40 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          {/* 왼쪽: 뒤로가기 */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">뒤로가기</span>
          </Button>

          {/* 오른쪽: Preview, Publish */}
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
              {isLoading ? '발행 중...' : 'Publish'}
            </Button>
          </div>
        </div>
      </header>

      {/* 에디터 영역 */}
      <main className="mx-auto max-w-3xl px-4 py-12">
        {/* Add Cover / Add Subtitle 버튼 */}
        {(!coverImage || !showSubtitle) && (
          <div className="mb-8 flex items-center gap-4">
            {/* Add Cover 버튼 + Popover */}
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

            {/* Add Subtitle 버튼 */}
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

        {/* 업로드된 커버 이미지 */}
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

        {/* 제목 입력 */}
        <input
          type="text"
          placeholder="Article Title..."
          className="text-foreground placeholder:text-foreground/50 w-full border-0 bg-transparent text-4xl font-bold focus:ring-0 focus:outline-none"
          {...register('title')}
        />

        {/* 부제목 입력 */}
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

        {/* 본문 에디터 */}
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
