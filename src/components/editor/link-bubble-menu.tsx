'use client'

import { useEffect, useState, useRef } from 'react'
import { Pencil, Unlink } from 'lucide-react'
import type { Editor } from '@tiptap/core'

interface LinkBubbleMenuProps {
  editor: Editor
  onEditLink: () => void
}

export function LinkBubbleMenu({ editor, onEditLink }: LinkBubbleMenuProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateMenu = () => {
      const { from, to } = editor.state.selection
      const isLink = editor.isActive('link')

      if (isLink && from !== to) {
        const coords = editor.view.coordsAtPos(from)
        setPosition({
          top: coords.top - 45,
          left: coords.left,
        })
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    editor.on('selectionUpdate', updateMenu)
    editor.on('transaction', updateMenu)

    return () => {
      editor.off('selectionUpdate', updateMenu)
      editor.off('transaction', updateMenu)
    }
  }, [editor])

  const handleUnlink = () => {
    editor.chain().focus().unsetLink().run()
    setIsVisible(false)
  }

  const handleEditLink = () => {
    onEditLink()
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] flex items-center gap-1 rounded-lg border bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <button
        type="button"
        onClick={handleEditLink}
        className="rounded p-2 text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
        title="Edit link"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={handleUnlink}
        className="rounded p-2 text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
        title="Remove link"
      >
        <Unlink className="h-4 w-4" />
      </button>
    </div>
  )
}
