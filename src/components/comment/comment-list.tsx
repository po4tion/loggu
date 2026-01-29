'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CommentWithAuthor, CommentWithReplies, Profile } from '@/types'
import { CommentForm } from './comment-form'
import { CommentItem } from './comment-item'

interface CommentListProps {
  postId: string
  initialComments: CommentWithAuthor[]
  currentUser: Profile | null
}

function organizeComments(comments: CommentWithAuthor[]): CommentWithReplies[] {
  const topLevelComments: CommentWithReplies[] = []
  const repliesMap = new Map<string, CommentWithAuthor[]>()

  for (const comment of comments) {
    if (comment.parent_id) {
      const replies = repliesMap.get(comment.parent_id) ?? []
      replies.push(comment)
      repliesMap.set(comment.parent_id, replies)
    } else {
      topLevelComments.push({ ...comment, replies: [] })
    }
  }

  for (const comment of topLevelComments) {
    comment.replies = repliesMap.get(comment.id) ?? []
  }

  return topLevelComments
}

export function CommentList({ postId, initialComments, currentUser }: CommentListProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>(initialComments)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const fetchComments = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('comments')
      .select(
        `
        id,
        post_id,
        author_id,
        parent_id,
        content,
        created_at,
        updated_at,
        profiles!comments_author_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (data) {
      const transformed = data.map((comment) => ({
        id: comment.id,
        post_id: comment.post_id,
        author_id: comment.author_id,
        parent_id: comment.parent_id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        author: comment.profiles as unknown as Profile,
      }))
      setComments(transformed)
    }
  }, [postId])

  const handleCommentSuccess = () => {
    fetchComments()
  }

  const handleReplySuccess = () => {
    setReplyingTo(null)
    fetchComments()
  }

  const organizedComments = organizeComments(comments)
  const commentCount = comments.length

  return (
    <section aria-labelledby="comments-heading" className="mt-12 border-t pt-8">
      <h2 id="comments-heading" className="mb-6 text-xl font-bold">
        댓글 {commentCount > 0 && <span className="text-muted-foreground">({commentCount})</span>}
      </h2>

      {currentUser ? (
        <div className="mb-8">
          <CommentForm
            postId={postId}
            currentUser={currentUser}
            onSuccess={handleCommentSuccess}
          />
        </div>
      ) : (
        <p className="mb-8 text-sm text-muted-foreground">
          댓글을 작성하려면 로그인이 필요합니다.
        </p>
      )}

      {organizedComments.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
        </p>
      ) : (
        <div className="space-y-6">
          {organizedComments.map((comment) => (
            <div key={comment.id} className="space-y-4">
              <CommentItem
                comment={comment}
                currentUser={currentUser}
                onReplyClick={() =>
                  setReplyingTo(replyingTo === comment.id ? null : comment.id)
                }
                onUpdate={fetchComments}
              />

              {replyingTo === comment.id && currentUser && (
                <div className="ml-12 pl-4">
                  <CommentForm
                    postId={postId}
                    parentId={comment.id}
                    currentUser={currentUser}
                    onSuccess={handleReplySuccess}
                    onCancel={() => setReplyingTo(null)}
                  />
                </div>
              )}

              {comment.replies.length > 0 && (
                <div className="space-y-4">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      currentUser={currentUser}
                      isReply
                      onUpdate={fetchComments}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
