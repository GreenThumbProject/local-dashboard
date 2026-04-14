export default function StatusBadge({ ok, children }) {
  return (
    <span className={ok ? 'badge-green' : 'badge-red'}>
      {ok ? '✓' : '✗'} {children}
    </span>
  )
}
