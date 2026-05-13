/**
 * Pi API hooks — all data fetching for the local dashboard.
 *
 * Functions return objects suitable for use with @tanstack/react-query's
 * queryOptions / useQuery / useMutation.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post, patch } from './client'

// ---------------------------------------------------------------------------
// State — GET /state/   (sensor readings, thresholds, active phase)
// ---------------------------------------------------------------------------
export function useSystemState(refetchInterval = 10_000) {
  return useQuery({
    queryKey: ['state'],
    queryFn: () => get('/state/'),
    refetchInterval,
  })
}

// ---------------------------------------------------------------------------
// Measurements — GET /measurement/   (historical data)
// ---------------------------------------------------------------------------
export function useMeasurements({ id_variable, limit = 200 } = {}) {
  return useQuery({
    queryKey: ['measurements', id_variable, limit],
    queryFn: () => get(`/measurement?limit=${limit}${id_variable ? `&id_variable=${id_variable}` : ''}`),
    enabled: true,
  })
}

// ---------------------------------------------------------------------------
// Settings — GET /settings/
// ---------------------------------------------------------------------------
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => get('/settings/'),
    refetchInterval: 30_000,
  })
}

export function useUpdateDeviceMode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (device_mode) => patch('/settings/device-mode', { device_mode }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}

// ---------------------------------------------------------------------------
// Thresholds — GET /settings/thresholds
// ---------------------------------------------------------------------------
export function useThresholds() {
  return useQuery({
    queryKey: ['thresholds'],
    queryFn: () => get('/settings/thresholds'),
  })
}

export function useUpdateThreshold() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }) => patch(`/settings/thresholds/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['thresholds'] }),
  })
}

// ---------------------------------------------------------------------------
// Cultivation — GET /settings/cultivation
// ---------------------------------------------------------------------------
export function useCultivation() {
  return useQuery({
    queryKey: ['cultivation'],
    queryFn: () => get('/settings/cultivation'),
  })
}

export function useAdvancePhase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => post('/settings/cultivation/advance-phase', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cultivation'] })
      qc.invalidateQueries({ queryKey: ['state'] })
    },
  })
}

export function usePlantSpecies() {
  return useQuery({
    queryKey: ['plant-species'],
    queryFn: () => get('/settings/plant-species'),
  })
}

export function useBeginCultivation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => post('/settings/cultivation/begin', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cultivation'] })
      qc.invalidateQueries({ queryKey: ['state'] })
    },
  })
}

export function useEndCultivation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => post('/settings/cultivation/end', {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cultivation'] })
      qc.invalidateQueries({ queryKey: ['state'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Actuator commands — POST /state/actuators/{id}/command
// ---------------------------------------------------------------------------
export function useCommandActuator() {
  return useMutation({
    mutationFn: ({ id, ...payload }) =>
      post(`/state/actuators/${id}/command`, { ...payload, triggered_by: 'manual' }),
  })
}

// ---------------------------------------------------------------------------
// Manual sync — POST /settings/sync
// ---------------------------------------------------------------------------
export function useTriggerSync() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => post('/settings/sync', {}),
    onSuccess: () => setTimeout(() => qc.invalidateQueries({ queryKey: ['settings'] }), 3000),
  })
}

// ---------------------------------------------------------------------------
// Camera capture — POST /camera/capture
// ---------------------------------------------------------------------------
export function useCapturePhoto() {
  return useMutation({
    mutationFn: () => post('/camera/capture', {}),
  })
}
