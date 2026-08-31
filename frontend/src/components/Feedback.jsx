const feedbackLabels = {
  error: 'Error',
  info: 'Info',
  success: 'Success',
  warning: 'Warning',
}

function Alert({ children, className = '', type = 'info' }) {
  if (!children) {
    return null
  }

  return (
    <div className={`app-alert app-alert-${type} ${className}`} role={type === 'error' ? 'alert' : 'status'}>
      <span className="app-feedback-icon" aria-hidden="true" />
      <strong>{feedbackLabels[type] || feedbackLabels.info}</strong>
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
      <span className="app-feedback-icon" aria-hidden="true" />
      <div>
        <strong>{feedbackLabels[toast.type] || feedbackLabels.info}</strong>
        <span>{toast.message}</span>
      </div>
      <button type="button" aria-label="Dismiss notification" onClick={onClose}>
        <span aria-hidden="true" />
      </button>
    </div>
  )
}

export { Alert, Toast }
