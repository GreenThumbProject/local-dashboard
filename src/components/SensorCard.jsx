import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

/**
 * Compact sensor reading card with a sparkline.
 *
 * Props:
 *   label      — variable name (e.g. "Temperature")
 *   value      — current reading (number)
 *   unit       — unit string (e.g. "°C")
 *   history    — array of { value } for the sparkline (optional)
 *   min        — threshold min (optional, for colour coding)
 *   max        — threshold max (optional)
 */
export default function SensorCard({ label, value, unit = '', history = [], min, max }) {
  const outOfRange =
    (min !== undefined && value < min) || (max !== undefined && value > max)
  const valueColour = outOfRange ? 'text-red-400' : 'text-brand-400'

  return (
    <div className="card flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <span className="text-sm text-gray-400 font-medium">{label}</span>
        {outOfRange && <span className="badge-red">Out of range</span>}
      </div>

      <div className={`text-3xl font-bold tabular-nums ${valueColour}`}>
        {value != null ? value.toFixed(1) : '—'}
        <span className="text-base font-normal text-gray-500 ml-1">{unit}</span>
      </div>

      {history.length > 1 && (
        <div className="h-12 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={outOfRange ? '#f87171' : '#22c55e'}
                dot={false}
                strokeWidth={1.5}
              />
              <Tooltip
                contentStyle={{ background: '#111827', border: 'none', borderRadius: 6, fontSize: 12 }}
                formatter={(v) => [`${v.toFixed(2)} ${unit}`, label]}
                labelFormatter={() => ''}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {(min !== undefined || max !== undefined) && (
        <div className="flex gap-3 text-xs text-gray-500">
          {min !== undefined && <span>Min {min}</span>}
          {max !== undefined && <span>Max {max}</span>}
        </div>
      )}
    </div>
  )
}
