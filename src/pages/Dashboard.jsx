import { useEffect } from 'react'
import { useSystemState, useMeasurements } from '../api/piApi'
import SensorCard from '../components/SensorCard'
import StatusBadge from '../components/StatusBadge'
import ErrorState from '../components/ErrorState'

/**
 * Dashboard — home page.
 *
 * Shows:
 *   - Real-time sensor cards (value + sparkline)
 *   - Live MJPEG camera feed
 *   - Device status (mode, safety mode, last heartbeat)
 *   - Active cultivation + current growth phase
 */
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso)
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function Dashboard() {
  useEffect(() => { document.title = 'GreenThumb · Dashboard' }, [])

  const { data: state, isLoading, error, refetch } = useSystemState(5_000)
  // Grab recent measurements for sparklines (last 50 per variable)
  const { data: mData } = useMeasurements({ limit: 500 })

  if (isLoading) return (
    <PageShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="skeleton h-7 w-32" />
          <div className="skeleton h-6 w-24" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card space-y-2">
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-8 w-16" />
              <div className="skeleton h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  )
  if (error) return (
    <PageShell>
      <ErrorState
        title="Could not load sensor data"
        message="Check that the Pi is running and reachable, then try again."
        detail={error.message}
        onRetry={refetch}
      />
    </PageShell>
  )

  // Build {id_variable: [{ value }]} history map from measurement list
  const historyMap = {}
  if (mData) {
    for (const m of (Array.isArray(mData) ? mData : mData.data ?? [])) {
      if (!historyMap[m.id_variable]) historyMap[m.id_variable] = []
      historyMap[m.id_variable].push({ value: m.value })
    }
  }

  // Build threshold map {id_variable: { min, max, target }}
  const thresholdMap = {}
  for (const t of (state?.thresholds ?? [])) {
    if (!thresholdMap[t.id_variable]) {
      thresholdMap[t.id_variable] = {
        min: t.min_value,
        max: t.max_value,
        target: t.target_value ?? undefined,
      }
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
  const phaseName = activePhase?.name ?? activePhase?.phase_name ?? null

  return (
    <PageShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Dashboard</h2>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
              <span>
                {state?.timestamp
                  ? `Updated ${new Date(state.timestamp).toLocaleTimeString()}`
                  : 'Connecting…'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge ok={!state?.safety_mode}>
              {state?.safety_mode ? 'Safety Mode' : 'Normal'}
            </StatusBadge>
            {activePhase && (
              <span className="badge-green">
                {phaseName ?? `Phase ${activePhase.id_growth_phase}`}
              </span>
            )}
          </div>
        </div>

        {/* Sensor cards grid */}
        {cards.length === 0 ? (
          <div className="card text-gray-500 text-sm">No sensor data available.</div>
        ) : (
          <div className="grid sensor-grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cards.map(({ id_variable, value, label, unit }, i) => (
              <SensorCard
                key={id_variable}
                style={{ '--i': i }}
                label={label}
                value={value}
                unit={unit}
                history={historyMap[id_variable] ?? []}
                min={thresholdMap[id_variable]?.min}
                max={thresholdMap[id_variable]?.max}
                target={thresholdMap[id_variable]?.target}
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
                <StatusBadge ok={!state?.safety_mode} title="Safety mode disables actuators to protect plants">
                  {state?.safety_mode ? 'Active' : 'Off'}
                </StatusBadge>
              } />
              <Row label="Last reading" value={
                state?.timestamp
                  ? <time
                      dateTime={state.timestamp}
                      title={new Date(state.timestamp).toLocaleString()}
                      className="text-gray-300 text-xs tabular-nums"
                    >
                      {timeAgo(state.timestamp)}
                    </time>
                  : <span className="text-gray-300 text-xs">—</span>
              } />
            </dl>

            {activePhase && (
              <>
                <hr className="border-gray-800" />
                <h3 className="text-sm font-medium text-gray-400">Active Cultivation</h3>
                <dl className="space-y-2 text-sm">
                  {phaseName
                    ? <Row label="Phase" value={phaseName} />
                    : <Row label="Phase ID" value={activePhase.id_growth_phase} />
                  }
                  <Row label="Started" value={
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
      <dt className="text-gray-400">{label}</dt>
      <dd>{typeof value === 'string' || typeof value === 'number'
        ? <span className="text-gray-200">{value}</span>
        : value}
      </dd>
    </div>
  )
}
