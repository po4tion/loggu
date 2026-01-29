'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface PostActionsProps {
  postId: string
  slug: string
}

export function PostActions({ postId, slug }: PostActionsProps) {
  const router = useRouter()
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

    router.push('/')
  }

  return (
    <div className="flex gap-1">
      <Button asChild variant="ghost" size="icon" aria-label="수정">
        <Link href={editUrl}>
          <Pencil className="size-5" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={isDeleting}
        aria-label="삭제"
      >
        {isDeleting ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Trash2 className="size-5 text-destructive" />
        )}
      </Button>
    </div>
  )
}
