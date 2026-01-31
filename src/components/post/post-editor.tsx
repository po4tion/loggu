'use client'

import { TiptapEditor } from '@/components/editor/tiptap-editor'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { postSchema, type PostFormData } from '@/lib/validations/post'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Image as ImageIcon, Upload, X } from 'lucide-react'
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
  const [isUploading, setIsUploading] = useState(false)
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
    setValue('cover_image_url', urlData.publicUrl)
    setShowCoverUpload(false)
    setIsUploading(false)
  }

  const handleRemoveCover = () => {
    setCoverImage(null)
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
        {/* Add Cover 버튼 */}
        {!coverImage && (
          <div className="mb-8">
            <button
              type="button"
              onClick={() => setShowCoverUpload(true)}
              className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors"
            >
              <ImageIcon className="h-4 w-4" />
              Add Cover
            </button>
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
          className="text-foreground placeholder:text-muted-foreground/50 w-full border-0 bg-transparent text-4xl font-bold focus:ring-0 focus:outline-none"
          {...register('title')}
        />

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
              />
            )}
          />
        </div>
      </main>

      {/* 커버 업로드 모달 */}
      <Dialog open={showCoverUpload} onOpenChange={setShowCoverUpload}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
              <span className="border-b-2 border-blue-600 pb-1">Upload</span>
            </DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <div
              className="border-border hover:border-muted-foreground flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-12 transition-colors"
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
        </DialogContent>
      </Dialog>
    </div>
  )
}
