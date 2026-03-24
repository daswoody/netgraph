import { useCallback, useMemo, useEffect, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeChange,
  type Connection,
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
  const { fitView } = useReactFlow()

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
    return toRFEdges(nodes, visibleIds, selectedNodeId)
  }, [nodes, graphFilters, focusMode, selectedNodeId])

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
  }, [selectNode])

  return (
    <div className="flex-1 relative bg-gray-50 dark:bg-gray-950">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClick}
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
