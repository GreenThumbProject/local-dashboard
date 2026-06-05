import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { useSystemState, useMeasurements } from '../api/piApi'

const TIME_RANGES = [
  { label: '1h',  minutes: 60 },
  { label: '6h',  minutes: 360 },
  { label: '24h', minutes: 1440 },
  { label: '7d',  minutes: 10080 },
]

const COLOURS = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4']

export default function Graphs() {
  useEffect(() => { document.title = 'GreenThumb · Graphs' }, [])

  const [range, setRange] = useState(TIME_RANGES[1])
  const [selectedVar, setSelectedVar] = useState(null)

  const { data: state } = useSystemState()
  const { data: mData, isLoading } = useMeasurements({ limit: 2000 })

  const varIds      = Object.keys(state?.sensor_values ?? {}).map(Number)
  const variablesMap = state?.variables ?? {}
  const varLabel = (id) => variablesMap[id]?.name ?? `Variable ${id}`

  // Filter measurements by selected time range
  const cutoff = new Date(Date.now() - range.minutes * 60_000)
  const allMeasurements = Array.isArray(mData) ? mData : (mData?.data ?? [])
  const filtered = allMeasurements.filter(m => new Date(m.collected_at) >= cutoff)

  // Group by variable, then format for recharts
  const byVar = {}
  for (const m of filtered) {
    if (!byVar[m.id_variable]) byVar[m.id_variable] = {}
    const ts = new Date(m.collected_at).toISOString()
    if (!byVar[m.id_variable][ts]) byVar[m.id_variable][ts] = {}
    byVar[m.id_variable][ts].value = m.value
    byVar[m.id_variable][ts].ts    = ts
  }

  // Merge all timestamps into a single sorted series (normalise to ISO string to match byVar keys)
  const allTs = [...new Set(filtered.map(m => new Date(m.collected_at).toISOString()))].sort()
  const chartData = allTs.map(ts => {
    const point = { ts: new Date(ts).toLocaleTimeString() }
    for (const varId of varIds) {
      if (byVar[varId]?.[ts]) point[`var_${varId}`] = byVar[varId][ts].value
    }
    return point
  })

  const displayVars = selectedVar ? [selectedVar] : varIds

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Graphs</h2>
        <div className="flex items-center gap-3">
          {/* Time range selector */}
          <div className="flex rounded-lg overflow-hidden border border-gray-700">
            {TIME_RANGES.map(r => (
              <button
                key={r.label}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  range.label === r.label
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-900 text-gray-400 hover:text-gray-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Variable filter */}
          <select
            value={selectedVar ?? ''}
            onChange={e => setSelectedVar(e.target.value ? Number(e.target.value) : null)}
            className="input w-40"
          >
            <option value="">All variables</option>
            {varIds.map(id => (
              <option key={id} value={id}>{varLabel(id)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="h-80 flex flex-col gap-4 p-4">
            <div className="skeleton h-full w-full" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-gray-400">
            No data for this time range
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="ts"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#111827',
                    border: '1px solid #374151',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                {displayVars.map((varId, i) => (
                  <Line
                    key={varId}
                    type="monotone"
                    dataKey={`var_${varId}`}
                    name={varLabel(varId)}
                    stroke={COLOURS[i % COLOURS.length]}
                    dot={false}
                    strokeWidth={2}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Summary stats */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayVars.map((varId, i) => {
            const vals = chartData
              .map(d => d[`var_${varId}`])
              .filter(v => v != null)
            if (!vals.length) return null
            const avg = vals.reduce((a, b) => a + b, 0) / vals.length
            const mn  = Math.min(...vals)
            const mx  = Math.max(...vals)
            return (
              <div key={varId} className="card text-sm space-y-1">
                <div className="font-medium" style={{ color: COLOURS[i % COLOURS.length] }}>
                  {varLabel(varId)}
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Avg</span><span className="text-gray-200">{avg.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Min</span><span className="text-gray-200">{mn.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Max</span><span className="text-gray-200">{mx.toFixed(2)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
