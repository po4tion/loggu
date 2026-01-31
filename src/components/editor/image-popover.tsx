'use client'

import { useState, useEffect, useRef } from 'react'
import { ImageIcon, X, Upload, Link } from 'lucide-react'
import type { Editor } from '@tiptap/core'

interface ImagePopoverProps {
  editor: Editor
  isOpen: boolean
  onClose: () => void
  position: { top: number; left: number } | null
}

type TabType = 'upload' | 'url'

export function ImagePopover({ editor, isOpen, onClose, position }: ImagePopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<TabType>('upload')
  const [imageUrl, setImageUrl] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  // Focus URL input when switching to URL tab
  useEffect(() => {
    if (isOpen && activeTab === 'url') {
      setTimeout(() => {
        urlInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, activeTab])

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

  const insertImage = (src: string) => {
    if (!src) return
    editor.chain().focus().setImage({ src }).run()
    resetAndClose()
  }

  const resetAndClose = () => {
    setImageUrl('')
    setActiveTab('upload')
    onClose()
  }

  const handleUrlSubmit = () => {
    insertImage(imageUrl)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleUrlSubmit()
    }
  }

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = () => {
      insertImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  if (!isOpen || !position) return null

  return (
    <div
      ref={popoverRef}
      className="bg-popover text-popover-foreground fixed z-[9999] w-96 rounded-lg border shadow-lg"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Add image</span>
        </div>
        <button
          type="button"
          onClick={resetAndClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'upload'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Upload className="h-4 w-4" />
          Upload
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'url'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Link className="h-4 w-4" />
          Embed link
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'upload' ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-neutral-300 hover:border-neutral-400 dark:border-neutral-600 dark:hover:border-neutral-500'
            }`}
          >
            <Upload className="text-muted-foreground mb-3 h-8 w-8" />
            <p className="text-sm font-medium">Click to upload or drag and drop</p>
            <p className="text-muted-foreground mt-1 text-xs">PNG, JPG, GIF up to 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Image URL</label>
              <input
                ref={urlInputRef}
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={handleKeyDown}
              />
            </div>
            <button
              type="button"
              onClick={handleUrlSubmit}
              disabled={!imageUrl}
              className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add image
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
