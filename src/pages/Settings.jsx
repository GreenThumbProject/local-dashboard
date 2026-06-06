import { useState, useEffect } from 'react'
import { HexColorPicker } from 'react-colorful'
import {
  useSettings, useUpdateDeviceMode, useCommandActuator,
  useTriggerSync, useCapturePhoto, useDeviceActuators,
} from '../api/piApi'

const MODES = ['LOW', 'MEDIUM', 'HIGH']

export default function Settings() {
  useEffect(() => { document.title = 'GreenThumb · Settings' }, [])

  const { data: settings, isLoading } = useSettings()
  const commandActuator  = useCommandActuator()
  const updateMode       = useUpdateDeviceMode()
  const triggerSync      = useTriggerSync()
  const capturePhoto     = useCapturePhoto()
  const { data: actuatorList } = useDeviceActuators()

  const [ledColour, setLedColour]   = useState('#ffffff')
  const [showPicker, setShowPicker] = useState(false)
  const [syncMsg, setSyncMsg]       = useState(null)

  if (isLoading) return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="skeleton h-7 w-40" />
      <div className="card space-y-4">
        <div className="skeleton h-5 w-32" />
        <div className="skeleton h-4 w-full" />
        <div className="flex gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-10 w-24" />)}
        </div>
      </div>
      <div className="card space-y-4">
        <div className="skeleton h-5 w-40" />
        <div className="skeleton h-10 w-full" />
        <div className="skeleton h-10 w-full" />
      </div>
    </div>
  )

  const device    = settings?.device ?? {}
  const sync      = settings?.sync   ?? {}
  const actuators = Array.isArray(actuatorList) ? actuatorList : []

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }

  async function sendLedColour(actuatorId) {
    const { r, g, b } = hexToRgb(ledColour)
    await commandActuator.mutateAsync({ id: actuatorId, r, g, b })
  }

  async function handleSync() {
    setSyncMsg(null)
    try {
      await triggerSync.mutateAsync()
      setSyncMsg('Sync triggered. Check sync times in a few seconds.')
    } catch (e) {
      setSyncMsg('Sync failed. Check your connection and try again.')
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h2 className="text-xl font-semibold">Device Settings</h2>

      {/* Device mode */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-gray-300">Operating Mode</h3>
        <p className="text-xs text-gray-400">
          Controls sensor polling frequency and actuator response aggressiveness.
          Changes are synced to the cloud on the next cycle.
        </p>
        <div className="flex gap-3">
          {MODES.map(mode => (
            <button
              key={mode}
              onClick={() => updateMode.mutate(mode)}
              disabled={updateMode.isPending}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                device.device_mode === mode
                  ? 'bg-brand-700 border-brand-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        {device.is_dirty && (
          <p className="text-xs text-yellow-400">⚠ Mode change pending cloud sync.</p>
        )}
      </div>

      {/* Manual actuator control */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-gray-300">Manual Actuator Control</h3>

        {/* RGB LED */}
        <div className="space-y-3">
          <label htmlFor="led-colour-swatch" className="label">RGB LED colour</label>
          <div className="flex items-center gap-4">
            <button
              id="led-colour-swatch"
              onClick={() => setShowPicker(v => !v)}
              className="w-10 h-10 rounded-lg border-2 border-gray-700 transition-colors"
              style={{ background: ledColour }}
              aria-label="Pick LED colour"
            />
            <span className="text-sm text-gray-400 font-mono">{ledColour.toUpperCase()}</span>
          </div>
          {showPicker && (
            <div className="w-48">
              <HexColorPicker color={ledColour} onChange={setLedColour} />
            </div>
          )}
          <ActuatorSelect
            actuators={actuators}
            type="RGB_LED"
            label="Set LED colour"
            onSend={sendLedColour}
            isPending={commandActuator.isPending}
          />
        </div>

        <hr className="border-gray-800" />

        {/* Water pump */}
        <div className="space-y-2">
          <label className="label">Water pump</label>
          <ActuatorSelect
            actuators={actuators}
            type="AIR_PUMP"
            label="Trigger pump (100%)"
            onSend={id => commandActuator.mutateAsync({ id, duty_cycle: 100 })}
            isPending={commandActuator.isPending}
          />
        </div>
      </div>

      {/* Sync status */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-gray-300">Cloud Sync</h3>
        <dl className="space-y-2 text-sm">
          <SyncRow label="Last config sync"    value={sync.last_config_sync} />
          <SyncRow label="Last data push"      value={sync.last_data_push} />
          <SyncRow label="Pending measurements" value={sync.pending_measurements} />
          <SyncRow label="Pending photos"       value={sync.pending_photos} />
        </dl>
        <button
          onClick={handleSync}
          disabled={triggerSync.isPending}
          className="btn-primary"
        >
          {triggerSync.isPending ? 'Triggering…' : 'Sync now'}
        </button>
        {syncMsg && <p className="text-xs text-gray-400">{syncMsg}</p>}
      </div>

      {/* Camera */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-gray-300">Camera</h3>
        <button
          onClick={() => capturePhoto.mutate()}
          disabled={capturePhoto.isPending}
          className="btn-secondary"
        >
          {capturePhoto.isPending ? 'Capturing…' : 'Capture photo now'}
        </button>
        {capturePhoto.data && (
          <p className="text-xs text-gray-400">Saved: {capturePhoto.data.image_path}</p>
        )}
        {capturePhoto.isError && (
          <p className="text-xs text-red-400">Could not capture photo. Check the camera is connected and try again.</p>
        )}
      </div>
    </div>
  )
}

function SyncRow({ label, value }) {
  return (
    <div className="flex justify-between text-gray-400">
      <span>{label}</span>
      <span className="text-gray-200 tabular-nums">
        {value != null ? String(value) : '—'}
      </span>
    </div>
  )
}

function ActuatorSelect({ actuators, type, label, onSend, isPending }) {
  const filtered = actuators.filter(a => a.actuator_type === type)
  const [selectedId, setSelectedId] = useState('')
  return (
    <div className="flex gap-2 items-center flex-wrap">
      <select
        value={selectedId}
        onChange={e => setSelectedId(e.target.value)}
        className="input"
      >
        <option value="">
          {filtered.length === 0 ? 'No actuators configured' : 'Select actuator…'}
        </option>
        {filtered.map(a => (
          <option key={a.id_device_actuator} value={a.id_device_actuator}>
            {a.name ?? a.actuator_type} (#{a.id_device_actuator})
          </option>
        ))}
      </select>
      <button
        onClick={() => selectedId && onSend(Number(selectedId))}
        disabled={!selectedId || isPending}
        className="btn-primary whitespace-nowrap"
      >
        {label}
      </button>
    </div>
  )
}
