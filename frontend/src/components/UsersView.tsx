import { Eye, Pencil, Plus, ShieldCheck, Trash2, UserRound, Users, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { AppUser, CustomerAccount, Role } from '../types'
import { Pagination, usePagination } from './Pagination'
import { TrashView } from './TrashView'
import { ManagementViewToggle } from './ManagementViewToggle'
import type { TrashRecord } from '../types'
import { CustomerAccountsAdminView } from './CustomerAccountsAdminView'

interface UsersViewProps {
  users: AppUser[]
  customerAccounts: CustomerAccount[]
  customerAccountsLoading: boolean
  loading: boolean
  onCreate: (user: { username: string; displayName: string; password: string; role: Role }) => Promise<void>
  onUpdate: (id: number, user: { displayName: string; role: Role; enabled: boolean; password?: string }) => Promise<void>
  onDelete?: (id: number) => Promise<void>
  onUpdateCustomerAccount: (id: number, input: {
    displayName: string; email: string; phone: string; enabled: boolean; password?: string
  }) => Promise<void>
  trashItems?: TrashRecord[]
  trashLoading?: boolean
  onRestoreTrashItem?: (id: number) => Promise<void>
  onDeleteTrashItem?: (id: number) => Promise<void>
}

const roleLabels: Record<Role, string> = {
  ADMIN: 'Quản trị viên',
  STAFF: 'Nhân viên',
  CASHIER: 'Thu ngân',
  FIXER: 'Nhân viên kiểm tra hàng hóa',
}

export function UsersView({ users, customerAccounts, customerAccountsLoading, loading, onCreate, onUpdate, onDelete, onUpdateCustomerAccount, trashItems = [], trashLoading = false, onRestoreTrashItem, onDeleteTrashItem }: UsersViewProps) {
  const pagination = usePagination(users)
  const [showForm, setShowForm] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('STAFF')
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editRole, setEditRole] = useState<Role>('STAFF')
  const [editEnabled, setEditEnabled] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showTrash, setShowTrash] = useState(false)
  const [showCustomerAccounts, setShowCustomerAccounts] = useState(false)
  const trashedUsers = trashItems.filter(item => item.type === 'USER')

  async function deleteUser(user: AppUser) {
    if (!onDelete || !window.confirm(`Chuyển tài khoản ${user.username} vào thùng rác?`)) return
    setDeletingId(user.id)
    setError('')
    try {
      await onDelete(user.id)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Không thể chuyển tài khoản vào thùng rác')
    } finally {
      setDeletingId(null)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onCreate({ username, displayName, password, role })
      setUsername('')
      setDisplayName('')
      setPassword('')
      setShowForm(false)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Không thể tạo tài khoản')
    } finally {
      setBusy(false)
    }
  }

  function openEdit(user: AppUser) {
    setSelectedUser(null)
    setEditingUser(user)
    setEditDisplayName(user.displayName)
    setEditRole(user.role)
    setEditEnabled(user.enabled)
    setNewPassword('')
    setError('')
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingUser) return

    setBusy(true)
    setError('')
    try {
      await onUpdate(editingUser.id, {
        displayName: editDisplayName,
        role: editRole,
        enabled: editEnabled,
        ...(newPassword ? { password: newPassword } : {}),
      })
      setEditingUser(null)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Không thể cập nhật tài khoản')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="page-heading-row"><div><p className="eyebrow">PHÂN QUYỀN TRUY CẬP</p><h2>{showCustomerAccounts ? 'Tài khoản khách hàng' : 'Tài khoản nội bộ'}</h2><p className="muted">{showCustomerAccounts ? 'Quản lý tài khoản đăng nhập cửa hàng, thông tin liên hệ và quyền truy cập.' : 'Xem thông tin, cập nhật vai trò và trạng thái hoạt động của nhân viên.'}</p></div><div className="user-heading-actions">{!showCustomerAccounts && onRestoreTrashItem && onDeleteTrashItem && <ManagementViewToggle archived={showTrash} activeCount={users.length} archivedCount={trashedUsers.length} onChange={setShowTrash} />}{!showCustomerAccounts && !showTrash && <button className="button button-primary" onClick={() => { setShowForm(value => !value); setError('') }}><Plus size={17} /> Tạo tài khoản</button>}</div></section>
      <div className="account-management-tabs"><button className={!showCustomerAccounts ? 'active' : ''} onClick={() => { setShowCustomerAccounts(false); setShowTrash(false) }}><ShieldCheck size={15} /> Nhân viên</button><button className={showCustomerAccounts ? 'active' : ''} onClick={() => { setShowCustomerAccounts(true); setShowTrash(false) }}><Users size={15} /> Khách hàng ({customerAccounts.length})</button></div>
      {showCustomerAccounts ? <CustomerAccountsAdminView accounts={customerAccounts} loading={customerAccountsLoading} onUpdate={onUpdateCustomerAccount} /> : showTrash && onRestoreTrashItem && onDeleteTrashItem ? <TrashView items={trashedUsers} loading={trashLoading} types={['USER']} onRestore={onRestoreTrashItem} onDeleteForever={onDeleteTrashItem} /> : <>
      {showForm && <form className="surface user-create-form" onSubmit={submit}><div className="form-grid"><label><span>Tên đăng nhập <b>*</b></span><input autoComplete="off" value={username} onChange={event => setUsername(event.target.value)} required maxLength={80} /></label><label><span>Họ và tên <b>*</b></span><input value={displayName} onChange={event => setDisplayName(event.target.value)} required maxLength={120} /></label><label><span>Mật khẩu tạm thời <b>*</b></span><input type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} required maxLength={72} /></label><label><span>Vai trò</span><select value={role} onChange={event => setRole(event.target.value as Role)}><option value="STAFF">Nhân viên</option><option value="CASHIER">Thu ngân</option><option value="FIXER">Nhân viên kiểm tra hàng hóa</option><option value="ADMIN">Quản trị viên</option></select></label></div><small className="muted">Không thể xem mật khẩu sau khi tạo; Admin có thể đặt lại khi cần.</small>{error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><button type="button" className="button button-quiet" onClick={() => setShowForm(false)}>Hủy</button><button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Đang tạo...' : 'Tạo tài khoản'}</button></div></form>}
      {error && !showForm && !editingUser && <p className="form-error" role="alert">{error}</p>}
      <section className="surface users-surface"><div className="users-summary"><span className="summary-icon"><Users size={18} /></span><span><strong>{users.length} thành viên</strong><small>Quyền truy cập hệ thống</small></span></div>
        {loading && <div className="table-message">Đang tải tài khoản...</div>}
        {!loading && pagination.pageItems.length === 0 && <div className="table-message">Chưa có tài khoản nào.</div>}
        {!loading && pagination.pageItems.map(user => (
          <article className="user-row" key={user.id}>
            <span className={`user-avatar ${user.role.toLowerCase()}`}>{user.role === 'ADMIN' ? <ShieldCheck size={17} /> : <UserRound size={17} />}</span>
            <span className="user-name"><strong>{user.displayName}</strong><small>@{user.username}</small></span>
            <span className={`role-chip role-${user.role.toLowerCase()}`}>{roleLabels[user.role]}</span>
            <span className={`user-status ${user.enabled ? 'enabled' : 'disabled'}`}>{user.enabled ? 'Đang hoạt động' : 'Đã khóa'}</span>
            <div className="user-actions">
              <button className="button button-quiet compact-button" onClick={() => setSelectedUser(user)}><Eye size={14} /> Thông tin</button>
              {onDelete && <button className="icon-button trash-row-action" title="Chuyển vào thùng rác" aria-label={`Chuyển ${user.username} vào thùng rác`} disabled={deletingId === user.id} onClick={() => void deleteUser(user)}><Trash2 size={15} /></button>}
            </div>
          </article>
        ))}
        {!loading && <Pagination totalItems={users.length} page={pagination.page} pageSize={10} onPageChange={pagination.setPage} />}
      </section>

      {selectedUser && (
        <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedUser(null) }}>
          <section className="user-dialog surface" role="dialog" aria-modal="true" aria-labelledby="user-details-title">
            <header className="user-dialog-header">
              <div><p className="eyebrow">THÔNG TIN TÀI KHOẢN</p><h3 id="user-details-title">{selectedUser.displayName}</h3></div>
              <button className="icon-button" aria-label="Đóng" onClick={() => setSelectedUser(null)}><X size={18} /></button>
            </header>
            <dl className="user-detail-list">
              <div><dt>Mã tài khoản</dt><dd>#{selectedUser.id}</dd></div>
              <div><dt>Tên đăng nhập</dt><dd>@{selectedUser.username}</dd></div>
              <div><dt>Họ và tên</dt><dd>{selectedUser.displayName}</dd></div>
              <div><dt>Vai trò</dt><dd>{roleLabels[selectedUser.role]}</dd></div>
              <div><dt>Trạng thái</dt><dd><span className={`user-status ${selectedUser.enabled ? 'enabled' : 'disabled'}`}>{selectedUser.enabled ? 'Đang hoạt động' : 'Đã khóa'}</span></dd></div>
            </dl>
            <div className="form-actions">
              <button className="button button-quiet" onClick={() => setSelectedUser(null)}>Đóng</button>
              <button className="button button-primary" onClick={() => openEdit(selectedUser)}><Pencil size={15} /> Chỉnh sửa</button>
            </div>
          </section>
        </div>
      )}

      {editingUser && (
        <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !busy) setEditingUser(null) }}>
          <form className="user-dialog surface" onSubmit={submitEdit} aria-labelledby="user-edit-title">
            <header className="user-dialog-header">
              <div><p className="eyebrow">CẬP NHẬT TÀI KHOẢN</p><h3 id="user-edit-title">{editingUser.username}</h3></div>
              <button type="button" className="icon-button" aria-label="Đóng" onClick={() => setEditingUser(null)}><X size={18} /></button>
            </header>
            <div className="user-edit-fields">
              <label><span>Tên đăng nhập</span><input value={editingUser.username} disabled /></label>
              <label><span>Họ và tên <b>*</b></span><input value={editDisplayName} onChange={event => setEditDisplayName(event.target.value)} required maxLength={120} /></label>
              <label><span>Vai trò</span><select value={editRole} onChange={event => setEditRole(event.target.value as Role)}><option value="STAFF">Nhân viên</option><option value="CASHIER">Thu ngân</option><option value="FIXER">Nhân viên kiểm tra hàng hóa</option><option value="ADMIN">Quản trị viên</option></select></label>
              <label><span>Trạng thái tài khoản</span><select value={editEnabled ? 'enabled' : 'disabled'} onChange={event => setEditEnabled(event.target.value === 'enabled')}><option value="enabled">Đang hoạt động</option><option value="disabled">Đã khóa</option></select></label>
              <label><span>Đặt lại mật khẩu <small>(để trống nếu không đổi)</small></span><input type="password" autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} maxLength={72} /></label>
              <small className="muted">Mật khẩu hiện tại được mã hóa nên không thể xem lại. Để trống nếu không muốn đặt lại.</small>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="form-actions">
              <button type="button" className="button button-quiet" disabled={busy} onClick={() => setEditingUser(null)}>Hủy</button>
              <button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
            </div>
          </form>
        </div>
      )}
      </>}
    </div>
  )
}