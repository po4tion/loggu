'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createDraft } from '@/lib/actions/draft-actions'
import { useDrafts } from '@/lib/hooks/use-drafts'
import { usePublishedPosts } from '@/lib/hooks/use-published-posts'
import { cn } from '@/lib/utils'
import { Loader2, PenLine, Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'

import { EditorSidebarItem } from './editor-sidebar-item'
import { EditorSidebarSection } from './editor-sidebar-section'

interface EditorSidebarProps {
  authorId: string
  currentPostId?: string
  onClose?: () => void
  className?: string
}

export function EditorSidebar({
  authorId,
  currentPostId,
  onClose,
  className,
}: EditorSidebarProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: drafts = [], isLoading: isLoadingDrafts } = useDrafts(authorId)
  const { data: publishedPosts = [], isLoading: isLoadingPublished } = usePublishedPosts(authorId)

  const filteredDrafts = useMemo(() => {
    if (!searchQuery.trim()) return drafts
    const query = searchQuery.toLowerCase()
    return drafts.filter(
      (draft) =>
        draft.title.toLowerCase().includes(query) ||
        draft.excerpt?.toLowerCase().includes(query)
    )
  }, [drafts, searchQuery])

  const filteredPublished = useMemo(() => {
    if (!searchQuery.trim()) return publishedPosts
    const query = searchQuery.toLowerCase()
    return publishedPosts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.excerpt?.toLowerCase().includes(query)
    )
  }, [publishedPosts, searchQuery])

  const handleNewDraft = () => {
    startTransition(async () => {
      const result = await createDraft(authorId)
      if (result) {
        router.push(`/draft/${result.id}`)
        onClose?.()
      }
    })
  }

  return (
    <aside
      className={cn(
        'bg-background flex h-full w-[280px] flex-col border-r',
        className
      )}
    >
      {/* Header with close button (mobile) */}
      <div className="flex items-center justify-between border-b p-3 lg:hidden">
        <span className="text-sm font-medium">Posts</span>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close sidebar</span>
        </Button>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search drafts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      {/* New draft button */}
      <div className="px-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={handleNewDraft}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PenLine className="h-4 w-4" />
          )}
          New draft
        </Button>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto px-1">
        {/* Drafts Section */}
        <EditorSidebarSection
          title="My Drafts"
          count={filteredDrafts.length}
          defaultOpen={true}
        >
          {isLoadingDrafts ? (
            <div className="text-muted-foreground flex items-center justify-center py-4 text-sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : filteredDrafts.length === 0 ? (
            <p className="text-muted-foreground px-2 py-2 text-sm">
              {searchQuery ? 'No drafts found' : 'No drafts yet'}
            </p>
          ) : (
            filteredDrafts.map((draft) => (
              <EditorSidebarItem
                key={draft.id}
                id={draft.id}
                title={draft.title}
                isActive={draft.id === currentPostId}
              />
            ))
          )}
        </EditorSidebarSection>

        {/* Published Section */}
        <EditorSidebarSection
          title="Published"
          count={filteredPublished.length}
          defaultOpen={true}
        >
          {isLoadingPublished ? (
            <div className="text-muted-foreground flex items-center justify-center py-4 text-sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : filteredPublished.length === 0 ? (
            <p className="text-muted-foreground px-2 py-2 text-sm">
              {searchQuery ? 'No posts found' : 'No published posts'}
            </p>
          ) : (
            filteredPublished.map((post) => (
              <EditorSidebarItem
                key={post.id}
                id={post.id}
                title={post.title}
                isActive={post.id === currentPostId}
              />
            ))
          )}
        </EditorSidebarSection>
      </div>
    </aside>
  )
}
