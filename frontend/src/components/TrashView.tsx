import { ArchiveRestore, Box, FileText, RotateCcw, ShieldCheck, Tag, Trash2, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { TrashRecord } from '../types'
import { formatDateTime } from '../utils'
import { Pagination, usePagination } from './Pagination'

interface TrashViewProps {
  items: TrashRecord[]
  loading: boolean
  onRestore: (id: number) => Promise<void>
  onDeleteForever: (id: number) => Promise<void>
  types?: TrashRecord['type'][]
}

const kinds: Record<TrashRecord['type'], { label: string; icon: typeof Box }> = {
  ASSET: { label: 'Hàng hóa', icon: Box },
  CUSTOMER: { label: 'Khách hàng', icon: Users },
  USER: { label: 'Tài khoản', icon: ShieldCheck },
  ORDER: { label: 'Hóa đơn', icon: FileText },
  BRAND: { label: 'Thương hiệu sản phẩm', icon: Tag },
}
const allTrashTypes: TrashRecord['type'][] = ['ASSET', 'CUSTOMER', 'USER', 'ORDER', 'BRAND']

export function TrashView({ items, loading, onRestore, onDeleteForever, types }: TrashViewProps) {
  const [filter, setFilter] = useState<'ALL' | TrashRecord['type']>('ALL')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const visibleTypes = types ?? allTrashTypes
  const filtered = useMemo(() => items.filter(item =>
    visibleTypes.includes(item.type) && (visibleTypes.length === 1 || filter === 'ALL' || item.type === filter)
  ), [items, visibleTypes, filter])
  const pagination = usePagination(filtered)
  const title = visibleTypes.length === 1 ? `${kinds[visibleTypes[0]].label} đã xóa` : 'Thùng rác'

  async function restore(id: number) {
    setBusyId(id)
    setError('')
    try {
      await onRestore(id)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Không thể khôi phục mục này')
    } finally {
      setBusyId(null)
    }
  }

  async function deleteForever(item: TrashRecord) {
    if (!window.confirm(`Xóa vĩnh viễn "${item.label}"? Thao tác này không thể hoàn tác.`)) return
    setBusyId(item.id)
    setError('')
    try {
      await onDeleteForever(item.id)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Không thể xóa vĩnh viễn mục này')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page-stack">
      <section className="page-heading-row trash-page-heading">
        <div><p className="eyebrow">KHÔI PHỤC DỮ LIỆU</p><h2>{title}</h2><p className="muted">Mục đã xóa được lưu cho đến khi Admin xóa vĩnh viễn. Khôi phục để đưa dữ liệu về danh sách ban đầu.</p></div>
        <span className="trash-total"><Trash2 size={16} /> {filtered.length} mục đang lưu</span>
      </section>
      <section className="surface trash-surface">
        <div className="trash-toolbar">{visibleTypes.length > 1 && <div className="trash-filters">
          {(['ALL', 'ASSET', 'CUSTOMER', 'USER', 'ORDER', 'BRAND'] as const).map(type => <button key={type} className={filter === type ? 'active' : ''} onClick={() => { setFilter(type); pagination.setPage(0) }}>{type === 'ALL' ? 'Tất cả' : kinds[type].label}{type === 'ALL' ? ` (${items.length})` : ` (${items.filter(item => item.type === type).length})`}</button>)}
        </div>}<span className="trash-retention">Không tự động xóa dữ liệu</span></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {loading ? <div className="table-message">Đang tải thùng rác...</div> : filtered.length === 0 ? <div className="trash-empty"><ArchiveRestore size={29} /><strong>Thùng rác đang trống</strong><span>Các mục đã chuyển vào đây sẽ xuất hiện tại vị trí này.</span></div> : (
          <div className="trash-list">{pagination.pageItems.map(item => {
            const KindIcon = kinds[item.type].icon
            return <article className="trash-row" key={item.id}>
              <span className={`trash-kind-icon trash-kind-${item.type.toLowerCase()}`}><KindIcon size={18} /></span>
              <span className="trash-item-copy"><strong>{item.label}</strong><small>{kinds[item.type].label} · {item.summary}</small><small>Đã xóa {formatDateTime(item.deletedAt)} bởi {item.deletedBy}</small></span>
              <div className="trash-actions"><button className="button button-secondary compact-button" disabled={busyId === item.id} onClick={() => void restore(item.id)}><RotateCcw size={14} /> Khôi phục</button><button className="button button-danger-quiet compact-button" disabled={busyId === item.id} onClick={() => void deleteForever(item)}><Trash2 size={14} /> Xóa vĩnh viễn</button></div>
            </article>
          })}</div>
        )}
        {!loading && filtered.length > 0 && <Pagination totalItems={filtered.length} page={pagination.page} pageSize={10} onPageChange={pagination.setPage} />}
      </section>
    </div>
  )
}
