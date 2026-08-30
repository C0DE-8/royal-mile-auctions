function Alert({ children, className = '', type = 'info' }) {
  if (!children) {
    return null
  }

  return (
    <div className={`app-alert app-alert-${type} ${className}`} role={type === 'error' ? 'alert' : 'status'}>
      <span>{children}</span>
    </div>
  )
}

function Toast({ onClose, toast }) {
  if (!toast) {
    return null
  }

  return (
    <div className={`app-toast app-toast-${toast.type}`} role="status" aria-live="polite">
      <span>{toast.message}</span>
      <button type="button" aria-label="Dismiss notification" onClick={onClose}>
        x
      </button>
    </div>
  )
}

export { Alert, Toast }
