import { useState, useRef, useEffect } from 'react'

export interface SelectOption {
  value: string
  label: string
  color?: string
}

interface Props {
  options: SelectOption[]
  /** Selected values. Alias: `selected` */
  value?: string[]
  /** @deprecated Use `value` */
  selected?: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  /** Limit selection to N items (1 = single-select behaviour) */
  maxSelect?: number
}

export function MultiSelect({
  options,
  value,
  selected,
  onChange,
  placeholder = 'Select…',
  maxSelect,
}: Props) {
  const current = value ?? selected ?? []
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggle = (val: string) => {
    if (current.includes(val)) {
      onChange(current.filter((v) => v !== val))
    } else {
      if (maxSelect === 1) {
        onChange([val])
        setOpen(false)
      } else if (!maxSelect || current.length < maxSelect) {
        onChange([...current, val])
      }
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Use div instead of button to avoid nested-button HTML violation */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!open) } }}
        className="w-full flex items-center gap-1 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm hover:border-gray-300 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-1 min-w-0 flex-1 truncate">
          {current.length === 0 ? (
            <span className="text-gray-400 dark:text-gray-500">{placeholder}</span>
          ) : (
            <>
              {current.slice(0, 2).map((v) => {
                const opt = options.find((o) => o.value === v)
                return opt ? (
                  <span key={v} className="flex items-center gap-1 shrink-0">
                    {opt.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />}
                    <span className="text-gray-800 dark:text-gray-100 max-w-[70px] truncate text-xs">{opt.label}</span>
                  </span>
                ) : null
              })}
              {current.length > 2 && (
                <span className="text-indigo-600 dark:text-indigo-400 font-medium shrink-0 text-xs">+{current.length - 2}</span>
              )}
            </>
          )}
        </span>
        {current.length > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange([]) }}
            className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
        <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {open && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl overflow-hidden max-h-52 overflow-y-auto">
          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">No options</div>
          )}
          {options.map((opt) => {
            const isSel = current.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                  isSel ? 'bg-indigo-50 dark:bg-indigo-900/40' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                  isSel ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 dark:border-gray-500'
                }`}>
                  {isSel && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                {opt.color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />}
                <span className={isSel ? 'text-indigo-700 dark:text-indigo-300 font-medium' : 'text-gray-700 dark:text-gray-200'}>
                  {opt.label}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MultiSelect
