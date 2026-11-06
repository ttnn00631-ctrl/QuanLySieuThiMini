import { Archive, List } from 'lucide-react'

interface ManagementViewToggleProps {
  archived: boolean
  activeCount: number
  archivedCount: number
  onChange: (archived: boolean) => void
}

export function ManagementViewToggle({ archived, activeCount, archivedCount, onChange }: ManagementViewToggleProps) {
  return (
    <div className="management-view-toggle" role="tablist" aria-label="Danh sách dữ liệu">
      <button role="tab" aria-selected={!archived} className={!archived ? 'active' : ''} onClick={() => onChange(false)}>
        <List size={15} /> Đang quản lý <span>{activeCount}</span>
      </button>
      <button role="tab" aria-selected={archived} className={archived ? 'active' : ''} onClick={() => onChange(true)}>
        <Archive size={15} /> Đã xóa <span>{archivedCount}</span>
      </button>
    </div>
  )
}
