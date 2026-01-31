'use client'

import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface EditorSidebarSectionProps {
  title: string
  count: number
  children: React.ReactNode
  defaultOpen?: boolean
}

export function EditorSidebarSection({
  title,
  count,
  children,
  defaultOpen = true,
}: EditorSidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="py-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between px-2 py-1 text-xs font-medium uppercase tracking-wider transition-colors"
      >
        <span>
          {title} ({count})
        </span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
        />
      </button>
      <div
        className={cn(
          'mt-1 space-y-0.5 overflow-hidden transition-all',
          isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {children}
      </div>
    </div>
  )
}
