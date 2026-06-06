import { useRef, useEffect, useState } from 'react'
import { LineChart, Line, ReferenceLine, ResponsiveContainer, Tooltip } from 'recharts'

export default function SensorCard({ label, value, unit = '', history = [], min, max, target, style }) {
  const outOfRange = (min !== undefined && value < min) || (max !== undefined && value > max)
  const valueColour = outOfRange ? 'text-red-400' : 'text-brand-400'
  const hasAnnotation = min !== undefined || max !== undefined || target !== undefined

  // Flash overlay: remount via key when value changes to restart animation
  const prevValueRef = useRef(value)
  const [flashGen, setFlashGen] = useState(0)
  useEffect(() => {
    if (prevValueRef.current !== value && value != null) {
      setFlashGen(g => g + 1)
    }
    prevValueRef.current = value
  }, [value])

  return (
    <div className="card flex flex-col gap-2" style={style}>
      <div className="flex items-start justify-between">
        <span className="text-sm text-gray-400 font-medium">{label}</span>
        {outOfRange && (
          <span className="badge-red" title="Value is outside the configured threshold">
            Out of range
          </span>
        )}
      </div>

      <div className="relative">
        {flashGen > 0 && (
          <span
            key={flashGen}
            className="value-flash-pulse absolute inset-0 rounded-md pointer-events-none"
            aria-hidden="true"
          />
        )}
        <div className={`text-3xl font-bold tabular-nums ${valueColour}`}>
          {value != null ? value.toFixed(1) : '—'}
          <span className="text-base font-normal text-gray-500 ml-1">{unit}</span>
        </div>
      </div>

      {history.length > 1 && (
        <div className="h-12 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              {target !== undefined && (
                <ReferenceLine
                  y={target}
                  stroke="#4b5563"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
              )}
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

      {hasAnnotation && (
        <div className="flex gap-3 text-xs text-gray-400">
          {min !== undefined && <span>Min {min}</span>}
          {target !== undefined && (
            <span className="text-gray-500">· Target {target} ·</span>
          )}
          {max !== undefined && <span>Max {max}</span>}
        </div>
      )}
    </div>
  )
}
