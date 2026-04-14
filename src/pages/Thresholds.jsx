import { useState } from 'react'
import { useThresholds, useUpdateThreshold } from '../api/piApi'

export default function Thresholds() {
  const { data, isLoading, error } = useThresholds()
  const updateThreshold = useUpdateThreshold()
  const [editing, setEditing] = useState(null)   // id_threshold being edited
  const [draft, setDraft]     = useState({})

  if (isLoading) return <div className="p-8 text-gray-500">Loading…</div>
  if (error)     return <div className="p-8 text-red-400">{error.message}</div>

  const thresholds = data?.thresholds ?? []
  const cultivation = data?.cultivation

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
        {cultivation && (
          <span className="text-sm text-gray-500">
            Cultivation #{cultivation.id_cultivation}
          </span>
        )}
      </div>

      {thresholds.length === 0 ? (
        <div className="card text-gray-500 text-sm">No thresholds defined.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left">Variable</th>
                <th className="px-4 py-3 text-left">Phase</th>
                <th className="px-4 py-3 text-right">Min</th>
                <th className="px-4 py-3 text-right">Max</th>
                <th className="px-4 py-3 text-right">Target</th>
                <th className="px-4 py-3 text-center">Active</th>
                <th className="px-4 py-3 text-center">Dirty</th>
                <th className="px-4 py-3"></th>
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
                        {t.is_dirty && <span className="badge-yellow">Pending</span>}
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
        <p className="text-xs text-yellow-500">
          ⚠ Changes marked "Pending" will be pushed to the cloud on the next sync cycle.
        </p>
      )}
    </div>
  )
}
