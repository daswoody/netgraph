import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ReactFlowProvider } from '@xyflow/react'
import { useAppStore } from '../store/useAppStore'
import Topbar from '../components/layout/Topbar'
import Sidebar from '../components/layout/Sidebar'
import GraphCanvas from '../components/graph/GraphCanvas'
import GraphFilterBar from '../components/graph/GraphFilterBar'
import NodeDetailPanel from '../components/panels/NodeDetailPanel'
import NodeForm from '../components/panels/NodeForm'
import AdminModal from '../components/admin/AdminModal'

export default function GraphPage() {
  const { graphId } = useParams<{ graphId: string }>()
  const navigate = useNavigate()

  const loadGraph = useAppStore((s) => s.loadGraph)
  const clearGraph = useAppStore((s) => s.clearGraph)
  const loading = useAppStore((s) => s.loading)
  const nodeFormOpen = useAppStore((s) => s.nodeFormOpen)
  const adminModalOpen = useAppStore((s) => s.adminModalOpen)
  const detailPanelNodeId = useAppStore((s) => s.detailPanelNodeId)

  useEffect(() => {
    if (!graphId) { navigate('/'); return }
    loadGraph(graphId)
    return () => clearGraph()
  }, [graphId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950 text-gray-400">
        <svg className="animate-spin w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
        </svg>
        Loading graph…
      </div>
    )
  }

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
        {/* Header */}
        <Topbar />

        {/* Main area */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left sidebar */}
          <Sidebar />

          {/* Graph area */}
          <div className="flex flex-col flex-1 overflow-hidden relative">
            <GraphFilterBar />
            <div className="flex flex-1 overflow-hidden min-h-0">
              <GraphCanvas />
              {detailPanelNodeId && <NodeDetailPanel />}
            </div>
          </div>
        </div>

        {/* Modals */}
        {nodeFormOpen && <NodeForm />}
        {adminModalOpen && <AdminModal />}
      </div>
    </ReactFlowProvider>
  )
}
