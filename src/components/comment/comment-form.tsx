'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { commentSchema, type CommentFormData } from '@/lib/validations/comment'
import type { Profile } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'

interface CommentFormProps {
  postId: string
  parentId?: string
  currentUser: Profile
  onSuccess?: () => void
  onCancel?: () => void
}

export function CommentForm({
  postId,
  parentId,
  currentUser,
  onSuccess,
  onCancel,
}: CommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: '',
    },
  })

  const onSubmit = async (data: CommentFormData) => {
    setIsSubmitting(true)

    const supabase = createClient()
    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      author_id: currentUser.id,
      content: data.content,
      parent_id: parentId ?? null,
    })

    setIsSubmitting(false)

    if (error) {
      form.setError('content', { message: '댓글 작성에 실패했습니다' })
      return
    }

    form.reset()
    onSuccess?.()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder={parentId ? '답글을 작성하세요...' : '댓글을 작성하세요...'}
                  className="min-h-24 resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              취소
            </Button>
          )}
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? '작성 중...' : parentId ? '답글 작성' : '댓글 작성'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
