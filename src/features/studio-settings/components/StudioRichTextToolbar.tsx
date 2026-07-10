'use client'

import type { ReactNode } from 'react'
import type { Editor } from '@tiptap/core'
import { useTranslation } from 'react-i18next'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  TextQuote,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  studioRichTextToolbarButton,
  studioRichTextToolbarShell,
} from '@/features/studio-settings/studioBlockChrome'

const toolBtn = studioRichTextToolbarButton

function ToolButton({
  label,
  onClick,
  active,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={cn(toolBtn, active && 'bg-active text-foreground')}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="mx-0.5 hidden h-5 w-px bg-border/60 sm:block" aria-hidden />
}

function textAlignValue(editor: Editor) {
  const p = editor.getAttributes('paragraph').textAlign as string | undefined
  const h = editor.getAttributes('heading').textAlign as string | undefined
  return p || h || null
}

export function StudioRichTextToolbar({ editor }: { editor: Editor | null }) {
  const { t } = useTranslation()
  if (!editor) {
    return <div className={studioRichTextToolbarShell} aria-hidden />
  }

  const ta = textAlignValue(editor)

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 pb-2"
      role="toolbar"
      aria-label={t('studioSettings.richText.toolbarAria')}
    >
      <ToolButton
        label={t('studioSettings.richText.bold')}
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={16} aria-hidden />
      </ToolButton>
      <ToolButton
        label={t('studioSettings.richText.italic')}
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={16} aria-hidden />
      </ToolButton>
      <ToolButton
        label={t('studioSettings.richText.underline')}
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon size={16} aria-hidden />
      </ToolButton>
      <ToolButton
        label={t('studioSettings.richText.strike')}
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={16} aria-hidden />
      </ToolButton>
      <Divider />
      <ToolButton
        label={t('studioSettings.richText.h1')}
        active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 size={16} aria-hidden />
      </ToolButton>
      <ToolButton
        label={t('studioSettings.richText.h2')}
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 size={16} aria-hidden />
      </ToolButton>
      <ToolButton
        label={t('studioSettings.richText.h3')}
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 size={16} aria-hidden />
      </ToolButton>
      <Divider />
      <ToolButton
        label={t('studioSettings.richText.bulletList')}
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={16} aria-hidden />
      </ToolButton>
      <ToolButton
        label={t('studioSettings.richText.orderedList')}
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={16} aria-hidden />
      </ToolButton>
      <ToolButton
        label={t('studioSettings.richText.blockquote')}
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <TextQuote size={16} aria-hidden />
      </ToolButton>
      <ToolButton
        label={t('studioSettings.richText.codeBlock')}
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code2 size={16} aria-hidden />
      </ToolButton>
      <Divider />
      <ToolButton
        label={t('studioSettings.richText.alignLeft')}
        active={ta === 'left' || ta === null}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      >
        <AlignLeft size={16} aria-hidden />
      </ToolButton>
      <ToolButton
        label={t('studioSettings.richText.alignCenter')}
        active={ta === 'center'}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <AlignCenter size={16} aria-hidden />
      </ToolButton>
      <ToolButton
        label={t('studioSettings.richText.alignRight')}
        active={ta === 'right'}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <AlignRight size={16} aria-hidden />
      </ToolButton>
      <Divider />
      <ToolButton
        label={t('studioSettings.richText.undo')}
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 size={16} aria-hidden />
      </ToolButton>
      <ToolButton
        label={t('studioSettings.richText.redo')}
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 size={16} aria-hidden />
      </ToolButton>
      <ToolButton
        label={t('studioSettings.richText.clearFormatting')}
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
      >
        <Eraser size={16} aria-hidden />
      </ToolButton>
    </div>
  )
}
