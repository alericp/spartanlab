/**
 * Display values for the optional program builder.
 * A saved answer is shown as stored. A missing answer stays missing.
 */

export const BUILDER_DURATION_OPTIONS = [30, 45, 60, 90] as const

export interface BuilderFieldDisplay {
  mode: 'option' | 'saved' | 'missing'
  value: string
  label: string
}

export function goalFieldDisplay(
  value: string | null | undefined,
  labels: Record<string, string>,
): BuilderFieldDisplay {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return { mode: 'missing', value: '', label: 'Not saved' }
  }
  const label = labels[value]
  if (typeof label === 'string' && label.length > 0) {
    return { mode: 'option', value, label }
  }
  return { mode: 'saved', value, label: value }
}

export function durationFieldDisplay(value: unknown): BuilderFieldDisplay {
  if (value === null || value === undefined || value === '') {
    return { mode: 'missing', value: '', label: 'Not saved' }
  }

  const numeric = typeof value === 'number' ? value : Number(value)
  if (
    typeof value === 'number'
    && Number.isFinite(numeric)
    && (BUILDER_DURATION_OPTIONS as readonly number[]).includes(numeric)
  ) {
    return { mode: 'option', value: String(numeric), label: `${numeric} min` }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return { mode: 'saved', value: String(value), label: `${value} min` }
  }

  if (typeof value === 'string' && value.trim().length > 0 && value !== 'null') {
    return { mode: 'saved', value, label: value }
  }

  return { mode: 'missing', value: '', label: 'Not saved' }
}
