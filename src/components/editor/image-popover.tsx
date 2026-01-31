'use client'

import { useState, useEffect, useRef } from 'react'
import { ImageIcon, X, Upload, Loader2 } from 'lucide-react'
import type { Editor } from '@tiptap/core'
import { uploadContentImage } from '@/lib/storage/upload-image'

interface ImagePopoverProps {
  editor: Editor
  isOpen: boolean
  onClose: () => void
  position: { top: number; left: number } | null
  isReplacing?: boolean
  authorId?: string
}

export function ImagePopover({ editor, isOpen, onClose, position, isReplacing = false, authorId }: ImagePopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

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

    if (isReplacing) {
      // Delete current image and insert new one
      editor.chain().focus().deleteSelection().setImage({ src }).run()
    } else {
      editor.chain().focus().setImage({ src }).run()
    }
    resetAndClose()
  }

  const resetAndClose = () => {
    setUploadError(null)
    setIsUploading(false)
    onClose()
  }

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) return

    setUploadError(null)

    // If no authorId provided, fall back to base64 (for backward compatibility)
    if (!authorId) {
      const reader = new FileReader()
      reader.onload = () => {
        insertImage(reader.result as string)
      }
      reader.readAsDataURL(file)
      return
    }

    // Upload to Supabase Storage
    setIsUploading(true)

    const { data, error } = await uploadContentImage(file, authorId)

    setIsUploading(false)

    if (error) {
      setUploadError(error.message)
      return
    }

    if (data) {
      insertImage(data.url)
    }
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

      {/* Content */}
      <div className="p-4">
        <div className="space-y-3">
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => !isUploading && handleDrop(e)}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
              isUploading
                ? 'cursor-not-allowed border-neutral-300 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800'
                : isDragging
                  ? 'cursor-pointer border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'cursor-pointer border-neutral-300 hover:border-neutral-400 dark:border-neutral-600 dark:hover:border-neutral-500'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="text-muted-foreground mb-3 h-8 w-8 animate-spin" />
                <p className="text-sm font-medium">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="text-muted-foreground mb-3 h-8 w-8" />
                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-muted-foreground mt-1 text-xs">PNG, JPG, GIF, WebP up to 10MB</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isUploading}
            />
          </div>
          {uploadError && (
            <p className="text-sm text-red-500">{uploadError}</p>
          )}
        </div>
      </div>
    </div>
  )
}
