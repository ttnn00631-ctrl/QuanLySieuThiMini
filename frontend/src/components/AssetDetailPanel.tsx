import { ArrowDownToLine, ArrowUpFromLine, CalendarClock, Package, Pencil, Wrench, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api'
import type { Asset, Assignment, MaintenanceItem } from '../types'
import { formatCurrency, formatDate, formatDateTime, statusLabel, typeLabel } from '../utils'

interface AssetDetailPanelProps {
  asset: Asset
  canManage: boolean
  canManageAssignments: boolean
  canRequestMaintenance: boolean
  onClose: () => void
  onEdit: () => void
  onChanged: () => void
}

export function AssetDetailPanel({ asset, canManage, canManageAssignments, canRequestMaintenance, onClose, onEdit, onChanged }: AssetDetailPanelProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([])
  const [assignee, setAssignee] = useState('')
  const [location, setLocation] = useState(asset.location)
  const [note, setNote] = useState('')
  const [returnNote, setReturnNote] = useState('')
  const [issue, setIssue] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const DeviceIcon = Package

  useEffect(() => {
    Promise.all([api.assignments(asset.id), api.assetMaintenance(asset.id)])
      .then(([history, tickets]) => { setAssignments(history); setMaintenance(tickets) })
      .catch(exception => setError(exception instanceof Error ? exception.message : 'Không tải được lịch sử'))
  }, [asset.id])

  async function runAction(action: () => Promise<unknown>) {
    setBusy(true)
    setError('')
    try {
      await action()
      onChanged()
      onClose()
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Không thể hoàn thành thao tác')
    } finally {
      setBusy(false)
    }
  }

  async function submitAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await runAction(() => api.assign(asset.id, assignee, location, note))
  }

  async function submitMaintenance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await runAction(() => api.openMaintenance(asset.id, issue))
  }

  function retire() {
    if (window.confirm(`Ngừng kinh doanh sản phẩm ${asset.assetCode}?`)) {
      void runAction(() => api.retireAsset(asset.id))
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <section className="modal-card detail-modal" role="dialog" aria-modal="true" aria-labelledby="asset-detail-title">
        <header className="modal-header"><div className="detail-heading"><span className="device-icon large"><DeviceIcon size={20} /></span><div><p className="eyebrow">{asset.assetCode} · {typeLabel(asset.type)}</p><h2 id="asset-detail-title">{asset.manufacturer} {asset.modelName}</h2></div></div><button className="icon-button" aria-label="Đóng" onClick={onClose}><X size={19} /></button></header>
        <div className="detail-status-row"><span className={`status-badge status-${asset.status.toLowerCase()}`}><span />{statusLabel(asset.status)}</span><span className="detail-current">{asset.assigneeName ? `Người nhận hàng: ${asset.assigneeName}` : `Vị trí kệ: ${asset.location}`}</span>{canManage && <button className="button button-quiet compact-button" onClick={onEdit}><Pencil size={14} /> Sửa</button>}</div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="detail-grid">
          <div className="detail-facts"><p className="eyebrow">THÔNG TIN SẢN PHẨM</p><dl>
            <div><dt>Mã sản phẩm</dt><dd>{asset.assetCode}</dd></div><div><dt>Thương hiệu</dt><dd>{asset.manufacturer}</dd></div><div><dt>Danh mục</dt><dd>{typeLabel(asset.type)}</dd></div><div><dt>Mô tả</dt><dd>{asset.processor || '—'}</dd></div><div><dt>Số lượng</dt><dd>{asset.memoryGb ?? 0} {asset.storage || 'sản phẩm'}</dd></div><div><dt>Ngày nhập</dt><dd>{formatDate(asset.purchaseDate)}</dd></div><div><dt>Hạn sử dụng</dt><dd>{formatDate(asset.warrantyUntil)}</dd></div><div><dt>Giá bán</dt><dd>{formatCurrency(asset.purchaseCost)}</dd></div><div><dt>Vị trí kệ</dt><dd>{asset.location}</dd></div><div><dt>Ghi chú</dt><dd>{asset.notes || '—'}</dd></div>
          </dl></div>
          <div className="detail-actions">
            {canManageAssignments && asset.status === 'AVAILABLE' && <form className="action-form" onSubmit={submitAssignment}><p className="eyebrow"><ArrowUpFromLine size={14} /> XUẤT HÀNG</p><label><span>Người nhận hàng</span><input value={assignee} onChange={event => setAssignee(event.target.value)} required maxLength={120} /></label><label><span>Vị trí lưu kho</span><input value={location} onChange={event => setLocation(event.target.value)} required maxLength={120} /></label><label><span>Ghi chú</span><input value={note} onChange={event => setNote(event.target.value)} maxLength={500} /></label><button className="button button-primary full-button" disabled={busy}><ArrowUpFromLine size={15} /> Xuất hàng</button></form>}
            {canManageAssignments && asset.status === 'ASSIGNED' && <div className="action-form"><p className="eyebrow"><ArrowDownToLine size={14} /> NHẬP LẠI KHO</p><p className="muted">Sản phẩm đã xuất cho <strong>{asset.assigneeName}</strong>.</p><label><span>Ghi chú nhập lại kho</span><input value={returnNote} onChange={event => setReturnNote(event.target.value)} maxLength={500} /></label><button className="button button-secondary full-button" disabled={busy} onClick={() => void runAction(() => api.returnAsset(asset.id, returnNote))}><ArrowDownToLine size={15} /> Xác nhận nhập lại kho</button></div>}
            {canRequestMaintenance && asset.status !== 'MAINTENANCE' && asset.status !== 'RETIRED' && asset.status !== 'SOLD' && <form className="action-form" onSubmit={submitMaintenance}><p className="eyebrow"><Wrench size={14} /> GỬI PHẢN HỒI XỬ LÝ HÀNG LỖI</p><label><span>Mô tả tình trạng hàng hóa</span><textarea rows={2} value={issue} onChange={event => setIssue(event.target.value)} required maxLength={1000} /></label><button className="button button-quiet full-button" disabled={busy}><Wrench size={15} /> Gửi phản hồi sản phẩm</button></form>}
            {asset.status === 'MAINTENANCE' && <div className="maintenance-callout"><CalendarClock size={17} /><span>Sản phẩm đang chờ kiểm tra.</span></div>}
            {canManage && asset.status !== 'RETIRED' && <button className="retire-button" onClick={retire}>Ngừng kinh doanh sản phẩm</button>}
          </div>
        </div>
        <div className="history-grid"><section><p className="eyebrow">LỊCH SỬ XUẤT HÀNG</p>{assignments.length === 0 ? <p className="empty-inline">Chưa có lịch sử xuất hàng.</p> : assignments.slice(0, 4).map(record => <div className="history-row" key={record.id}><span><strong>{record.assigneeName}</strong><small>{record.location}</small></span><span><strong>{formatDateTime(record.assignedAt)}</strong><small>{record.returnedAt ? `Đã nhập lại kho ${formatDateTime(record.returnedAt)}` : 'Đã xuất hàng'}</small></span></div>)}</section><section><p className="eyebrow">LỊCH SỬ XỬ LÝ HÀNG LỖI</p>{maintenance.length === 0 ? <p className="empty-inline">Chưa có phiếu kiểm tra sản phẩm.</p> : maintenance.slice(0, 4).map(record => <div className="history-row" key={record.id}><span><strong>{record.issue}</strong><small>{formatDateTime(record.openedAt)}</small></span><span className={`status-badge status-${record.status === 'OPEN' ? 'maintenance' : 'available'}`}>{record.status === 'OPEN' ? 'Đang xử lý' : 'Đã đóng'}</span></div>)}</section></div>
      </section>
    </div>
  )
}