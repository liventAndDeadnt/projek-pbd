import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Icon, type IconName } from './icons'

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <header className="page-header">
      <div className="page-header-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {action && <div className="page-header-actions">{action}</div>}
    </header>
  )
}

export function StatCard({
  label,
  value,
  note,
  icon,
  loading = false,
}: {
  label: string
  value: string | number
  note: string
  icon: IconName
  loading?: boolean
}) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon">
          <Icon name={icon} size={15} />
        </span>
      </div>
      <strong className="stat-value">{loading ? '—' : value}</strong>
      <span className="stat-note">{note}</span>
    </article>
  )
}

export function EmptyState({
  title = 'Belum ada data.',
  detail = 'Belum ada data untuk ditampilkan.',
  icon = 'inbox',
  action,
}: {
  title?: string
  detail?: string
  icon?: IconName
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={18} />
      </span>
      <strong>{title}</strong>
      <p>{detail}</p>
      {action}
    </div>
  )
}

export function StatusBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue'
}) {
  const toneClass = tone === 'blue' ? 'info' : tone
  return (
    <span className={`badge badge--${toneClass}`}>
      <span className="badge-dot" aria-hidden="true" />
      {children}
    </span>
  )
}

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3600)
    return () => window.clearTimeout(timer)
  }, [message, onClose])

  return (
    <div className="toast" role="status" aria-live="polite">
      <span aria-hidden="true">
        <Icon name="check" size={16} />
      </span>
      <span>{message}</span>
      <button type="button" aria-label="Tutup notifikasi" onClick={onClose}>
        <Icon name="close" size={14} />
      </button>
    </div>
  )
}

export function Modal({
  title,
  description,
  children,
  onClose,
  wide = false,
}: {
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  const titleId = useId()
  const descriptionId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const hadNoScroll = document.body.classList.contains('no-scroll')
    document.body.classList.add('no-scroll')
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKeyDown)
    closeRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      if (!hadNoScroll) document.body.classList.remove('no-scroll')
    }
  }, [])

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className={`modal${wide ? ' modal--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <header className="modal-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descriptionId}>{description}</p>}
          </div>
          <button
            ref={closeRef}
            className="icon-btn icon-btn--sm"
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
          >
            <Icon name="close" size={16} />
          </button>
        </header>
        <div className="modal-content">{children}</div>
      </section>
    </div>
  )
}

export function Field({
  label,
  required,
  hint,
  error,
  full,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  error?: string
  full?: boolean
  children: ReactNode
}) {
  return (
    <label className={`field${full ? ' field--full' : ''}`}>
      <span>
        {label}
        {required && <em aria-hidden="true"> *</em>}
      </span>
      {children}
      {hint && <small>{hint}</small>}
      {error && <small className="field-error">{error}</small>}
    </label>
  )
}

export function FormActions({
  onCancel,
  submit = 'Simpan',
  disabled = false,
}: {
  onCancel: () => void
  submit?: string
  disabled?: boolean
}) {
  return (
    <div className="form-actions">
      <button className="btn btn--secondary" type="button" disabled={disabled} onClick={onCancel}>
        Batal
      </button>
      <button className="btn btn--primary" type="submit" disabled={disabled}>
        {submit}
      </button>
    </div>
  )
}
