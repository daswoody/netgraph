import { type AppNode, type Graph, type Group } from '../types'

const BASE = '/api'

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  // ── Graphs ────────────────────────────────────────────────────────────────
  getGraphs: () => req<Graph[]>('GET', '/graphs'),
  createGraph: (name: string) => req<Graph>('POST', '/graphs', { name }),
  renameGraph: (id: string, name: string) => req<Graph>('PATCH', `/graphs/${id}`, { name }),
  deleteGraph: (id: string) => req<void>('DELETE', `/graphs/${id}`),

  // ── Groups ────────────────────────────────────────────────────────────────
  getGroups: (graphId: string) => req<Group[]>('GET', `/graphs/${graphId}/groups`),
  createGroup: (graphId: string, data: Omit<Group, 'id'>) =>
    req<Group>('POST', `/graphs/${graphId}/groups`, data),
  updateGroup: (graphId: string, groupId: string, data: Omit<Group, 'id'>) =>
    req<Group>('PUT', `/graphs/${graphId}/groups/${groupId}`, data),
  deleteGroup: (graphId: string, groupId: string) =>
    req<void>('DELETE', `/graphs/${graphId}/groups/${groupId}`),

  // ── Nodes ─────────────────────────────────────────────────────────────────
  getNodes: (graphId: string) => req<AppNode[]>('GET', `/graphs/${graphId}/nodes`),
  createNode: (graphId: string, data: Omit<AppNode, 'id'>) =>
    req<AppNode>('POST', `/graphs/${graphId}/nodes`, data),
  updateNode: (graphId: string, nodeId: string, data: Partial<AppNode>) =>
    req<AppNode>('PUT', `/graphs/${graphId}/nodes/${nodeId}`, data),
  deleteNode: (graphId: string, nodeId: string) =>
    req<void>('DELETE', `/graphs/${graphId}/nodes/${nodeId}`),

  // ── Bulk import ───────────────────────────────────────────────────────────
  importGraph: (graphId: string, data: { nodes: AppNode[]; groups: Group[] }) =>
    req<{ nodes: AppNode[]; groups: Group[] }>('POST', `/graphs/${graphId}/import`, data),
}
