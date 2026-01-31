'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Youtube from '@tiptap/extension-youtube'
import { common, createLowlight } from 'lowlight'
import { SlashCommand } from './slash-command'

// lowlight 인스턴스 생성 (common languages 포함)
const lowlight = createLowlight(common)

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  minimal?: boolean
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = '내용을 입력하세요...',
  minimal = false,
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: false, // CodeBlockLowlight 사용
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'hljs',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Youtube.configure({
        HTMLAttributes: {
          class: 'w-full aspect-video rounded-lg',
        },
        inline: false,
        width: 640,
        height: 360,
      }),
      Placeholder.configure({
        includeChildren: true,
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            const level = node.attrs.level as number
            return `Heading ${level}`
          }
          return placeholder
        },
      }),
      SlashCommand,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-neutral dark:prose-invert max-w-none min-h-[300px] focus:outline-none',
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0]
          if (file.type.startsWith('image/')) {
            event.preventDefault()
            const reader = new FileReader()
            reader.onload = () => {
              const { schema } = view.state
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
              const node = schema.nodes.image.create({ src: reader.result as string })
              if (coordinates) {
                const transaction = view.state.tr.insert(coordinates.pos, node)
                view.dispatch(transaction)
              }
            }
            reader.readAsDataURL(file)
            return true
          }
        }
        return false
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items
        if (items) {
          for (const item of items) {
            if (item.type.startsWith('image/')) {
              event.preventDefault()
              const file = item.getAsFile()
              if (file) {
                const reader = new FileReader()
                reader.onload = () => {
                  const { schema } = view.state
                  const node = schema.nodes.image.create({ src: reader.result as string })
                  const transaction = view.state.tr.replaceSelectionWith(node)
                  view.dispatch(transaction)
                }
                reader.readAsDataURL(file)
              }
              return true
            }
          }
        }
        return false
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) {
    return null
  }

  if (minimal) {
    return <EditorContent editor={editor} />
  }

  return (
    <div className="rounded-lg border">
      <EditorToolbar editor={editor} />
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

interface EditorToolbarProps {
  editor: ReturnType<typeof useEditor>
}

function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null

  return (
    <div className="flex flex-wrap gap-1 border-b p-2">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="굵게"
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="기울임"
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="취소선"
      >
        <s>S</s>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="인라인 코드"
      >
        {'</>'}
      </ToolbarButton>

      <div className="bg-border mx-1 w-px" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="제목 1"
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="제목 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="제목 3"
      >
        H3
      </ToolbarButton>

      <div className="bg-border mx-1 w-px" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="목록"
      >
        •
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="번호 목록"
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="인용"
      >
        {'"'}
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title="코드 블록"
      >
        {'{ }'}
      </ToolbarButton>

      <div className="bg-border mx-1 w-px" />

      <ToolbarButton
        onClick={() => {
          const url = window.prompt('이미지 URL을 입력하세요')
          if (url) {
            editor.chain().focus().setImage({ src: url }).run()
          }
        }}
        isActive={false}
        title="이미지"
      >
        🖼
      </ToolbarButton>
      <ToolbarButton
        onClick={() => {
          const url = window.prompt('링크 URL을 입력하세요')
          if (url) {
            editor.chain().focus().setLink({ href: url }).run()
          }
        }}
        isActive={editor.isActive('link')}
        title="링크"
      >
        🔗
      </ToolbarButton>
      <ToolbarButton
        onClick={() => {
          const url = window.prompt('YouTube URL을 입력하세요')
          if (url) {
            editor.chain().focus().setYoutubeVideo({ src: url }).run()
          }
        }}
        isActive={false}
        title="YouTube"
      >
        ▶️
      </ToolbarButton>
    </div>
  )
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, isActive, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
        isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
      }`}
    >
      {children}
    </button>
  )
}
