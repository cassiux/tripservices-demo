import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import type { ContentType } from '../types'

interface ContentTypeBadgeProps {
  type: ContentType
  className?: string
}

/** Token classes per content type (CLAUDE.md design system). */
const STYLES: Record<ContentType, string> = {
  NDC: 'bg-ndc text-ndc-text',
  EDIFACT: 'bg-edifact text-edifact-text',
  LCC: 'bg-lcc text-lcc-text',
}

const LABEL_KEY: Record<ContentType, string> = {
  NDC: 'search.contentType.ndc',
  EDIFACT: 'search.contentType.edifact',
  LCC: 'search.contentType.lcc',
}

const ARIA_KEY: Record<ContentType, string> = {
  NDC: 'search.contentType.ndcLabel',
  EDIFACT: 'search.contentType.edifactLabel',
  LCC: 'search.contentType.lccLabel',
}

/** Always-visible content-source badge for an offer (NDC / EDIFACT / LCC). */
export function ContentTypeBadge({ type, className }: ContentTypeBadgeProps) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        STYLES[type],
        className,
      )}
      aria-label={t(ARIA_KEY[type])}
    >
      {t(LABEL_KEY[type])}
    </span>
  )
}
