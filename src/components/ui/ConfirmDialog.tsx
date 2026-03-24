import Modal from './Modal'

interface Props {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export default function ConfirmDialog({ title, message, confirmLabel = 'Bestätigen', cancelLabel = 'Abbrechen', onConfirm, onCancel, danger = false }: Props) {
  return (
    <Modal title={title} onClose={onCancel} size="sm">
      <div className="px-6 py-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export { ConfirmDialog }
