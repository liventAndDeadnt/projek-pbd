import { useEffect, type ReactNode } from 'react'

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{action && <div className="page-heading-action">{action}</div>}</div>
}

export function EmptyState({ title = 'Belum ada data tersedia.', detail = 'Belum ada data untuk ditampilkan.' }: { title?: string; detail?: string }) {
  return <div className="empty-state"><span className="empty-state-icon" aria-hidden="true">⌕</span><strong>{title}</strong><p>{detail}</p></div>
}

export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue' }) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>
}

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const timer = window.setTimeout(onClose, 3600); return () => window.clearTimeout(timer) }, [message, onClose])
  return <div className="toast" role="status"><span aria-hidden="true">✓</span>{message}<button type="button" aria-label="Tutup notifikasi" onClick={onClose}>×</button></div>
}

export function Modal({ title, description, children, onClose, wide = false }: { title: string; description?: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className={`modal${wide ? ' modal--wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title"><header className="modal-header"><div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div><button className="icon-button" type="button" onClick={onClose} aria-label="Tutup dialog">×</button></header><div className="modal-content">{children}</div></section></div>
}

export function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return <label className="form-field"><span>{label}{required && <em aria-hidden="true"> *</em>}</span>{children}{hint && <small>{hint}</small>}</label>
}

export function FormActions({ onCancel, submit = 'Simpan' }: { onCancel: () => void; submit?: string }) {
  return <div className="form-actions"><button className="button button--secondary" type="button" onClick={onCancel}>Batal</button><button className="button button--primary" type="submit">{submit}</button></div>
}

