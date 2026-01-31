'use client'

import { Node as TiptapNode, mergeAttributes } from '@tiptap/core'
import type { NodeViewProps } from '@tiptap/react'
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import EmojiPicker, { EmojiClickData, EmojiStyle, SuggestionMode } from 'emoji-picker-react'
import { useEffect, useRef, useState } from 'react'

// Callout component for rendering
function CalloutComponent({ node, updateAttributes }: NodeViewProps) {
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const emoji = node.attrs.emoji || '💡'

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false)
      }
    }

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPicker])

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    updateAttributes({ emoji: emojiData.emoji })
    setShowPicker(false)
  }

  return (
    <NodeViewWrapper>
      <div className="my-4 flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
        <div className="relative">
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-neutral-200 text-lg transition-colors hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600"
            contentEditable={false}
          >
            {emoji}
          </button>
          {showPicker && (
            <div
              ref={pickerRef}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 sm:absolute sm:inset-auto sm:top-full sm:left-0 sm:mt-2 sm:bg-transparent"
              contentEditable={false}
            >
              <div className="max-h-[80vh] max-w-[90vw] sm:max-h-none sm:max-w-none">
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  width={348}
                  height={400}
                  searchPlaceholder="Search Emojis"
                  previewConfig={{ showPreview: false }}
                  emojiStyle={EmojiStyle.NATIVE}
                  suggestedEmojisMode={SuggestionMode.RECENT}
                />
              </div>
            </div>
          )}
        </div>
        <NodeViewContent className="callout-content prose prose-neutral dark:prose-invert min-w-0 flex-1 text-sm leading-relaxed outline-none" />
      </div>
    </NodeViewWrapper>
  )
}

// Callout extension
export const Callout = TiptapNode.create({
  name: 'callout',

  group: 'block',

  content: 'inline*',

  addAttributes() {
    return {
      emoji: {
        default: '💡',
        parseHTML: (element) => element.getAttribute('data-emoji') || '💡',
        renderHTML: (attributes) => ({
          'data-emoji': attributes.emoji,
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'callout', class: 'callout' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutComponent)
  },

  addKeyboardShortcuts() {
    return {
      // Exit callout on Enter at the end
      Enter: ({ editor }) => {
        const { $from, empty } = editor.state.selection

        if (!empty || $from.parent.type.name !== 'callout') {
          return false
        }

        const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2

        if (isAtEnd) {
          // Insert a new paragraph after the callout
          return editor
            .chain()
            .insertContentAt($from.after(), { type: 'paragraph' })
            .setTextSelection($from.after() + 1)
            .run()
        }

        return false
      },
      // Delete callout if empty on Backspace
      Backspace: ({ editor }) => {
        const { $from, empty } = editor.state.selection

        if (!empty || $from.parent.type.name !== 'callout') {
          return false
        }

        const isAtStart = $from.parentOffset === 0
        const isEmpty = $from.parent.textContent.length === 0

        if (isAtStart && isEmpty) {
          return editor.chain().deleteNode('callout').run()
        }

        return false
      },
    }
  },
})
