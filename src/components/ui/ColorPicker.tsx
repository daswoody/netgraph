interface Props {
  value: string
  onChange: (color: string) => void
  label?: string
}

export default function ColorPicker({ value, onChange, label }: Props) {
  return (
    <div className="flex items-center gap-3">
      {label && <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>}
      <label className="flex items-center gap-2 cursor-pointer">
        <div className="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm cursor-pointer overflow-hidden" style={{ backgroundColor: value }}>
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="opacity-0 w-full h-full cursor-pointer" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => { const v = e.target.value; if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v) }}
          className="w-24 px-2 py-1 text-sm font-mono border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
          placeholder="#000000"
          maxLength={7}
        />
      </label>
    </div>
  )
}

export { ColorPicker }
