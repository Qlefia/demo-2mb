'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react'
import { User, Settings, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/atoms'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'
import { resolveAvatarBackground, isAvatarBackgroundDark } from '@/constants/avatar'
import type { AvatarIconId } from '@/constants/avatar'

export function UserMenu() {
  const { t } = useTranslation()
  const router = useRouter()
  const user = useUserStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)

  const initials = (user.displayName || user.email || '?')
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const effectiveType = user.avatarType === 'photo' && user.avatarUrl ? 'photo' : user.avatarType ?? 'initials'
  const bgValue = resolveAvatarBackground(user.avatarBg)
  const onDarkBg = isAvatarBackgroundDark(user.avatarBg)

  return (
    <Menu as="div" className="relative">
      <MenuButton className="flex items-center rounded-full outline-none focus-visible:outline-none">
        <Avatar
          src={effectiveType === 'photo' ? (user.avatarUrl ?? undefined) : undefined}
          emoji={effectiveType === 'emoji' ? (user.avatarEmoji ?? undefined) : undefined}
          initials={effectiveType === 'initials' ? initials : undefined}
          iconId={effectiveType === 'icon' ? (user.avatarIcon as AvatarIconId) : undefined}
          bgStyle={bgValue}
          onDarkBg={onDarkBg}
          size="md"
          shape="rounded"
          className="max-lg:h-11 max-lg:w-11"
          emojiClassName="!text-xl leading-none max-lg:!text-[1.2rem]"
        />
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-sm border border-border bg-background py-1 focus:outline-none">
          <div className="border-b border-border px-4 py-2.5">
            <p className="text-sm font-medium">{user.displayName}</p>
            <p className="text-xs text-muted">{user.email}</p>
          </div>

          <div className="py-1">
            <MenuItem>
              <Link
                href="/profile"
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground data-focus:bg-primary/5"
              >
                <User size={16} className="text-muted" />
                {t('nav.profile')}
              </Link>
            </MenuItem>
            <MenuItem>
              <Link
                href="/settings"
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground data-focus:bg-primary/5"
              >
                <Settings size={16} className="text-muted" />
                {t('nav.settings')}
              </Link>
            </MenuItem>
          </div>

          <div className="border-t border-border py-1">
            <MenuItem>
              <button
                onClick={async () => {
                  await signOut()
                  router.replace('/login')
                  router.refresh()
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-destructive data-focus:bg-destructive/5"
              >
                <LogOut size={16} />
                {t('nav.logout')}
              </button>
            </MenuItem>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  )
}
