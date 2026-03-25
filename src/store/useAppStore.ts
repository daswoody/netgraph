import { create } from 'zustand'
import { type AppNode, type Group, type GraphFilters, type SidebarFilters } from '../types'
import { api } from '../lib/api'

interface UIState {
  selectedNodeId: string | null
  focusMode: boolean
  dotMode: boolean
  darkMode: boolean
  graphFilters: GraphFilters
  sidebarFilters: SidebarFilters
  nodeFormOpen: boolean
  editingNodeId: string | null
  adminModalOpen: boolean
  detailPanelNodeId: string | null
}

interface AppStore {
  // Domain state
  currentGraphId: string | null
  nodes: AppNode[]
  groups: Group[]
  loading: boolean

  // Clipboard
  clipboardNode: AppNode | null

  // UI state
  selectedNodeId: string | null
  focusMode: boolean
  dotMode: boolean
  darkMode: boolean
  graphFilters: GraphFilters
  sidebarFilters: SidebarFilters
  nodeFormOpen: boolean
  editingNodeId: string | null
  adminModalOpen: boolean
  detailPanelNodeId: string | null

  // Graph lifecycle
  loadGraph: (graphId: string) => Promise<void>
  clearGraph: () => void

  // Node actions
  addNode: (node: Omit<AppNode, 'id'>) => Promise<void>
  updateNode: (id: string, patch: Partial<Omit<AppNode, 'id'>>) => void
  deleteNode: (id: string) => void
  moveNode: (id: string, position: { x: number; y: number }) => void
  setNodePositions: (positions: Record<string, { x: number; y: number }>) => void
  duplicateNode: (id: string) => Promise<void>
  copyNode: (id: string) => void
  pasteNode: () => Promise<void>

  // Group actions
  addGroup: (group: Omit<Group, 'id'>) => Promise<void>
  updateGroup: (id: string, patch: Partial<Omit<Group, 'id'>>) => void
  deleteGroup: (id: string) => void

  // UI actions
  selectNode: (id: string | null) => void
  setFocusMode: (enabled: boolean) => void
  setDotMode: (enabled: boolean) => void
  setDarkMode: (enabled: boolean) => void
  setGraphFilters: (filters: Partial<GraphFilters>) => void
  setSidebarFilters: (filters: Partial<SidebarFilters>) => void
  openNodeForm: (nodeId?: string) => void
  closeNodeForm: () => void
  openAdminModal: () => void
  closeAdminModal: () => void
  openDetailPanel: (nodeId: string) => void
  closeDetailPanel: () => void

  // Data
  exportJSON: () => void
  importJSON: (data: { nodes: AppNode[]; groups: Group[] }) => Promise<void>
}

const initialUIState: UIState = {
  selectedNodeId: null,
  focusMode: false,
  dotMode: false,
  darkMode: localStorage.getItem('darkMode') === 'true',
  graphFilters: { groupIds: [], tags: [] },
  sidebarFilters: { search: '', groupIds: [], tags: [] },
  nodeFormOpen: false,
  editingNodeId: null,
  adminModalOpen: false,
  detailPanelNodeId: null,
}

export const useAppStore = create<AppStore>()((set, get) => ({
  currentGraphId: null,
  nodes: [],
  groups: [],
  loading: false,
  clipboardNode: null,
  ...initialUIState,

  // ── Graph lifecycle ────────────────────────────────────────────────────────

  loadGraph: async (graphId) => {
    set({
      loading: true,
      currentGraphId: graphId,
      nodes: [],
      groups: [],
      ...initialUIState,
      darkMode: localStorage.getItem('darkMode') === 'true',
    })
    try {
      const [nodes, groups] = await Promise.all([
        api.getNodes(graphId),
        api.getGroups(graphId),
      ])
      set({ nodes, groups, loading: false })
    } catch (e) {
      console.error('Failed to load graph:', e)
      set({ loading: false })
    }
  },

  clearGraph: () =>
    set({
      currentGraphId: null,
      nodes: [],
      groups: [],
      ...initialUIState,
      darkMode: localStorage.getItem('darkMode') === 'true',
    }),

  // ── Node actions ────────────────────────────────────────────────────────────

  addNode: async (node) => {
    const graphId = get().currentGraphId
    if (!graphId) return
    const created = await api.createNode(graphId, node)
    set((state) => ({ nodes: [...state.nodes, created] }))

    // Bidirectional: add created node's ID to each connected node
    if (created.connectedNodeIds.length > 0) {
      const currentNodes = get().nodes
      const siblings = currentNodes.filter(
        (n) => n.id !== created.id && created.connectedNodeIds.includes(n.id),
      )
      for (const sibling of siblings) {
        if (!sibling.connectedNodeIds.includes(created.id)) {
          const updated = { ...sibling, connectedNodeIds: [...sibling.connectedNodeIds, created.id] }
          set((state) => ({
            nodes: state.nodes.map((n) => (n.id === sibling.id ? updated : n)),
          }))
          api.updateNode(graphId, sibling.id, updated).catch(console.error)
        }
      }
    }
  },

  updateNode: (id, patch) => {
    const graphId = get().currentGraphId
    const oldNode = get().nodes.find((n) => n.id === id)
    if (!oldNode) return

    // Apply patch locally
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    }))

    const updated = get().nodes.find((n) => n.id === id)
    if (updated && graphId) {
      api.updateNode(graphId, id, updated).catch(console.error)
    }

    // Bidirectional connection sync
    if (patch.connectedNodeIds !== undefined && graphId) {
      const oldConnected = oldNode.connectedNodeIds
      const newConnected = patch.connectedNodeIds

      const added = newConnected.filter((cid) => !oldConnected.includes(cid))
      const removed = oldConnected.filter((cid) => !newConnected.includes(cid))

      const currentNodes = get().nodes

      for (const addedId of added) {
        const sibling = currentNodes.find((n) => n.id === addedId)
        if (sibling && !sibling.connectedNodeIds.includes(id)) {
          const updatedSibling = { ...sibling, connectedNodeIds: [...sibling.connectedNodeIds, id] }
          set((state) => ({
            nodes: state.nodes.map((n) => (n.id === addedId ? updatedSibling : n)),
          }))
          api.updateNode(graphId, addedId, updatedSibling).catch(console.error)
        }
      }

      for (const removedId of removed) {
        const sibling = currentNodes.find((n) => n.id === removedId)
        if (sibling && sibling.connectedNodeIds.includes(id)) {
          const updatedSibling = {
            ...sibling,
            connectedNodeIds: sibling.connectedNodeIds.filter((cid) => cid !== id),
          }
          set((state) => ({
            nodes: state.nodes.map((n) => (n.id === removedId ? updatedSibling : n)),
          }))
          api.updateNode(graphId, removedId, updatedSibling).catch(console.error)
        }
      }
    }
  },

  deleteNode: (id) => {
    set((state) => {
      const next = state.nodes
        .filter((n) => n.id !== id)
        .map((n) => ({
          ...n,
          connectedNodeIds: n.connectedNodeIds.filter((cid) => cid !== id),
        }))
      return {
        nodes: next,
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        detailPanelNodeId: state.detailPanelNodeId === id ? null : state.detailPanelNodeId,
      }
    })
    const graphId = get().currentGraphId
    if (graphId) api.deleteNode(graphId, id).catch(console.error)
  },

  moveNode: (id, position) => {
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, position } : n)),
    }))
    const graphId = get().currentGraphId
    if (!graphId) return
    const node = get().nodes.find((n) => n.id === id)
    if (node) api.updateNode(graphId, id, node).catch(console.error)
  },

  setNodePositions: (positions) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        positions[n.id] ? { ...n, position: positions[n.id] } : n,
      ),
    }))
    const graphId = get().currentGraphId
    if (!graphId) return
    const nodes = get().nodes
    nodes.forEach((n) => {
      if (positions[n.id]) api.updateNode(graphId, n.id, n).catch(console.error)
    })
  },

  duplicateNode: async (id) => {
    const graphId = get().currentGraphId
    if (!graphId) return
    const original = get().nodes.find((n) => n.id === id)
    if (!original) return
    const copy: Omit<AppNode, 'id'> = {
      name: original.name + '-Copy',
      groupId: original.groupId,
      color: original.color,
      tags: [...original.tags],
      description: original.description,
      connectedNodeIds: [],
      position: { x: original.position.x + 30, y: original.position.y + 30 },
      image: original.image,
    }
    const created = await api.createNode(graphId, copy)
    set((state) => ({ nodes: [...state.nodes, created] }))
  },

  copyNode: (id) => {
    const node = get().nodes.find((n) => n.id === id)
    if (node) set({ clipboardNode: node })
  },

  pasteNode: async () => {
    const graphId = get().currentGraphId
    if (!graphId) return
    const original = get().clipboardNode
    if (!original) return
    const copy: Omit<AppNode, 'id'> = {
      name: original.name + '-Copy',
      groupId: original.groupId,
      color: original.color,
      tags: [...original.tags],
      description: original.description,
      connectedNodeIds: [],
      position: { x: original.position.x + 30, y: original.position.y + 30 },
      image: original.image,
    }
    const created = await api.createNode(graphId, copy)
    set((state) => ({ nodes: [...state.nodes, created] }))
  },

  // ── Group actions ───────────────────────────────────────────────────────────

  addGroup: async (group) => {
    const graphId = get().currentGraphId
    if (!graphId) return
    const created = await api.createGroup(graphId, group)
    set((state) => ({ groups: [...state.groups, created] }))
  },

  updateGroup: (id, patch) => {
    set((state) => ({
      groups: state.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }))
    const graphId = get().currentGraphId
    if (!graphId) return
    const updated = get().groups.find((g) => g.id === id)
    if (updated) api.updateGroup(graphId, id, updated).catch(console.error)
  },

  deleteGroup: (id) => {
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== id),
      nodes: state.nodes.map((n) =>
        n.groupId === id ? { ...n, groupId: null } : n,
      ),
    }))
    const graphId = get().currentGraphId
    if (graphId) api.deleteGroup(graphId, id).catch(console.error)
  },

  // ── UI actions ──────────────────────────────────────────────────────────────

  selectNode: (id) => set({ selectedNodeId: id }),
  setFocusMode: (enabled) => set({ focusMode: enabled }),
  setDotMode: (enabled) => set({ dotMode: enabled }),

  setDarkMode: (enabled) => {
    localStorage.setItem('darkMode', String(enabled))
    set({ darkMode: enabled })
  },

  setGraphFilters: (filters) =>
    set((state) => ({ graphFilters: { ...state.graphFilters, ...filters } })),

  setSidebarFilters: (filters) =>
    set((state) => ({ sidebarFilters: { ...state.sidebarFilters, ...filters } })),

  openNodeForm: (nodeId) => set({ nodeFormOpen: true, editingNodeId: nodeId ?? null }),
  closeNodeForm: () => set({ nodeFormOpen: false, editingNodeId: null }),
  openAdminModal: () => set({ adminModalOpen: true }),
  closeAdminModal: () => set({ adminModalOpen: false }),
  openDetailPanel: (nodeId) => set({ detailPanelNodeId: nodeId }),
  closeDetailPanel: () => set({ detailPanelNodeId: null, selectedNodeId: null }),

  // ── Data ─────────────────────────────────────────────────────────────────────

  exportJSON: () => {
    const { nodes, groups } = get()
    const data = JSON.stringify({ nodes, groups }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'network-graph-export.json'
    a.click()
    URL.revokeObjectURL(url)
  },

  importJSON: async (data) => {
    const graphId = get().currentGraphId
    if (!graphId) return
    try {
      const result = await api.importGraph(graphId, data)
      set({ nodes: result.nodes, groups: result.groups, ...initialUIState })
    } catch (e) {
      console.error('Import failed:', e)
    }
  },
}))
