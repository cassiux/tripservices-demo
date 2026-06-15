import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { ContentType } from '../types'
import { ContentTypeBadge } from './ContentTypeBadge'

describe('ContentTypeBadge', () => {
  const cases: { type: ContentType; label: string; classes: [string, string]; aria: string }[] = [
    { type: 'NDC', label: 'NDC', classes: ['bg-ndc', 'text-ndc-text'], aria: 'NDC content' },
    {
      type: 'EDIFACT',
      label: 'EDIFACT',
      classes: ['bg-edifact', 'text-edifact-text'],
      aria: 'EDIFACT content',
    },
    {
      type: 'LCC',
      label: 'LCC',
      classes: ['bg-lcc', 'text-lcc-text'],
      aria: 'Low-cost carrier content',
    },
  ]

  it.each(cases)(
    'renders the $type badge with its token classes and label',
    ({ type, label, classes, aria }) => {
      render(<ContentTypeBadge type={type} />)

      const badge = screen.getByText(label)
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass(...classes)
      expect(badge).toHaveAttribute('aria-label', aria)
    },
  )
})
