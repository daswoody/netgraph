import { useState, useRef } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Modal } from '../ui/Modal'
import { GroupEditor } from './GroupEditor'
import { ConfirmDialog } from '../ui/ConfirmDialog'

type Tab = 'groups' | 'data'

export function AdminModal() {
  const closeAdminModal = useAppStore((s) => s.closeAdminModal)
  const exportJSON = useAppStore((s) => s.exportJSON)
  const importJSON = useAppStore((s) => s.importJSON)

  const [tab, setTab] = useState<Tab>('groups')
  const [importError, setImportError] = useState<string | null>(null)
  const [pendingImport, setPendingImport] = useState<{ nodes: unknown[]; groups: unknown[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (!Array.isArray(data.nodes) || !Array.isArray(data.groups)) {
          throw new Error('Invalid format: expected { nodes, groups }')
        }
        setPendingImport(data)
      } catch (err) {
        setImportError((err as Error).message)
      }
    }
    reader.readAsText(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  async function confirmImport() {
    if (!pendingImport) return
    await importJSON(pendingImport as Parameters<typeof importJSON>[0])
    setPendingImport(null)
    closeAdminModal()
  }

  return (
    <>
      <Modal onClose={closeAdminModal} title="Settings">
        <div>
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 -mx-6 px-6 mb-4">
            {(['groups', 'data'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === t
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {t === 'groups' ? 'Groups' : 'Export / Import'}
              </button>
            ))}
          </div>

          {tab === 'groups' && <GroupEditor />}

          {tab === 'data' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Export</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Download all nodes and groups as a JSON file.
                </p>
                <button
                  onClick={exportJSON}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors"
                >
                  Download JSON
                </button>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Import</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Replace all data with a previously exported JSON file. This cannot be undone.
                </p>
                {importError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mb-2">{importError}</p>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Choose JSON file…
                </button>
                <input ref={fileRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
              </div>
            </div>
          )}
        </div>
      </Modal>

      {pendingImport && (
        <ConfirmDialog
          title="Replace all data?"
          message={`This will replace ${pendingImport.nodes.length} nodes and ${pendingImport.groups.length} groups. This cannot be undone.`}
          onConfirm={confirmImport}
          onCancel={() => setPendingImport(null)}
        />
      )}
    </>
  )
}

export default AdminModal
