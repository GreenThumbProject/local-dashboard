import { useState, useEffect } from 'react'
import {
  useCultivation, useAdvancePhase,
  usePlantSpecies, useBeginCultivation, useEndCultivation,
} from '../api/piApi'

function BeginForm() {
  const { data: speciesList, isLoading: loadingSpecies } = usePlantSpecies()
  const beginCultivation = useBeginCultivation()
  const [form, setForm] = useState({ id_plant_species: '', notes: '' })

  const species = Array.isArray(speciesList) ? speciesList : []

  async function handleBegin(e) {
    e.preventDefault()
    await beginCultivation.mutateAsync({
      id_plant_species: Number(form.id_plant_species),
      notes: form.notes || undefined,
    })
  }

  return (
    <div className="card space-y-4">
      <h3 className="text-sm font-semibold text-gray-300">Start Cultivation</h3>
      <form onSubmit={handleBegin} className="space-y-3">
        <div>
          <label htmlFor="begin-species" className="label">Plant species *</label>
          <select
            id="begin-species"
            required
            value={form.id_plant_species}
            onChange={e => setForm(f => ({ ...f, id_plant_species: e.target.value }))}
            className="input"
            disabled={loadingSpecies}
          >
            <option value="">— select species —</option>
            {species.map(s => (
              <option key={s.id_plant_species} value={s.id_plant_species}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="begin-notes" className="label">Notes (optional)</label>
          <input
            id="begin-notes"
            type="text"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="input"
            placeholder="e.g. Batch A, seeds from supplier X"
          />
        </div>
        <button
          type="submit"
          disabled={beginCultivation.isPending || !form.id_plant_species}
          className="btn-primary"
        >
          {beginCultivation.isPending ? 'Starting…' : 'Begin cultivation'}
        </button>
        {beginCultivation.isError && (
          <p className="text-xs text-red-400">{beginCultivation.error.message}</p>
        )}
      </form>
    </div>
  )
}

export default function Cultivation() {
  useEffect(() => { document.title = 'GreenThumb · Cultivation' }, [])

  const { data, isLoading, error } = useCultivation()
  const advancePhase    = useAdvancePhase()
  const endCultivation  = useEndCultivation()
  const [notes, setNotes]           = useState('')
  const [advancing, setAdvancing]   = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)

  if (isLoading) return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="skeleton h-7 w-36" />
      <div className="card space-y-3">
        <div className="skeleton h-5 w-40" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-4 w-28" />
          </div>
        ))}
      </div>
      <div className="card space-y-3">
        <div className="skeleton h-5 w-32" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-3/4" />
      </div>
    </div>
  )
  if (error) return <div className="p-8 text-red-400">{error.message}</div>

  const cultivation  = data?.cultivation
  const phases       = data?.phases ?? []
  const currentPhase = data?.current_phase

  async function handleAdvance() {
    setAdvancing(true)
    try {
      await advancePhase.mutateAsync({ notes: notes || undefined })
      setNotes('')
    } finally {
      setAdvancing(false)
    }
  }

  async function handleEnd() {
    await endCultivation.mutateAsync()
    setConfirmEnd(false)
  }

  if (!cultivation) {
    return (
      <div className="p-6 space-y-6 max-w-2xl">
        <h2 className="text-xl font-semibold">Cultivation</h2>
        <BeginForm />
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
          <p className="text-gray-400 text-sm">No phases recorded yet.</p>
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
                  <span className="ml-2 text-gray-400">
                    {new Date(p.started_at).toLocaleDateString()}
                    {p.ended_at ? ` → ${new Date(p.ended_at).toLocaleDateString()}` : ' → now'}
                  </span>
                  {p.is_current && <span className="ml-2 badge-green">Current</span>}
                </div>
                {p.notes && <p className="text-xs text-gray-400 mt-0.5">{p.notes}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Advance phase */}
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">Advance to Next Phase</h3>
        <p className="text-xs text-gray-400">
          Closes the current phase and opens the next one in sequence (by phase_order).
        </p>
        <div>
          <label htmlFor="advance-notes" className="label">Notes (optional)</label>
          <input
            id="advance-notes"
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

      {/* End cultivation */}
      <div className="card space-y-3 border border-red-900">
        <h3 className="text-sm font-semibold text-red-400">End Cultivation</h3>
        <p className="text-xs text-gray-400">
          Closes the active cultivation and all open phases. This cannot be undone.
        </p>
        {!confirmEnd ? (
          <button onClick={() => setConfirmEnd(true)} className="btn-secondary text-red-400 border-red-800">
            End cultivation…
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleEnd}
              disabled={endCultivation.isPending}
              className="btn-primary bg-red-700 hover:bg-red-600"
            >
              {endCultivation.isPending ? 'Ending…' : 'Confirm end'}
            </button>
            <button onClick={() => setConfirmEnd(false)} className="btn-secondary text-xs">
              Cancel
            </button>
          </div>
        )}
        {endCultivation.isError && (
          <p className="text-xs text-red-400">{endCultivation.error.message}</p>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <dt className="text-gray-400">{label}</dt>
      <dd className="text-gray-200">{value ?? '—'}</dd>
    </div>
  )
}
