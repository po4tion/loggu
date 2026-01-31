'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, X } from 'lucide-react'
import type { Editor } from '@tiptap/core'

interface LinkPopoverProps {
  editor: Editor
  isOpen: boolean
  onClose: () => void
  position: { top: number; left: number } | null
}

export function LinkPopover({ editor, isOpen, onClose, position }: LinkPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)

  // Compute initial values from editor state
  const initialValues = useMemo(() => {
    if (!isOpen) return { anchorText: '', url: '' }

    const { from, to } = editor.state.selection
    const linkAttrs = editor.getAttributes('link')
    const existingUrl = linkAttrs.href && linkAttrs.href !== '#' ? linkAttrs.href : ''

    // If editing an existing link, get the full link text
    if (editor.isActive('link')) {
      const { $from } = editor.state.selection
      let linkStart = from
      let linkEnd = to

      // Find link boundaries
      const linkMarkType = editor.schema.marks.link
      editor.state.doc.nodesBetween($from.start(), $from.end(), (node, pos) => {
        if (node.isText && node.marks.some((m) => m.type === linkMarkType)) {
          const nodeStart = pos
          const nodeEnd = pos + node.nodeSize
          if (from >= nodeStart && from <= nodeEnd) {
            linkStart = nodeStart
            linkEnd = nodeEnd
          }
        }
      })

      const linkText = editor.state.doc.textBetween(linkStart, linkEnd, '')
      return { anchorText: linkText, url: existingUrl }
    }

    // Otherwise, use selected text
    const selectedText = editor.state.doc.textBetween(from, to, '')
    return { anchorText: selectedText || '', url: existingUrl }
  }, [isOpen, editor])

  const [anchorText, setAnchorText] = useState(initialValues.anchorText)
  const [url, setUrl] = useState(initialValues.url)

  // Focus URL input when popover opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        urlInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

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
    const isEditingLink = editor.isActive('link')

    // Helper to remove stored link mark (prevents link from continuing to new text)
    const removeStoredLinkMark = () => {
      const { tr } = editor.state
      tr.removeStoredMark(editor.schema.marks.link)
      editor.view.dispatch(tr)
    }

    if (isEditingLink) {
      // Find the link mark range and replace it completely
      const { $from } = editor.state.selection
      let linkStart = from
      let linkEnd = to

      // Find link boundaries
      const linkMark = editor.schema.marks.link
      editor.state.doc.nodesBetween($from.start(), $from.end(), (node, pos) => {
        if (node.isText && node.marks.some((m) => m.type === linkMark)) {
          const nodeStart = pos
          const nodeEnd = pos + node.nodeSize
          if (from >= nodeStart && from <= nodeEnd) {
            linkStart = nodeStart
            linkEnd = nodeEnd
          }
        }
      })

      // Delete old link and insert new one
      editor
        .chain()
        .focus()
        .setTextSelection({ from: linkStart, to: linkEnd })
        .deleteSelection()
        .insertContent(`<a href="${url}">${anchorText || url}</a>`)
        .run()
      removeStoredLinkMark()
    } else if (hasSelection) {
      // Wrap selected text with link
      editor.chain().focus().setLink({ href: url }).setTextSelection(to).run()
      removeStoredLinkMark()
    } else if (anchorText) {
      // Insert new link with anchor text
      editor.chain().focus().insertContent(`<a href="${url}">${anchorText}</a>`).run()
      removeStoredLinkMark()
    } else {
      // Insert URL as link
      editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run()
      removeStoredLinkMark()
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
