'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface PostActionsProps {
  postId: string
  slug: string
}

export function PostActions({ postId, slug }: PostActionsProps) {
  const editUrl = `/posts/${slug}/edit` as Route
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('정말로 이 글을 삭제하시겠습니까?')) {
      return
    }

    setIsDeleting(true)
    const supabase = createClient()

    const { error } = await supabase.from('posts').delete().eq('id', postId)

    if (error) {
      alert('삭제에 실패했습니다')
      setIsDeleting(false)
      return
    }

    window.location.href = '/'
  }

  return (
    <div className="flex gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={editUrl}>수정</Link>
      </Button>
      <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
        {isDeleting ? '삭제 중...' : '삭제'}
      </Button>
    </div>
  )
}
