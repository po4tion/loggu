'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import slugify from 'slugify'
import { createClient } from '@/lib/supabase/client'
import { postSchema, type PostFormData } from '@/lib/validations/post'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TiptapEditor } from '@/components/editor/tiptap-editor'
import { TagInput } from '@/components/post/tag-input'

interface PostCreateFormProps {
  authorId: string
}

export function PostCreateForm({ authorId }: PostCreateFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      cover_image_url: '',
      tags: [],
    },
  })

  const title = watch('title')

  const generateSlug = (title: string): string => {
    const baseSlug = slugify(title, {
      lower: true,
      strict: true,
      locale: 'ko',
    })
    const timestamp = Date.now().toString(36)
    return baseSlug ? `${baseSlug}-${timestamp}` : timestamp
  }

  const onSubmit = async (data: PostFormData, publish: boolean) => {
    setIsLoading(true)
    setMessage(null)

    const supabase = createClient()
    const slug = generateSlug(data.title)

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
      setMessage({ type: 'error', text: '글 저장에 실패했습니다' })
      return
    }

    // 태그 처리
    if (data.tags && data.tags.length > 0) {
      for (const tagName of data.tags) {
        // slug 생성: slugify 결과가 빈 문자열이면 base64 인코딩 사용
        let tagSlug = slugify(tagName, { lower: true, strict: true })
        if (!tagSlug) {
          tagSlug = `tag-${btoa(encodeURIComponent(tagName)).replace(/[+/=]/g, '-').toLowerCase()}`
        }

        let tagId: string | undefined

        // 먼저 INSERT 시도
        const { data: newTag, error: insertTagError } = await supabase
          .from('tags')
          .insert({ name: tagName, slug: tagSlug })
          .select('id')
          .single()

        if (insertTagError) {
          if (insertTagError.code === '23505') {
            // unique violation - 기존 태그 찾기 (전체 조회 후 클라이언트에서 필터)
            const { data: allTags } = await supabase.from('tags').select('id, name')
            const existingTag = allTags?.find((t) => t.name === tagName)
            tagId = existingTag?.id
          } else {
            continue
          }
        } else if (newTag) {
          tagId = newTag.id
        }

        // post_tags 연결
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
      window.location.href = `/posts/${post.slug}`
    } else {
      setMessage({ type: 'success', text: '임시저장되었습니다' })
    }
  }

  return (
    <form className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="cover_image_url">커버 이미지 URL</Label>
        <Input
          id="cover_image_url"
          type="url"
          placeholder="https://example.com/image.jpg"
          {...register('cover_image_url')}
        />
        {errors.cover_image_url && (
          <p className="text-destructive text-sm">{errors.cover_image_url.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">제목</Label>
        <Input
          id="title"
          placeholder="제목을 입력하세요"
          className="h-auto py-3 text-2xl font-bold"
          {...register('title')}
        />
        {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
        {title && <p className="text-muted-foreground text-xs">슬러그: {generateSlug(title)}</p>}
      </div>

      <div className="space-y-2">
        <Label>내용</Label>
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <TiptapEditor content={field.value || ''} onChange={field.onChange} />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">요약 (선택)</Label>
        <Input
          id="excerpt"
          placeholder="글의 요약을 입력하세요 (목록에 표시됩니다)"
          {...register('excerpt')}
        />
        {errors.excerpt && <p className="text-destructive text-sm">{errors.excerpt.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>태그 (선택)</Label>
        <Controller
          name="tags"
          control={control}
          render={({ field }) => (
            <TagInput value={field.value || []} onChange={field.onChange} />
          )}
        />
      </div>

      {message && (
        <p
          className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-destructive'}`}
        >
          {message.text}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleSubmit((data) => onSubmit(data, false))}
          disabled={isLoading}
        >
          {isLoading ? '저장 중...' : '임시저장'}
        </Button>
        <Button
          type="button"
          onClick={handleSubmit((data) => onSubmit(data, true))}
          disabled={isLoading}
        >
          {isLoading ? '발행 중...' : '발행하기'}
        </Button>
      </div>
    </form>
  )
}
