export default function StatusBadge({ ok, children }) {
  return (
    <span className={ok ? 'badge-green' : 'badge-red'} aria-label={ok ? 'OK' : 'Alert'}>
      {ok ? '✓' : '✗'} {children}
    </span>
  )
}
