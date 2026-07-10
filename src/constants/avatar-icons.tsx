import type { LucideIcon } from 'lucide-react'
import {
  User,
  Users,
  Briefcase,
  Heart,
  Star,
  Zap,
  Shield,
  Crown,
  Compass,
  Globe,
  Sun,
  Moon,
  Coffee,
  Music,
  Camera,
  Palette,
} from 'lucide-react'
import type { AvatarIconId } from './avatar'

export const AVATAR_ICON_MAP: Record<AvatarIconId, LucideIcon> = {
  user: User,
  users: Users,
  briefcase: Briefcase,
  heart: Heart,
  star: Star,
  zap: Zap,
  shield: Shield,
  crown: Crown,
  compass: Compass,
  globe: Globe,
  sun: Sun,
  moon: Moon,
  coffee: Coffee,
  music: Music,
  camera: Camera,
  palette: Palette,
}
