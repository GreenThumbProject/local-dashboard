import { useState, useEffect } from 'react'
import {
  useThresholds, useUpdateThreshold, useCreateThreshold,
  useVariables, useGrowthPhases,
} from '../api/piApi'

const BLANK_NEW = { id_variable: '', id_growth_phase: '', min_value: '', max_value: '', target_value: '' }

export default function Thresholds() {
  useEffect(() => { document.title = 'GreenThumb · Thresholds' }, [])

  const { data, isLoading, error } = useThresholds()
  const { data: varsData }  = useVariables()
  const { data: phasesData } = useGrowthPhases()
  const updateThreshold  = useUpdateThreshold()
  const createThreshold  = useCreateThreshold()
  const [editing, setEditing]   = useState(null)
  const [draft, setDraft]       = useState({})
  const [showForm, setShowForm] = useState(false)
  const [newT, setNewT]         = useState(BLANK_NEW)

  if (isLoading) return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="skeleton h-7 w-32" />
        <div className="skeleton h-8 w-32" />
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900">
            <tr>
              {['Variable', 'Phase', 'Min', 'Max', 'Target', 'Active', 'Sync', ''].map(h => (
                <th key={h} className="th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {[...Array(3)].map((_, i) => (
              <tr key={i} className="bg-gray-950">
                {[...Array(8)].map((__, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="skeleton h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
  if (error) return <div className="p-8 text-red-400">{error.message}</div>

  const thresholds  = data?.thresholds ?? []
  const cultivation = data?.cultivation
  const variables   = varsData?.variables ?? []
  const phases      = phasesData?.growth_phases ?? []

  async function handleCreate(e) {
    e.preventDefault()
    await createThreshold.mutateAsync({
      id_variable:    Number(newT.id_variable),
      id_growth_phase: Number(newT.id_growth_phase),
      min_value:    newT.min_value    !== '' ? Number(newT.min_value)    : undefined,
      max_value:    newT.max_value    !== '' ? Number(newT.max_value)    : undefined,
      target_value: newT.target_value !== '' ? Number(newT.target_value) : undefined,
    })
    setNewT(BLANK_NEW)
    setShowForm(false)
  }

  function startEdit(t) {
    setEditing(t.id_threshold)
    setDraft({
      min_value:    t.min_value    ?? '',
      max_value:    t.max_value    ?? '',
      target_value: t.target_value ?? '',
      is_active:    t.is_active,
    })
  }

  function cancelEdit() {
    setEditing(null)
    setDraft({})
  }

  async function saveEdit(id) {
    await updateThreshold.mutateAsync({
      id,
      min_value:    draft.min_value    !== '' ? Number(draft.min_value)    : undefined,
      max_value:    draft.max_value    !== '' ? Number(draft.max_value)    : undefined,
      target_value: draft.target_value !== '' ? Number(draft.target_value) : undefined,
      is_active:    draft.is_active,
    })
    setEditing(null)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Thresholds</h2>
        <div className="flex items-center gap-3">
          {cultivation && (
            <span className="text-sm text-gray-400">Cultivation #{cultivation.id_cultivation}</span>
          )}
          {cultivation && (
            <button onClick={() => setShowForm(v => !v)} className="btn-secondary text-xs px-3 py-1">
              {showForm ? 'Cancel' : '+ Add threshold'}
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card grid grid-cols-2 gap-3 max-w-lg">
          <div className="col-span-2">
            <label htmlFor="new-threshold-variable" className="label text-xs">Variable *</label>
            <select
              id="new-threshold-variable"
              required
              value={newT.id_variable}
              onChange={e => setNewT(n => ({ ...n, id_variable: e.target.value }))}
              className="input text-sm"
            >
              <option value="">Select variable…</option>
              {variables.map(v => (
                <option key={v.id_variable} value={v.id_variable}>{v.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label htmlFor="new-threshold-phase" className="label text-xs">Growth phase *</label>
            <select
              id="new-threshold-phase"
              required
              value={newT.id_growth_phase}
              onChange={e => setNewT(n => ({ ...n, id_growth_phase: e.target.value }))}
              className="input text-sm"
            >
              <option value="">Select phase…</option>
              {phases.map(p => (
                <option key={p.id_growth_phase} value={p.id_growth_phase}>
                  {p.name}{p.is_default ? ' (all phases)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="new-threshold-min" className="label text-xs">Min value</label>
            <input
              id="new-threshold-min"
              type="number"
              step="any"
              value={newT.min_value}
              className="input text-sm"
              onChange={e => setNewT(n => ({ ...n, min_value: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="new-threshold-max" className="label text-xs">Max value</label>
            <input
              id="new-threshold-max"
              type="number"
              step="any"
              value={newT.max_value}
              className="input text-sm"
              onChange={e => setNewT(n => ({ ...n, max_value: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label htmlFor="new-threshold-target" className="label text-xs">Target value</label>
            <input
              id="new-threshold-target"
              type="number"
              step="any"
              value={newT.target_value}
              className="input text-sm"
              onChange={e => setNewT(n => ({ ...n, target_value: e.target.value }))}
            />
          </div>
          <div className="col-span-2 flex gap-2">
            <button type="submit" disabled={createThreshold.isPending} className="btn-primary text-sm">
              {createThreshold.isPending ? 'Adding…' : 'Add threshold'}
            </button>
            {createThreshold.isError && (
              <p className="text-xs text-red-400 self-center">{createThreshold.error.message}</p>
            )}
          </div>
        </form>
      )}

      {thresholds.length === 0 ? (
        <div className="card text-gray-400 text-sm">
          No thresholds defined for the active cultivation. Use the button above to add a threshold.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-gray-400">
              <tr>
                <th className="th">Variable</th>
                <th className="th">Phase</th>
                <th className="th text-right">Min</th>
                <th className="th text-right">Max</th>
                <th className="th text-right">Target</th>
                <th className="th text-center">Active</th>
                <th className="th text-center">Sync</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {thresholds.map(t => (
                <tr key={t.id_threshold} className="bg-gray-950 hover:bg-gray-900 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-200">
                    {t.variable_name ?? `Var ${t.id_variable}`}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {t.is_default_phase
                      ? <span className="badge-gray">All phases</span>
                      : <span className="badge-green">{t.phase_name ?? `Phase ${t.id_growth_phase}`}</span>
                    }
                  </td>

                  {editing === t.id_threshold ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={draft.min_value}
                          onChange={e => setDraft(d => ({ ...d, min_value: e.target.value }))}
                          className="input text-right w-24"
                          placeholder="—"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={draft.max_value}
                          onChange={e => setDraft(d => ({ ...d, max_value: e.target.value }))}
                          className="input text-right w-24"
                          placeholder="—"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={draft.target_value}
                          onChange={e => setDraft(d => ({ ...d, target_value: e.target.value }))}
                          className="input text-right w-24"
                          placeholder="—"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={draft.is_active}
                          onChange={e => setDraft(d => ({ ...d, is_active: e.target.checked }))}
                          className="w-4 h-4 accent-brand-500"
                        />
                      </td>
                      <td />
                      <td className="px-4 py-2">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => saveEdit(t.id_threshold)}
                            disabled={updateThreshold.isPending}
                            className="btn-primary text-xs px-3 py-1"
                          >
                            Save
                          </button>
                          <button onClick={cancelEdit} className="btn-secondary text-xs px-3 py-1">
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-300">
                        {t.min_value ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-300">
                        {t.max_value ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-300">
                        {t.target_value ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={t.is_active ? 'badge-green' : 'badge-gray'}>
                          {t.is_active ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {t.is_dirty && <span className="badge-yellow">Pending sync</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => startEdit(t)}
                          className="btn-secondary text-xs px-3 py-1"
                        >
                          Edit
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {thresholds.some(t => t.is_dirty) && (
        <p className="text-xs text-yellow-400">
          ⚠ Changes marked "Pending" will be pushed to the cloud on the next sync cycle.
        </p>
      )}
    </div>
  )
}
