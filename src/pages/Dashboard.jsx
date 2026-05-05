import { useSystemState, useMeasurements } from '../api/piApi'
import SensorCard from '../components/SensorCard'
import StatusBadge from '../components/StatusBadge'

/**
 * Dashboard — home page.
 *
 * Shows:
 *   - Real-time sensor cards (value + sparkline)
 *   - Live MJPEG camera feed
 *   - Device status (mode, safety mode, last heartbeat)
 *   - Active cultivation + current growth phase
 */
export default function Dashboard() {
  const { data: state, isLoading, error } = useSystemState(5_000)
  // Grab recent measurements for sparklines (last 50 per variable)
  const { data: mData } = useMeasurements({ limit: 500 })

  if (isLoading) return <PageShell><div className="text-gray-500 p-8">Loading…</div></PageShell>
  if (error)     return <PageShell><div className="text-red-400 p-8">Error: {error.message}</div></PageShell>

  // Build {id_variable: [{ value }]} history map from measurement list
  const historyMap = {}
  if (mData) {
    for (const m of (Array.isArray(mData) ? mData : mData.data ?? [])) {
      if (!historyMap[m.id_variable]) historyMap[m.id_variable] = []
      historyMap[m.id_variable].push({ value: m.value })
    }
  }

  // Build threshold map {id_variable: { min, max }}
  const thresholdMap = {}
  for (const t of (state?.thresholds ?? [])) {
    if (!thresholdMap[t.id_variable]) {
      thresholdMap[t.id_variable] = { min: t.min_value, max: t.max_value }
    }
  }

  const sensorValues = state?.sensor_values ?? {}
  const variablesMap = state?.variables ?? {}

  const cards = Object.entries(sensorValues).map(([idVar, value]) => ({
    id_variable: Number(idVar),
    value,
    label: variablesMap[idVar]?.name ?? `Variable ${idVar}`,
    unit:  variablesMap[idVar]?.unit ?? '',
  }))

  const activePhase = state?.active_phase

  return (
    <PageShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <div className="flex items-center gap-3">
            <StatusBadge ok={!state?.safety_mode}>
              {state?.safety_mode ? 'Safety Mode' : 'Normal'}
            </StatusBadge>
            {activePhase && (
              <span className="badge-green">
                Phase {activePhase.id_growth_phase}
              </span>
            )}
          </div>
        </div>

        {/* Sensor cards grid */}
        {cards.length === 0 ? (
          <div className="card text-gray-500 text-sm">No sensor data available.</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cards.map(({ id_variable, value, label, unit }) => (
              <SensorCard
                key={id_variable}
                label={label}
                value={value}
                unit={unit}
                history={historyMap[id_variable] ?? []}
                min={thresholdMap[id_variable]?.min}
                max={thresholdMap[id_variable]?.max}
              />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Camera feed */}
          <div className="card">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Live Camera</h3>
            <div className="bg-black rounded-lg overflow-hidden aspect-video">
              <img
                src="/video/"
                alt="Live camera feed"
                className="w-full h-full object-contain"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </div>
          </div>

          {/* Device status */}
          <div className="card space-y-4">
            <h3 className="text-sm font-medium text-gray-400">Device Status</h3>
            <dl className="space-y-2 text-sm">
              <Row label="Safety mode" value={
                <StatusBadge ok={!state?.safety_mode}>
                  {state?.safety_mode ? 'Active' : 'Off'}
                </StatusBadge>
              } />
              <Row label="Timestamp" value={
                <span className="text-gray-300 font-mono text-xs">{state?.timestamp ?? '—'}</span>
              } />
            </dl>

            {activePhase && (
              <>
                <hr className="border-gray-800" />
                <h3 className="text-sm font-medium text-gray-400">Active Cultivation</h3>
                <dl className="space-y-2 text-sm">
                  <Row label="Phase ID"  value={activePhase.id_growth_phase} />
                  <Row label="Started"   value={
                    <span className="text-gray-300 font-mono text-xs">
                      {new Date(activePhase.started_at).toLocaleDateString()}
                    </span>
                  } />
                </dl>
              </>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}

function PageShell({ children }) {
  return <div className="min-h-full">{children}</div>
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <dt className="text-gray-500">{label}</dt>
      <dd>{typeof value === 'string' || typeof value === 'number'
        ? <span className="text-gray-200">{value}</span>
        : value}
      </dd>
    </div>
  )
}
