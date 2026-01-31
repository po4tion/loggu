'use client'

import { cn } from '@/lib/utils'
import { FileText } from 'lucide-react'
import Link from 'next/link'

interface EditorSidebarItemProps {
  id: string
  title: string
  isActive?: boolean
}

export function EditorSidebarItem({ id, title, isActive }: EditorSidebarItemProps) {
  const displayTitle = title.trim() || 'Untitled'

  return (
    <Link
      href={`/draft/${id}`}
      className={cn(
        'group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
      )}
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="truncate">{displayTitle}</span>
    </Link>
  )
}
