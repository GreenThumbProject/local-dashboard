import { useState } from 'react'
import { useCultivation, useAdvancePhase } from '../api/piApi'

export default function Cultivation() {
  const { data, isLoading, error } = useCultivation()
  const advancePhase = useAdvancePhase()
  const [notes, setNotes] = useState('')
  const [advancing, setAdvancing] = useState(false)

  if (isLoading) return <div className="p-8 text-gray-500">Loading…</div>
  if (error)     return <div className="p-8 text-red-400">{error.message}</div>

  const cultivation   = data?.cultivation
  const phases        = data?.phases ?? []
  const currentPhase  = data?.current_phase

  async function handleAdvance() {
    setAdvancing(true)
    try {
      await advancePhase.mutateAsync({ notes: notes || undefined })
      setNotes('')
    } finally {
      setAdvancing(false)
    }
  }

  if (!cultivation) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Cultivation</h2>
        <div className="card text-gray-500 text-sm">No active cultivation found.</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h2 className="text-xl font-semibold">Cultivation</h2>

      {/* Cultivation summary */}
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">Active Cultivation</h3>
        <dl className="space-y-2 text-sm">
          <Row label="ID"      value={cultivation.id_cultivation} />
          <Row label="Species" value={cultivation.species_name ?? `ID ${cultivation.id_plant_species}`} />
          <Row label="Started" value={cultivation.start_date ? new Date(cultivation.start_date).toLocaleDateString() : '—'} />
          {cultivation.notes && <Row label="Notes" value={cultivation.notes} />}
        </dl>
      </div>

      {/* Current phase */}
      {currentPhase && (
        <div className="card border-brand-700 space-y-2">
          <div className="flex items-center gap-2">
            <span className="badge-green">Current phase</span>
            <h3 className="text-sm font-semibold text-gray-200">
              {currentPhase.phase_name ?? `Phase ${currentPhase.id_growth_phase}`}
            </h3>
          </div>
          <dl className="space-y-1 text-sm">
            <Row label="Order"   value={currentPhase.phase_order} />
            <Row label="Started" value={new Date(currentPhase.started_at).toLocaleDateString()} />
            <Row label="Method"  value={currentPhase.detected_by} />
          </dl>
        </div>
      )}

      {/* Phase history timeline */}
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">Phase History</h3>
        {phases.length === 0 ? (
          <p className="text-gray-500 text-sm">No phases recorded yet.</p>
        ) : (
          <ol className="relative border-l border-gray-800 ml-2 space-y-4">
            {phases.map((p) => (
              <li key={p.id_cultivation_phase} className="ml-4">
                <div className={`absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full border-2 ${
                  p.is_current
                    ? 'border-brand-500 bg-brand-500'
                    : 'border-gray-700 bg-gray-900'
                }`} />
                <div className="text-sm">
                  <span className="font-medium text-gray-200">
                    {p.phase_name ?? `Phase ${p.id_growth_phase}`}
                  </span>
                  <span className="ml-2 text-gray-500">
                    {new Date(p.started_at).toLocaleDateString()}
                    {p.ended_at ? ` → ${new Date(p.ended_at).toLocaleDateString()}` : ' → now'}
                  </span>
                  {p.is_current && <span className="ml-2 badge-green">Current</span>}
                </div>
                {p.notes && <p className="text-xs text-gray-500 mt-0.5">{p.notes}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Advance phase */}
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">Advance to Next Phase</h3>
        <p className="text-xs text-gray-500">
          Closes the current phase and opens the next one in sequence (by phase_order).
        </p>
        <div>
          <label className="label">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="input"
            placeholder="e.g. Plants look healthy, advancing manually"
          />
        </div>
        <button
          onClick={handleAdvance}
          disabled={advancing || advancePhase.isPending}
          className="btn-primary"
        >
          {advancing ? 'Advancing…' : 'Advance phase'}
        </button>
        {advancePhase.isError && (
          <p className="text-xs text-red-400">{advancePhase.error.message}</p>
        )}
        {advancePhase.isSuccess && (
          <p className="text-xs text-brand-400">Phase advanced successfully.</p>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-200">{value ?? '—'}</dd>
    </div>
  )
}
