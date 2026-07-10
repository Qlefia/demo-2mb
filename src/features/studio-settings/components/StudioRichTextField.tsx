'use client'

import { useEffect, useMemo } from 'react'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { cn } from '@/lib/cn'
import { studioRichTextEditorShell } from '@/features/studio-settings/studioBlockChrome'
import { StudioRichTextToolbar } from '@/features/studio-settings/components/StudioRichTextToolbar'

const EMPTY_DOC = '<p></p>'

function normalizeHtml(html: string) {
  const t = html.trim()
  if (t === '' || t === EMPTY_DOC) return ''
  return html
}

export interface StudioRichTextFieldProps {
  id?: string
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeightClass?: string
  'aria-invalid'?: boolean | 'true' | 'false'
  className?: string
}

export function StudioRichTextField({
  id,
  value,
  onChange,
  placeholder,
  minHeightClass = 'min-h-[10rem]',
  'aria-invalid': ariaInvalid,
  className,
}: StudioRichTextFieldProps) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder: placeholder ?? '',
        showOnlyWhenEditable: true,
      }),
    ],
    [placeholder],
  )

  const editor = useEditor({
    extensions,
    content: value || EMPTY_DOC,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        ...(ariaInvalid === true || ariaInvalid === 'true' ? { 'aria-invalid': 'true' } : {}),
        class: cn(
          'tiptap max-w-none px-3 py-2 text-sm text-foreground outline-none',
          minHeightClass,
          '[&_.ProseMirror]:min-h-[8.5rem] [&_.ProseMirror]:outline-none',
        ),
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(normalizeHtml(ed.getHTML()))
    },
  })

  useEffect(() => {
    if (!editor) return
    const next = value || EMPTY_DOC
    const cur = editor.getHTML()
    if (next === cur) return
    if (editor.isFocused) return
    editor.commands.setContent(next, { emitUpdate: false })
  }, [value, editor])

  useEffect(
    () => () => {
      editor?.destroy()
    },
    [editor],
  )

  return (
    <div
      className={cn(
        studioRichTextEditorShell,
        className,
      )}
    >
      <div className="px-2 pt-2">
        <StudioRichTextToolbar editor={editor} />
      </div>
      <EditorContent editor={editor} className={cn('border-t border-border', minHeightClass)} />
    </div>
  )
}
