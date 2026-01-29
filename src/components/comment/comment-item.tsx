'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { commentSchema, type CommentFormData } from '@/lib/validations/comment'
import type { CommentWithAuthor, Profile } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'

interface CommentItemProps {
  comment: CommentWithAuthor
  currentUser: Profile | null
  isReply?: boolean
  onReplyClick?: () => void
  onUpdate: () => void
}

export function CommentItem({
  comment,
  currentUser,
  isReply = false,
  onReplyClick,
  onUpdate,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const isAuthor = currentUser?.id === comment.author_id
  const displayName = comment.author.display_name || comment.author.username
  const initials = displayName.slice(0, 2).toUpperCase()
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: ko,
  })

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: comment.content,
    },
  })

  const handleDelete = async () => {
    if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      return
    }

    setIsDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('comments').delete().eq('id', comment.id)

    setIsDeleting(false)

    if (error) {
      alert('삭제에 실패했습니다')
      return
    }

    onUpdate()
  }

  const handleEditSubmit = async (data: CommentFormData) => {
    setIsUpdating(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('comments')
      .update({ content: data.content })
      .eq('id', comment.id)

    setIsUpdating(false)

    if (error) {
      form.setError('content', { message: '수정에 실패했습니다' })
      return
    }

    setIsEditing(false)
    onUpdate()
  }

  const handleCancelEdit = () => {
    form.reset({ content: comment.content })
    setIsEditing(false)
  }

  return (
    <div className={isReply ? 'ml-12 border-l-2 border-muted pl-4' : ''}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author.avatar_url ?? undefined} alt={displayName} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{displayName}</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>

          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-2">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea className="min-h-20 resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" size="xs" disabled={isUpdating}>
                    {isUpdating ? '저장 중...' : '저장'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={handleCancelEdit}
                  >
                    취소
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <>
              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

              <div className="flex gap-2">
                {!isReply && currentUser && (
                  <Button variant="ghost" size="xs" onClick={onReplyClick}>
                    답글
                  </Button>
                )}
                {isAuthor && (
                  <>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setIsEditing(true)}
                    >
                      수정
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? '삭제 중...' : '삭제'}
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
