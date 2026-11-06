import { Check, Eye, Pencil, Search, UserRound, X } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import type { CustomerAccount } from '../types'
import { Pagination, usePagination } from './Pagination'

interface CustomerAccountsAdminViewProps {
  accounts: CustomerAccount[]
  loading: boolean
  onUpdate: (id: number, input: {
    displayName: string
    email: string
    phone: string
    enabled: boolean
    password?: string
  }) => Promise<void>
}

export function CustomerAccountsAdminView({ accounts, loading, onUpdate }: CustomerAccountsAdminViewProps) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<CustomerAccount | null>(null)
  const [editing, setEditing] = useState<CustomerAccount | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const matching = useMemo(() => accounts.filter(account =>
    !search.trim() || `${account.username} ${account.displayName} ${account.email ?? ''} ${account.phone ?? ''}`
      .toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())), [accounts, search])
  const pagination = usePagination(matching, 10)
  const activeCount = accounts.filter(account => account.enabled).length
  const disabledCount = accounts.length - activeCount

  function edit(account: CustomerAccount) {
    setSelected(null)
    setEditing(account)
    setDisplayName(account.displayName)
    setEmail(account.email ?? '')
    setPhone(account.phone ?? '')
    setEnabled(account.enabled)
    setPassword('')
    setError('')
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    setBusy(true)
    setError('')
    try {
      await onUpdate(editing.id, {
        displayName: displayName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        enabled,
        ...(password ? { password } : {}),
      })
      setEditing(null)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Không thể cập nhật tài khoản khách')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className="customer-account-panel surface">
        <div className="customer-account-toolbar">
          <div className="customer-account-summary">
            <div className="customer-account-summary-heading"><span className="customer-account-summary-icon"><UserRound size={17} /></span><div><strong>Danh sách tài khoản khách</strong><span>Quản lý thông tin và quyền đăng nhập cửa hàng</span></div></div>
            <div className="customer-account-stats"><span><b>{accounts.length}</b> Tổng tài khoản</span><span><b>{activeCount}</b> Đang hoạt động</span><span><b>{disabledCount}</b> Đã khóa</span></div>
          </div>
          <label className="customer-account-search"><Search size={15} /><input aria-label="Tìm tài khoản khách" placeholder="Tìm tên, tài khoản, email hoặc số điện thoại..." value={search} onChange={event => { setSearch(event.target.value); pagination.setPage(0) }} /></label>
        </div>
        {loading ? <div className="table-message">Đang tải tài khoản khách...</div> : matching.length === 0 ? <div className="table-message">{accounts.length === 0 ? <div><strong>Chưa có tài khoản khách hàng đăng ký.</strong><p>15 hồ sơ khách mua tại quầy (nếu có) không phải tài khoản đăng nhập. Khách đăng ký tại <a href="/store/register" target="_blank" rel="noreferrer">trang đăng ký cửa hàng</a> sẽ xuất hiện ở đây; khi bổ sung số điện thoại, hồ sơ mua hàng sẽ được liên kết theo số điện thoại đó.</p></div> : 'Không có tài khoản phù hợp với từ khóa tìm kiếm.'}</div> : (
          <div className="table-wrap customer-table-scroll"><table className="data-table">
            <thead><tr><th>Tài khoản</th><th>Thông tin liên hệ</th><th>Trạng thái</th><th>Ngày đăng ký</th><th>Thao tác</th></tr></thead>
            <tbody>{pagination.pageItems.map(account => <tr key={account.id}>
              <td data-label="Tài khoản"><div className="customer-name-cell"><span className="customer-avatar-badge bronze"><UserRound size={16} /></span><div><strong>{account.displayName}</strong><div className="sub-text">@{account.username}</div></div></div></td>
              <td data-label="Thông tin liên hệ"><div>{account.email || 'Chưa có email'}</div><div className="sub-text">{account.phone || 'Chưa có số điện thoại'}</div></td>
              <td data-label="Trạng thái"><span className={`user-status ${account.enabled ? 'enabled' : 'disabled'}`}>{account.enabled ? 'Đang hoạt động' : 'Đã khóa'}</span></td>
              <td data-label="Ngày đăng ký">{new Date(account.createdAt).toLocaleDateString('vi-VN')}</td>
              <td data-label="Thao tác"><div className="customer-account-actions"><button className="button button-quiet compact-button" onClick={() => setSelected(account)}><Eye size={14} /> Chi tiết</button><button className="button button-secondary compact-button" onClick={() => edit(account)}><Pencil size={14} /> Quản lý</button></div></td>
            </tr>)}</tbody>
          </table></div>
        )}
      </section>
      {!loading && matching.length > 0 && <Pagination totalItems={matching.length} page={pagination.page} pageSize={10} onPageChange={pagination.setPage} />}
      {selected && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null) }}>
        <section className="user-dialog surface" role="dialog" aria-modal="true" aria-labelledby="customer-account-details-title">
          <header className="user-dialog-header"><div><p className="eyebrow">CHI TIẾT TÀI KHOẢN KHÁCH</p><h3 id="customer-account-details-title">{selected.displayName}</h3></div><button className="icon-button" aria-label="Đóng" onClick={() => setSelected(null)}><X size={18} /></button></header>
          <dl className="user-detail-list">
            <div><dt>Mã tài khoản</dt><dd>#{selected.id}</dd></div>
            <div><dt>Tên đăng nhập</dt><dd>@{selected.username}</dd></div>
            <div><dt>Họ và tên</dt><dd>{selected.displayName}</dd></div>
            <div><dt>Email</dt><dd>{selected.email || 'Chưa cung cấp'}</dd></div>
            <div><dt>Số điện thoại</dt><dd>{selected.phone || 'Chưa cung cấp'}</dd></div>
            <div><dt>Trạng thái</dt><dd><span className={`user-status ${selected.enabled ? 'enabled' : 'disabled'}`}>{selected.enabled ? 'Đang hoạt động' : 'Đã khóa'}</span></dd></div>
            <div><dt>Ngày đăng ký</dt><dd>{new Date(selected.createdAt).toLocaleString('vi-VN')}</dd></div>
          </dl>
          <p className="customer-account-password-note">Mật khẩu được mã hóa nên không thể xem lại.</p>
          <div className="form-actions"><button className="button button-quiet" onClick={() => setSelected(null)}>Đóng</button><button className="button button-primary" onClick={() => edit(selected)}><Pencil size={15} /> Quản lý tài khoản</button></div>
        </section>
      </div>}
      {editing && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !busy) setEditing(null) }}>
        <form className="user-dialog surface" role="dialog" aria-modal="true" aria-labelledby="customer-account-edit-title" onSubmit={event => void save(event)}>
          <header className="user-dialog-header"><div><p className="eyebrow">QUẢN LÝ TÀI KHOẢN KHÁCH</p><h3 id="customer-account-edit-title">@{editing.username}</h3></div><button type="button" className="icon-button" aria-label="Đóng" onClick={() => setEditing(null)}><X size={18} /></button></header>
          <div className="user-edit-fields">
            <label><span>Tên tài khoản</span><input value={editing.username} disabled /></label>
            <label><span>Họ và tên</span><input required maxLength={120} value={displayName} onChange={event => setDisplayName(event.target.value)} /></label>
            <label><span>Email</span><input type="email" maxLength={120} value={email} onChange={event => setEmail(event.target.value)} /></label>
            <label><span>Số điện thoại</span><input type="tel" maxLength={20} value={phone} onChange={event => setPhone(event.target.value)} /></label>
            <label><span>Trạng thái đăng nhập</span><select value={enabled ? 'enabled' : 'disabled'} onChange={event => setEnabled(event.target.value === 'enabled')}><option value="enabled">Đang hoạt động</option><option value="disabled">Đã khóa</option></select></label>
            <label><span>Đặt lại mật khẩu <small>(để trống nếu không đổi)</small></span><input type="password" minLength={8} maxLength={72} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} /></label>
          </div>
          <p className="muted">Mật khẩu được lưu dạng mã hóa, không thể xem lại mật khẩu cũ. Khóa tài khoản sẽ từ chối token hiện tại của tài khoản.</p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-actions"><button type="button" className="button button-quiet" onClick={() => setEditing(null)}>Hủy</button><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu thay đổi'} <Check size={15} /></button></div>
        </form>
      </div>}
    </>
  )
}
