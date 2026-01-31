'use client'

import { useEffect, useState, useRef } from 'react'
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Link,
  Trash2,
  Replace,
} from 'lucide-react'
import type { Editor } from '@tiptap/core'
import { NodeSelection } from '@tiptap/pm/state'
import { deleteContentImage } from '@/lib/storage/upload-image'

interface ImageBubbleMenuProps {
  editor: Editor
  onChangeImage: () => void
}

type Alignment = 'left' | 'center' | 'right'

export function ImageBubbleMenu({ editor, onChangeImage }: ImageBubbleMenuProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [currentAlignment, setCurrentAlignment] = useState<Alignment>('left')
  const [showAltInput, setShowAltInput] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [altText, setAltText] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const altInputRef = useRef<HTMLInputElement>(null)
  const linkInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const updateMenu = () => {
      const { selection } = editor.state
      const isNodeSelection = selection instanceof NodeSelection
      const isImageSelected = isNodeSelection && selection.node?.type.name === 'image'

      if (isImageSelected) {
        const node = selection.node
        const dom = editor.view.nodeDOM(selection.from) as HTMLElement | null

        if (dom && node) {
          const rect = dom.getBoundingClientRect()
          setPosition({
            top: rect.top - 50,
            left: rect.left + rect.width / 2,
          })

          // Get current alignment from style
          const style = (node.attrs.style as string) || ''
          // Check center first (both margins auto)
          if (style.includes('margin-left: auto') && style.includes('margin-right: auto')) {
            setCurrentAlignment('center')
          } else if (style.includes('margin-left: auto') && style.includes('margin-right: 0')) {
            setCurrentAlignment('right')
          } else {
            // Default to left (no style or explicit left alignment)
            setCurrentAlignment('left')
          }

          // Get current alt text
          setAltText((node.attrs.alt as string) || '')

          // Get current link
          setLinkUrl((node.attrs.link as string) || '')
        }

        setIsVisible(true)
      } else {
        setIsVisible(false)
        setShowAltInput(false)
        setShowLinkInput(false)
      }
    }

    editor.on('selectionUpdate', updateMenu)
    editor.on('transaction', updateMenu)

    return () => {
      editor.off('selectionUpdate', updateMenu)
      editor.off('transaction', updateMenu)
    }
  }, [editor])

  useEffect(() => {
    if (showAltInput && altInputRef.current) {
      altInputRef.current.focus()
    }
    if (showLinkInput && linkInputRef.current) {
      linkInputRef.current.focus()
    }
  }, [showAltInput, showLinkInput])

  const handleAlignment = (alignment: Alignment) => {
    const { selection } = editor.state

    let style = ''
    switch (alignment) {
      case 'left':
        style = 'display: block; margin-left: 0; margin-right: auto;'
        break
      case 'center':
        style = 'display: block; margin-left: auto; margin-right: auto;'
        break
      case 'right':
        style = 'display: block; margin-left: auto; margin-right: 0;'
        break
    }

    editor
      .chain()
      .focus()
      .updateAttributes('image', { style })
      .setNodeSelection(selection.from)
      .run()

    setCurrentAlignment(alignment)
  }

  const handleAltTextSubmit = () => {
    const { selection } = editor.state
    editor
      .chain()
      .focus()
      .updateAttributes('image', { alt: altText })
      .setNodeSelection(selection.from)
      .run()
    setShowAltInput(false)
  }

  const handleLinkSubmit = () => {
    if (!linkUrl) {
      setShowLinkInput(false)
      return
    }

    const { selection } = editor.state
    editor
      .chain()
      .focus()
      .updateAttributes('image', { link: linkUrl })
      .setNodeSelection(selection.from)
      .run()

    setShowLinkInput(false)
  }

  const handleRemoveLink = () => {
    const { selection } = editor.state
    editor
      .chain()
      .focus()
      .updateAttributes('image', { link: null })
      .setNodeSelection(selection.from)
      .run()

    setLinkUrl('')
    setShowLinkInput(false)
  }

  const handleDelete = async () => {
    // Get the image src before deleting
    const { selection } = editor.state
    if (selection instanceof NodeSelection && selection.node) {
      const src = selection.node.attrs.src as string
      if (src) {
        // Delete from storage (async, don't wait)
        deleteContentImage(src).catch((err) => {
          console.error('Failed to delete image from storage:', err)
        })
      }
    }

    editor.chain().focus().deleteSelection().run()
    setIsVisible(false)
  }

  const handleChangeImage = () => {
    onChangeImage()
    setIsVisible(false)
  }

  const handleAltKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAltTextSubmit()
    } else if (e.key === 'Escape') {
      setShowAltInput(false)
    }
  }

  const handleLinkKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleLinkSubmit()
    } else if (e.key === 'Escape') {
      setShowLinkInput(false)
    }
  }

  if (!isVisible) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] flex items-center gap-1 rounded-lg border bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
      }}
    >
      {/* Change Image */}
      <button
        type="button"
        onClick={handleChangeImage}
        className="rounded p-2 text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
        title="Change image"
      >
        <Replace className="h-4 w-4" />
      </button>

      <div className="mx-1 h-6 w-px bg-neutral-200 dark:bg-neutral-600" />

      {/* Alignment */}
      <button
        type="button"
        onClick={() => handleAlignment('left')}
        className={`rounded p-2 transition-colors ${
          currentAlignment === 'left'
            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
            : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
        }`}
        title="Align left"
      >
        <AlignLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => handleAlignment('center')}
        className={`rounded p-2 transition-colors ${
          currentAlignment === 'center'
            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
            : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
        }`}
        title="Align center"
      >
        <AlignCenter className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => handleAlignment('right')}
        className={`rounded p-2 transition-colors ${
          currentAlignment === 'right'
            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
            : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
        }`}
        title="Align right"
      >
        <AlignRight className="h-4 w-4" />
      </button>

      <div className="mx-1 h-6 w-px bg-neutral-200 dark:bg-neutral-600" />

      {/* Alt Text */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowAltInput(!showAltInput)
            setShowLinkInput(false)
          }}
          className={`rounded p-2 transition-colors ${
            showAltInput
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
              : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
          }`}
          title="Alt text"
        >
          <Type className="h-4 w-4" />
        </button>
        {showAltInput && (
          <div className="absolute top-full left-1/2 z-10 mt-2 w-64 -translate-x-1/2 rounded-lg border bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
            <label className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Alt text
            </label>
            <input
              ref={altInputRef}
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              onKeyDown={handleAltKeyDown}
              placeholder="Describe this image..."
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-900"
            />
            <button
              type="button"
              onClick={handleAltTextSubmit}
              className="mt-2 w-full rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* Link */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowLinkInput(!showLinkInput)
            setShowAltInput(false)
          }}
          className={`rounded p-2 transition-colors ${
            showLinkInput || linkUrl
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
              : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
          }`}
          title={linkUrl ? 'Edit link' : 'Add link'}
        >
          <Link className="h-4 w-4" />
        </button>
        {showLinkInput && (
          <div className="absolute top-full right-0 z-10 mt-2 w-64 rounded-lg border bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
            <label className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Link URL
            </label>
            <input
              ref={linkInputRef}
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={handleLinkKeyDown}
              placeholder="https://..."
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-900"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={handleLinkSubmit}
                disabled={!linkUrl}
                className="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {linkUrl ? 'Update' : 'Add link'}
              </button>
              {linkUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLink}
                  className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mx-1 h-6 w-px bg-neutral-200 dark:bg-neutral-600" />

      {/* Delete */}
      <button
        type="button"
        onClick={handleDelete}
        className="rounded p-2 text-neutral-600 transition-colors hover:bg-red-100 hover:text-red-600 dark:text-neutral-300 dark:hover:bg-red-900 dark:hover:text-red-400"
        title="Delete image"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
