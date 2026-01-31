'use client'

import { useState, useEffect, useRef } from 'react'
import { Link, X } from 'lucide-react'
import type { Editor } from '@tiptap/core'

interface LinkPopoverProps {
  editor: Editor
  isOpen: boolean
  onClose: () => void
  position: { top: number; left: number } | null
}

export function LinkPopover({ editor, isOpen, onClose, position }: LinkPopoverProps) {
  const [anchorText, setAnchorText] = useState('')
  const [url, setUrl] = useState('')
  const popoverRef = useRef<HTMLDivElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Get selected text
      const { from, to } = editor.state.selection
      const selectedText = editor.state.doc.textBetween(from, to, '')
      setAnchorText(selectedText || '')
      setUrl('')

      // Focus URL input after a short delay
      setTimeout(() => {
        urlInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, editor])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleInsertLink = () => {
    if (!url) return

    const { from, to } = editor.state.selection
    const hasSelection = from !== to

    if (hasSelection) {
      // If there's selected text, wrap it with link
      editor
        .chain()
        .focus()
        .setLink({ href: url })
        .run()
    } else if (anchorText) {
      // If no selection but anchor text provided, insert new link
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${url}">${anchorText}</a>`)
        .run()
    } else {
      // Just insert the URL as both text and link
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${url}">${url}</a>`)
        .run()
    }

    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleInsertLink()
    }
  }

  if (!isOpen || !position) return null

  return (
    <div
      ref={popoverRef}
      className="bg-popover text-popover-foreground fixed z-[9999] w-80 rounded-lg border shadow-lg"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Link className="h-4 w-4" />
          <span className="text-sm font-medium">Hyperlink the text</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4 p-4">
        {/* Anchor Text */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Anchor text</label>
          <input
            type="text"
            value={anchorText}
            onChange={(e) => setAnchorText(e.target.value)}
            placeholder="Enter anchor text"
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Link URL */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Link</label>
          <input
            ref={urlInputRef}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Insert Button */}
        <button
          type="button"
          onClick={handleInsertLink}
          disabled={!url}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Insert Link
        </button>
      </div>
    </div>
  )
}
