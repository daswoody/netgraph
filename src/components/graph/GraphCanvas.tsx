import { useCallback, useMemo, useEffect, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeChange,
  type Connection,
  type EdgeMouseHandler,
  BackgroundVariant,
  useReactFlow,
} from '@xyflow/react'
import { useAppStore } from '../../store/useAppStore'
import { toRFNodes, toRFEdges } from '../../lib/graphUtils'
import { computeVisibleIds } from '../../lib/filterUtils'
import { computeLayout } from '../../lib/layoutUtils'
import { AppNodeComponent } from './AppNodeComponent'
import { DotNodeComponent } from './DotNodeComponent'

// Must be defined outside component to prevent React Flow re-registration
const NODE_TYPES_NODE = { appNode: AppNodeComponent }
const NODE_TYPES_DOT = { dotNode: DotNodeComponent }

export function GraphCanvas() {
  const nodes = useAppStore((s) => s.nodes)
  const groups = useAppStore((s) => s.groups)
  const selectedNodeId = useAppStore((s) => s.selectedNodeId)
  const focusMode = useAppStore((s) => s.focusMode)
  const dotMode = useAppStore((s) => s.dotMode)
  const graphFilterGroupIds = useAppStore((s) => s.graphFilters.groupIds)
  const graphFilterTags = useAppStore((s) => s.graphFilters.tags)

  const moveNode = useAppStore((s) => s.moveNode)
  const selectNode = useAppStore((s) => s.selectNode)
  const openDetailPanel = useAppStore((s) => s.openDetailPanel)
  const updateNode = useAppStore((s) => s.updateNode)
  const setNodePositions = useAppStore((s) => s.setNodePositions)
  const copyNode = useAppStore((s) => s.copyNode)
  const pasteNode = useAppStore((s) => s.pasteNode)
  const { fitView } = useReactFlow()

  // Edge selection
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const selectedEdgeIdRef = useRef<string | null>(null)
  useEffect(() => {
    selectedEdgeIdRef.current = selectedEdgeId
  }, [selectedEdgeId])

  const graphFilters = useMemo(
    () => ({ groupIds: graphFilterGroupIds, tags: graphFilterTags }),
    [graphFilterGroupIds, graphFilterTags],
  )

  // Auto-layout when filters, dotMode, focusMode, or node count changes
  const prevStateRef = useRef<string>('')
  useEffect(() => {
    const key = JSON.stringify({
      groupIds: graphFilterGroupIds,
      tags: graphFilterTags,
      dotMode,
      focusMode,
      nodeCount: nodes.length,
    })
    if (prevStateRef.current !== '' && prevStateRef.current !== key) {
      const { nodes: currentNodes, graphFilters: currentFilters, focusMode: currentFocus, selectedNodeId: currentSelected } =
        useAppStore.getState()
      const visibleIds = computeVisibleIds(currentNodes, currentFilters, currentFocus, currentSelected)
      const visibleNodes = currentNodes.filter((n) => visibleIds.has(n.id))
      const positions = computeLayout(visibleNodes, dotMode)
      setNodePositions(positions)
      setTimeout(() => fitView({ padding: 0.2 }), 50)
    }
    prevStateRef.current = key
  }, [graphFilterGroupIds, graphFilterTags, dotMode, focusMode, nodes.length])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      const edgeId = selectedEdgeIdRef.current

      // Delete selected edge
      if ((e.key === 'Delete' || e.key === 'Backspace') && edgeId) {
        e.preventDefault()
        const parts = edgeId.split('--')
        if (parts.length === 2) {
          const [id1, id2] = parts
          const { nodes: currentNodes } = useAppStore.getState()
          const node1 = currentNodes.find((n) => n.id === id1)
          const node2 = currentNodes.find((n) => n.id === id2)
          if (node1) {
            updateNode(id1, { connectedNodeIds: node1.connectedNodeIds.filter((id) => id !== id2) })
          }
          if (node2) {
            updateNode(id2, { connectedNodeIds: node2.connectedNodeIds.filter((id) => id !== id1) })
          }
        }
        setSelectedEdgeId(null)
        return
      }

      // Copy node
      if ((e.key === 'c' || e.key === 'C') && (e.ctrlKey || e.metaKey)) {
        const { selectedNodeId: sid } = useAppStore.getState()
        if (sid) {
          e.preventDefault()
          copyNode(sid)
        }
        return
      }

      // Paste node
      if ((e.key === 'v' || e.key === 'V') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        pasteNode()
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [updateNode, copyNode, pasteNode])

  // Compute RF nodes and edges
  const rfNodes = useMemo(() => {
    const base = toRFNodes(nodes, groups, selectedNodeId, focusMode, graphFilters)
    if (dotMode) {
      return base.map((n) => ({ ...n, type: 'dotNode' as const }))
    }
    return base
  }, [nodes, groups, selectedNodeId, focusMode, graphFilters, dotMode])

  const rfEdges = useMemo(() => {
    const visibleIds = computeVisibleIds(nodes, graphFilters, focusMode, selectedNodeId)
    const edges = toRFEdges(nodes, visibleIds, selectedNodeId)
    return edges.map((edge) => {
      if (edge.id === selectedEdgeId) {
        return {
          ...edge,
          style: { strokeWidth: 2.5, stroke: '#6366f1', opacity: 0.9 },
        }
      }
      return edge
    })
  }, [nodes, graphFilters, focusMode, selectedNodeId, selectedEdgeId])

  const nodeTypes = dotMode ? NODE_TYPES_DOT : NODE_TYPES_NODE

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Only persist position on drag end
      changes.forEach((change) => {
        if (change.type === 'position' && change.dragging === false && change.position) {
          moveNode(change.id, change.position)
        }
      })
    },
    [moveNode],
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      selectNode(node.id)
      openDetailPanel(node.id)
    },
    [selectNode, openDetailPanel],
  )

  const onEdgeClick: EdgeMouseHandler = useCallback(
    (_: React.MouseEvent, edge: { id: string }) => {
      setSelectedEdgeId(edge.id)
    },
    [],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      const { nodes: currentNodes } = useAppStore.getState()
      const sourceNode = currentNodes.find((n) => n.id === connection.source)
      if (!sourceNode) return
      if (!sourceNode.connectedNodeIds.includes(connection.target)) {
        updateNode(connection.source, {
          connectedNodeIds: [...sourceNode.connectedNodeIds, connection.target],
        })
      }
    },
    [updateNode],
  )

  const onPaneClick = useCallback(() => {
    selectNode(null)
    setSelectedEdgeId(null)
  }, [selectNode])

  return (
    <div className="flex-1 relative bg-gray-50 dark:bg-gray-950">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={3}
        defaultEdgeOptions={{ type: 'straight', animated: false }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          className="dark:opacity-30"
        />
        <Controls className="dark:[&_button]:bg-gray-800 dark:[&_button]:text-gray-300 dark:[&_button]:border-gray-600" />
        <MiniMap
          className="dark:bg-gray-800"
          nodeColor={(n) => {
            const rfNode = rfNodes.find((rn) => rn.id === n.id)
            const appNode = rfNode?.data?.appNode as { color?: string } | undefined
            const group = rfNode?.data?.group as { color?: string } | undefined
            return appNode?.color ?? group?.color ?? '#94a3b8'
          }}
          maskColor="rgba(0,0,0,0.1)"
        />
      </ReactFlow>
    </div>
  )
}

export default GraphCanvas
