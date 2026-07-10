'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input, Label } from '@/components/atoms'
import { LanguageSwitcher } from '@/components/molecules/LanguageSwitcher'
import { ThemeToggle } from '@/components/molecules/ThemeToggle'
import { AvatarSelector } from './AvatarSelector'
import { AvatarCropDialog } from './AvatarCropDialog'
import { uploadUserAvatar } from './avatarApi'
import { useUserStore } from '@/stores/userStore'
import { useAuth } from '@/providers/AuthProvider'
import { toast } from '@/components/molecules/Toast'

export function ProfileForm() {
  const { t } = useTranslation()
  const user = useUserStore((s) => s.user)
  const updateProfile = useUserStore((s) => s.updateProfile)
  const setUserFromServer = useUserStore((s) => s.setUserFromServer)
  const { user: authUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  useEffect(
    () => () => {
      if (cropSrc?.startsWith('blob:')) URL.revokeObjectURL(cropSrc)
    },
    [cropSrc],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !authUser) return
    if (!file.type.startsWith('image/')) {
      toast(t('settingsPage.imageUploadError'), 'error')
      return
    }
    if (cropSrc?.startsWith('blob:')) URL.revokeObjectURL(cropSrc)
    setCropSrc(URL.createObjectURL(file))
  }

  const handleCropClose = () => {
    if (cropSrc?.startsWith('blob:')) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  const handleCropConfirm = async (file: File) => {
    setUploading(true)
    try {
      const data = await uploadUserAvatar(file)
      setUserFromServer(data)
      toast(t('settingsPage.avatarUpdated'), 'success')
    } catch {
      toast(t('settingsPage.imageUploadError'), 'error')
    } finally {
      setUploading(false)
      if (cropSrc?.startsWith('blob:')) URL.revokeObjectURL(cropSrc)
      setCropSrc(null)
    }
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!authUser) return

    const data = new FormData(e.currentTarget)
    const displayName = data.get('displayName') as string

    try {
      await updateProfile({ displayName })
      toast(t('common.save'), 'success')
    } catch {
      toast(t('settingsPage.profileSaveError'), 'error')
    }
  }

  return (
    <>
      <form onSubmit={handleSave} className="max-w-lg space-y-5 max-lg:pt-5 sm:space-y-6">
        <AvatarSelector
          user={user}
          onUpdate={async (patch) => {
            setAvatarSaving(true)
            try {
              await updateProfile(patch)
            } catch {
              toast(t('settingsPage.profileSaveError'), 'error')
            } finally {
              setAvatarSaving(false)
            }
          }}
          uploading={uploading}
          saving={avatarSaving}
          onPickPhoto={() => fileInputRef.current?.click()}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />

        <div>
          <Label>{t('settingsPage.displayName')}</Label>
          <Input name="displayName" defaultValue={user.displayName} className="mt-1.5" />
        </div>

        <div>
          <Label>{t('settingsPage.emailReadonly')}</Label>
          <Input value={user.email} readOnly className="mt-1.5 bg-primary/5" />
        </div>

        <div className="flex flex-wrap items-start gap-x-10 gap-y-4">
          <div className="w-fit shrink-0">
            <Label>{t('branding.theme')}</Label>
            <div className="mt-1.5">
              <ThemeToggle size="md" />
            </div>
          </div>
          <div className="w-fit shrink-0">
            <Label>{t('settingsPage.language')}</Label>
            <div className="mt-1.5">
              <LanguageSwitcher size="md" />
            </div>
          </div>
        </div>

        <div>
          <Label>{t('settingsPage.timezone')}</Label>
          <select
            name="timezone"
            value={user.timezone}
            onChange={(e) => void updateProfile({ timezone: e.target.value }).catch(() => {
              toast(t('settingsPage.profileSaveError'), 'error')
            })}
            className="mt-1.5 h-10 w-full rounded-sm border border-border bg-transparent px-3 text-sm outline-none"
          >
            <option value="Europe/Berlin">Europe/Berlin (CET)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        <Button type="submit">{t('common.save')}</Button>
      </form>

      <AvatarCropDialog
        open={cropSrc !== null}
        imageSrc={cropSrc}
        onClose={handleCropClose}
        onConfirm={handleCropConfirm}
      />
    </>
  )
}
