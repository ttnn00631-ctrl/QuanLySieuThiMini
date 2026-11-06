import { useState, useMemo } from 'react'
import {
  UserPlus, Search, Phone, Mail, MapPin, Edit3,
  ShoppingCart, Trash2, X
} from 'lucide-react'
import type { Customer, CustomerInput, MembershipTier } from '../types'
import { formatCurrency } from '../utils'
import { Pagination, usePagination } from './Pagination'
import { TrashView } from './TrashView'
import type { TrashRecord } from '../types'
import { ManagementViewToggle } from './ManagementViewToggle'

interface CustomersViewProps {
  customers: Customer[]
  loading: boolean
  onAddCustomer: (input: CustomerInput) => Promise<void>
  onUpdateCustomer: (id: number, input: CustomerInput) => Promise<void>
  onDeleteCustomer: (id: number) => Promise<void>
  onSelectForCheckout: (customer: Customer) => void
  trashItems: TrashRecord[]
  trashLoading: boolean
  onRestoreTrashItem: (id: number) => Promise<void>
  onDeleteTrashItem: (id: number) => Promise<void>
}

export function CustomersView({
  customers,
  loading,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onSelectForCheckout,
  trashItems,
  trashLoading,
  onRestoreTrashItem,
  onDeleteTrashItem
}: CustomersViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTier, setSelectedTier] = useState<string>('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [showTrash, setShowTrash] = useState(false)

  // Form thêm khách hàng
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [tier, setTier] = useState<MembershipTier>('BRONZE')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Thống kê theo hạng
  const stats = useMemo(() => {
    const total = customers.length
    const gold = customers.filter(c => c.membershipTier === 'GOLD').length
    const silver = customers.filter(c => c.membershipTier === 'SILVER').length
    const bronze = customers.filter(c => c.membershipTier === 'BRONZE').length
    return { total, gold, silver, bronze }
  }, [customers])

  // Lọc danh sách
  const filtered = useMemo(() => {
    return customers.filter(c => {
      const matchTier = selectedTier === 'ALL' || c.membershipTier === selectedTier
      const matchSearch = !searchTerm.trim() ||
        c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm.trim()) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
      return matchTier && matchSearch
    })
  }, [customers, selectedTier, searchTerm])
  const pagination = usePagination(filtered)

  if (showTrash) {
    return <div className="page-stack customers-view-container">
      <section className="page-heading-row">
        <div><p className="eyebrow">QUẢN LÝ KHÁCH HÀNG</p><h2>Thùng rác khách hàng</h2><p className="muted">Khôi phục hồ sơ hoặc xóa vĩnh viễn khách hàng.</p></div>
      </section>
      <ManagementViewToggle archived activeCount={customers.length} archivedCount={trashItems.length} onChange={setShowTrash} />
      <TrashView items={trashItems} loading={trashLoading} types={['CUSTOMER']} onRestore={onRestoreTrashItem} onDeleteForever={onDeleteTrashItem} />
    </div>
  }

  function openCreateModal() {
    setEditingCustomer(null)
    setFullName('')
    setPhone('')
    setEmail('')
    setAddress('')
    setTier('BRONZE')
    setErrorMsg('')
    setModalOpen(true)
  }

  function openEditModal(customer: Customer) {
    setEditingCustomer(customer)
    setFullName(customer.fullName)
    setPhone(customer.phone)
    setEmail(customer.email || '')
    setAddress(customer.address || '')
    setTier(customer.membershipTier)
    setErrorMsg('')
    setModalOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !phone.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ họ tên và số điện thoại!')
      return
    }
    setSaving(true)
    setErrorMsg('')
    try {
      const input: CustomerInput = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        membershipTier: tier
      }
      if (editingCustomer) await onUpdateCustomer(editingCustomer.id, input)
      else await onAddCustomer(input)
      setModalOpen(false)
      setEditingCustomer(null)
      setFullName('')
      setPhone('')
      setEmail('')
      setAddress('')
      setTier('BRONZE')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Có lỗi khi lưu khách hàng')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack customers-view-container">
      <section className="page-heading-row">
        <div>
          <p className="eyebrow">HỒ SƠ KHÁCH HÀNG</p>
          <h2>Quản lý khách hàng</h2>
          <p className="muted">Theo dõi thông tin, hạng thành viên và lịch sử mua sắm của khách hàng.</p>
        </div>
        <div className="asset-heading-actions">
          <button className="button button-primary" onClick={openCreateModal}><UserPlus size={17} /> Thêm khách hàng</button>
        </div>
      </section>
      <ManagementViewToggle archived={false} activeCount={customers.length} archivedCount={trashItems.length} onChange={setShowTrash} />
      <section className="surface inventory-surface customer-inventory-surface">
        <div className="table-toolbar">
          <label className="search-field"><Search size={17} /><input aria-label="Tìm khách hàng" placeholder="Tên khách hàng, số điện thoại, email..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); pagination.setPage(0) }} /><kbd>/</kbd></label>
          <div className="toolbar-right">
            <span className="result-count">{filtered.length} khách hàng</span>
            <select aria-label="Lọc hạng thành viên" value={selectedTier} onChange={e => { setSelectedTier(e.target.value); pagination.setPage(0) }}>
              <option value="ALL">Tất cả hạng ({stats.total})</option>
              <option value="GOLD">Hạng Vàng ({stats.gold})</option>
              <option value="SILVER">Hạng Bạc ({stats.silver})</option>
              <option value="BRONZE">Hạng Đồng ({stats.bronze})</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table className="asset-table customer-inventory-table">
            <thead>
              <tr>
                <th>KHÁCH HÀNG</th>
                <th>LIÊN HỆ</th>
                <th>ĐỊA CHỈ</th>
                <th>HẠNG THÀNH VIÊN</th>
                <th>TỔNG CHI TIÊU</th>
                <th>SỐ ĐƠN</th>
                <th><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7}><div className="table-message">Đang tải danh sách khách hàng...</div></td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={7}><div className="table-message">Không tìm thấy khách hàng nào.</div></td></tr>}
              {!loading && pagination.pageItems.map(c => {
                const tierClass = c.membershipTier.toLowerCase()
                const tierLabel = c.membershipTier === 'GOLD' ? '🥇 VÀNG (-10%)' : c.membershipTier === 'SILVER' ? '🥈 BẠC (-5%)' : '🥉 ĐỒNG (-2%)'

                return (
                  <tr key={c.id}>
                    <td data-label="Khách hàng">
                      <div className="customer-name-cell">
                        <span className={`customer-avatar-badge ${tierClass}`}>
                          {c.fullName.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <strong className="cell-primary">{c.fullName}</strong>
                          <small className="cell-secondary">Mã KH: #{c.id}</small>
                        </div>
                      </div>
                    </td>

                    <td data-label="Liên hệ">
                      <div className="customer-contact-col">
                        <span className="contact-item"><Phone size={13} /> {c.phone}</span>
                        {c.email && <span className="contact-item"><Mail size={13} /> {c.email}</span>}
                      </div>
                    </td>

                    <td data-label="Địa chỉ">
                      <span className="address-text" title={c.address || ''}>
                        {c.address ? <><MapPin size={13} /> {c.address}</> : '—'}
                      </span>
                    </td>

                    <td data-label="Hạng thành viên">
                      <span className={`membership-badge ${tierClass}`}>
                        {tierLabel}
                      </span>
                    </td>

                    <td data-label="Tổng chi tiêu">
                      <span className="cell-primary">{formatCurrency(c.totalSpent)}</span>
                    </td>

                    <td data-label="Số đơn">
                      <span className="cell-primary">{c.ordersCount || 0}</span>
                    </td>

                    <td data-label="Thao tác">
                      <div className="asset-row-actions">
                        <button
                          className="button button-secondary compact-button"
                          title="Tạo đơn hàng thanh toán cho khách này"
                          onClick={() => onSelectForCheckout(c)}
                        >
                          <ShoppingCart size={14} /> Mua
                        </button>
                        <button
                          className="icon-button row-action"
                          title="Chỉnh sửa hồ sơ khách hàng"
                          aria-label={`Chỉnh sửa ${c.fullName}`}
                          onClick={() => openEditModal(c)}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="icon-button row-action trash-row-action"
                          title="Xóa khách hàng"
                          aria-label={`Xóa khách hàng ${c.fullName}`}
                          onClick={() => {
                            if (window.confirm(`Bạn có chắc chắn muốn xóa khách hàng "${c.fullName}"?`)) {
                              onDeleteCustomer(c.id)
                            }
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && <Pagination className="table-footer" totalItems={filtered.length} page={pagination.page} pageSize={10} onPageChange={pagination.setPage} />}
      </section>

      {/* Modal tạo hoặc chỉnh sửa hồ sơ khách hàng */}
      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !saving) { setModalOpen(false); setEditingCustomer(null) } }}>
          <form className="user-dialog surface" onSubmit={handleSave} aria-labelledby="customer-edit-title">
            <header className="user-dialog-header">
              <div>
                <p className="eyebrow">{editingCustomer ? 'CẬP NHẬT HỒ SƠ KHÁCH HÀNG' : 'TẠO HỒ SƠ KHÁCH HÀNG'}</p>
                <h3 id="customer-edit-title">{editingCustomer ? editingCustomer.fullName : 'Khách hàng mới'}</h3>
              </div>
              <button type="button" className="icon-button" aria-label="Đóng" disabled={saving} onClick={() => { setModalOpen(false); setEditingCustomer(null) }}><X size={18} /></button>
            </header>
            <div className="user-edit-fields">
              <label><span>Họ và tên <b>*</b></span><input required maxLength={120} placeholder="Ví dụ: Hoàng Minh Đức" value={fullName} onChange={e => setFullName(e.target.value)} /></label>
              <label><span>Số điện thoại <b>*</b></span><input required type="tel" maxLength={20} placeholder="Ví dụ: 0912345678" value={phone} onChange={e => setPhone(e.target.value)} /></label>
              <label><span>Email liên hệ</span><input type="email" maxLength={120} placeholder="khachhang@gmail.com" value={email} onChange={e => setEmail(e.target.value)} /></label>
              <label><span>Hạng thành viên</span><select value={tier} onChange={e => setTier(e.target.value as MembershipTier)}><option value="BRONZE">🥉 Hạng ĐỒNG (Giảm 2%)</option><option value="SILVER">🥈 Hạng BẠC (Giảm 5%)</option><option value="GOLD">🥇 Hạng VÀNG (Giảm 10%)</option></select></label>
              <label><span>Địa chỉ</span><input maxLength={255} placeholder="Ví dụ: Cầu Giấy, Hà Nội" value={address} onChange={e => setAddress(e.target.value)} /></label>
            </div>
            {errorMsg && <p className="form-error" role="alert">{errorMsg}</p>}
            <div className="form-actions">
              <button type="button" className="button button-quiet" disabled={saving} onClick={() => { setModalOpen(false); setEditingCustomer(null) }}>Hủy</button>
              <button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
