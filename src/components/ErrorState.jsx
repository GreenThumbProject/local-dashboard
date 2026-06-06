export default function ErrorState({ title, message, detail, onRetry }) {
  return (
    <div className="p-6">
      <div className="card border-red-900 space-y-3 max-w-md">
        <p className="text-sm font-semibold text-red-400">{title}</p>
        <p className="text-sm text-gray-400">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="btn-secondary text-sm w-fit">
            Try again
          </button>
        )}
        {detail && (
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-400 select-none">
              Technical details
            </summary>
            <code className="mt-2 block font-mono break-all text-gray-500 bg-gray-800/50 rounded p-2">
              {detail}
            </code>
          </details>
        )}
      </div>
    </div>
  )
}
