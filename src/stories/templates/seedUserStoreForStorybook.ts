import { useUserStore } from '@/stores/userStore'
import { initialMockState } from '@/mocks/seed'

export function seedUserStoreForStorybook(): void {
  const u = initialMockState.user
  useUserStore.setState({
    user: {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      avatarType: u.avatarType,
      avatarEmoji: u.avatarEmoji,
      avatarIcon: u.avatarIcon,
      avatarBg: u.avatarBg,
      language: u.language,
      timezone: u.timezone,
    },
    role: 'founder',
    territory: null,
    profileLoaded: true,
  })
}
