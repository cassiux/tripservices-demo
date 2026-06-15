import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names with Tailwind-aware conflict resolution.
 * Used by all shadcn/ui components in src/components/ui.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
