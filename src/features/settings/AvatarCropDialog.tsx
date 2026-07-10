'use client'

import { useCallback, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/molecules/Modal'
import { Button } from '@/components/atoms'
import { cropImageToBlob } from '@/lib/images/cropImage'

interface AvatarCropDialogProps {
  open: boolean
  imageSrc: string | null
  onClose: () => void
  onConfirm: (file: File) => Promise<void>
}

export function AvatarCropDialog({ open, imageSrc, onClose, onConfirm }: AvatarCropDialogProps) {
  const { t } = useTranslation()
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleClose = () => {
    if (busy) return
    onClose()
  }

  async function handleConfirm() {
    if (!imageSrc || !croppedAreaPixels) return
    setBusy(true)
    try {
      const blob = await cropImageToBlob(imageSrc, croppedAreaPixels, 'image/jpeg')
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
      await onConfirm(file)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open && Boolean(imageSrc)}
      onClose={handleClose}
      preventBackdropDismiss={busy}
      title={t('settingsPage.avatarCropTitle')}
      panelClassName="max-w-lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={() => void handleConfirm()} loading={busy} disabled={!croppedAreaPixels}>
            {t('settingsPage.avatarCropConfirm')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted">{t('settingsPage.avatarCropHint')}</p>
        {imageSrc ? (
          <div className="relative h-64 w-full overflow-hidden rounded-sm bg-foreground/5">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
        ) : null}
        <div>
          <label htmlFor="avatar-crop-zoom" className="text-xs font-medium text-muted">
            {t('settingsPage.avatarCropZoom')}
          </label>
          <input
            id="avatar-crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="mt-2 w-full accent-primary"
          />
        </div>
      </div>
    </Modal>
  )
}
