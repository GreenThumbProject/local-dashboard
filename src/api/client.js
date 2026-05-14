/** Base fetch wrapper — throws on non-2xx responses. */
export async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`
    try {
      const body = await res.json()
      if (body?.detail) message = body.detail
    } catch {
      message = await res.text().catch(() => res.statusText) || message
    }
    throw new Error(message)
  }
  // 204 No Content
  if (res.status === 204) return null
  return res.json()
}

export const get  = (path)         => apiFetch(path)
export const post = (path, body)   => apiFetch(path, { method: 'POST',  body: JSON.stringify(body) })
export const patch = (path, body)  => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) })
export const del  = (path)         => apiFetch(path, { method: 'DELETE' })
