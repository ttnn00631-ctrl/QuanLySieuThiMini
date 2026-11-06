import {
  Boxes, CreditCard, LayoutDashboard, LogOut, Package,
  RefreshCw, Search, ShieldCheck, Store, Users, Wrench, Star
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, setApiToken } from './api'
import { AssetDetailPanel } from './components/AssetDetailPanel'
import { AssetFormModal } from './components/AssetFormModal'
import { AssetsView } from './components/AssetsView'
import { BrandCatalogView } from './components/BrandCatalogView'
import { CheckoutView } from './components/CheckoutView'
import { CustomersView } from './components/CustomersView'
import { DashboardView } from './components/DashboardView'
import { LoginView } from './components/LoginView'
import { MaintenanceView } from './components/MaintenanceView'
import { ReviewsView } from './components/ReviewsView'
import { StorefrontView } from './components/StorefrontView'
import { UsersView } from './components/UsersView'
import { CustomerAccountsAdminView } from './components/CustomerAccountsAdminView'
import type {
  AppUser, Asset, AssetInput, AssetPage, Customer, CustomerAccount, CustomerInput,
  CustomerRepairRequestItem, DashboardSummary, MaintenanceItem, ProductBrand, ProductReview, Role, Session, TrashRecord
} from './types'

type Section = 'overview' | 'checkout' | 'catalog' | 'warehouse' | 'customers' | 'reviews' | 'maintenance' | 'users' | 'customerAccounts'

function readSession(): Session | null {
  try {
    const saved = localStorage.getItem('asset-manager-session')
    return saved ? JSON.parse(saved) as Session : null
  } catch {
    return null
  }
}

const pageTitles: Record<Section, string> = {
  overview: 'Tổng quan hệ thống',
  checkout: 'Điểm bán hàng & Thanh toán (POS)',
  catalog: 'Danh mục sản phẩm',
  warehouse: 'Quản lý kho hàng hóa',
  customers: 'Quản lý khách hàng',
  reviews: 'Bình luận & Đánh giá (Admin)',
  maintenance: 'Theo dõi hàng hóa',
  users: 'Quản lý người dùng hệ thống',
  customerAccounts: 'Danh sách tài khoản khách hàng',
}

function AdminApp() {
  const [session, setSession] = useState<Session | null>(readSession)
  const [section, setSection] = useState<Section>(() => {
    const saved = readSession()
    if (saved?.role === 'CASHIER') return 'checkout'
    if (saved?.role === 'FIXER') return 'maintenance'
    return 'overview'
  })

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [recentAssets, setRecentAssets] = useState<Asset[]>([])
  const [assetPage, setAssetPage] = useState<AssetPage | null>(null)
  const [allAssets, setAllAssets] = useState<Asset[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([])
  const [customerRepairRequests, setCustomerRepairRequests] = useState<CustomerRepairRequestItem[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [customerAccounts, setCustomerAccounts] = useState<CustomerAccount[]>([])
  const [customerAccountsLoading, setCustomerAccountsLoading] = useState(false)
  const [productBrands, setProductBrands] = useState<ProductBrand[]>([])
  const [trash, setTrash] = useState<TrashRecord[]>([])
  const [trashLoading, setTrashLoading] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [page, setPage] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formAsset, setFormAsset] = useState<Asset | null>(null)

  // Sản phẩm chọn nhanh từ Danh mục để đưa sang Thanh toán
  const [checkoutInitialAsset, setCheckoutInitialAsset] = useState<Asset | null>(null)
  const [checkoutInitialCustomer, setCheckoutInitialCustomer] = useState<Customer | null>(null)

  useEffect(() => setApiToken(session?.token ?? null), [session])

  // Tải danh sách toàn bộ sản phẩm (cho Catalog & Checkout)
  useEffect(() => {
    if (!session || (session.role !== 'ADMIN' && session.role !== 'CASHIER')) return
    api.allAssets()
      .then(setAllAssets)
      .catch(exception => setError(exception instanceof Error ? exception.message : 'Không tải được danh mục sản phẩm'))
  }, [session, refreshKey])

  useEffect(() => {
    if (!session || session.role !== 'ADMIN' || section !== 'catalog') return
    api.productBrands()
      .then(setProductBrands)
      .catch(exception => setError(exception instanceof Error ? exception.message : 'Không tải được danh mục hãng'))
  }, [session, section, refreshKey])

  // Tải danh sách khách hàng
  useEffect(() => {
    if (!session || (session.role !== 'ADMIN' && session.role !== 'CASHIER')) return
    api.customers()
      .then(res => setCustomers(res))
      .catch(exception => setError(exception instanceof Error ? exception.message : 'Không tải được danh sách khách hàng'))
  }, [session, refreshKey])

  // Tải danh sách đánh giá
  useEffect(() => {
    if (!session || session.role !== 'ADMIN') return
    api.reviews()
      .then(res => setReviews(res))
      .catch(exception => setError(exception instanceof Error ? exception.message : 'Không tải được danh sách đánh giá'))
  }, [session, refreshKey])

  // Overview data
  useEffect(() => {
    if (!session || session.role !== 'ADMIN' || section !== 'overview') return
    setLoading(true)
    Promise.all([api.dashboard(), api.assets('', '', 0, 5)])
      .then(([dashboard, recent]) => {
        setSummary(dashboard)
        setRecentAssets(recent.content)
        setError('')
      })
      .catch(exception => setError(exception instanceof Error ? exception.message : 'Không tải được dữ liệu tổng quan'))
      .finally(() => setLoading(false))
  }, [session, section, refreshKey])

  useEffect(() => {
    if (!session || session.role !== 'ADMIN'
        || !['warehouse', 'customers', 'users', 'checkout', 'catalog'].includes(section)) return
    setTrashLoading(true)
    api.trash()
      .then(setTrash)
      .catch(exception => setError(exception instanceof Error ? exception.message : 'Không tải được thùng rác'))
      .finally(() => setTrashLoading(false))
  }, [session, section, refreshKey])

  // Warehouse (Assets) data
  useEffect(() => {
    if (!session || section !== 'warehouse') return
    setLoading(true)
    api.assets(search, status, page, 10, manufacturer)
      .then(result => { setAssetPage(result); setError('') })
      .catch(exception => setError(exception instanceof Error ? exception.message : 'Không tải được danh sách kho'))
      .finally(() => setLoading(false))
  }, [session, section, search, status, manufacturer, page, refreshKey])

  // Maintenance data
  useEffect(() => {
    if (!session || section !== 'maintenance') return
    setLoading(true)
    Promise.all([
      api.maintenance(),
      session.role === 'ADMIN' || session.role === 'FIXER' ? api.customerRepairRequests() : Promise.resolve([]),
    ])
      .then(([result, customerRequests]) => {
        setMaintenance(result)
        setCustomerRepairRequests(customerRequests)
        setError('')
      })
      .catch(exception => setError(exception instanceof Error ? exception.message : 'Không tải được hàng đợi kiểm tra sản phẩm'))
      .finally(() => setLoading(false))
  }, [session, section, refreshKey])

  // Users data
  useEffect(() => {
    if (!session || section !== 'users' || session.role !== 'ADMIN') return
    setLoading(true)
    api.users()
      .then(setUsers)
      .catch(exception => setError(exception instanceof Error ? exception.message : 'Không tải được tài khoản nhân viên'))
      .finally(() => setLoading(false))
  }, [session, section, refreshKey])

  // Tải tài khoản khách riêng: lỗi ở tài khoản nhân viên không làm mất danh sách khách.
  useEffect(() => {
    if (!session || session.role !== 'ADMIN' || !['users', 'customerAccounts'].includes(section)) return
    setCustomerAccountsLoading(true)
    api.storeAccounts()
      .then(setCustomerAccounts)
      .catch(exception => setError(exception instanceof Error ? exception.message : 'Không tải được tài khoản khách hàng'))
      .finally(() => setCustomerAccountsLoading(false))
  }, [session, section, refreshKey])

  async function login(username: string, password: string) {
    const nextSession = await api.login(username, password)
    localStorage.setItem('asset-manager-session', JSON.stringify(nextSession))
    setSession(nextSession)
    if (nextSession.role === 'CASHIER') {
      setSection('checkout')
    } else if (nextSession.role === 'FIXER') {
      setSection('maintenance')
    } else {
      setSection('overview')
    }
    return nextSession
  }

  function logout() {
    localStorage.removeItem('asset-manager-session')
    setApiToken(null)
    setSession(null)
    setSummary(null)
    setAssetPage(null)
    setSelectedAsset(null)
    setFormAsset(null)
    setFormOpen(false)
    setAllAssets([])
    setCustomers([])
    setReviews([])
    setMaintenance([])
    setCustomerRepairRequests([])
    setUsers([])
    setCustomerAccounts([])
  }

  function refresh() {
    setRefreshKey(value => value + 1)
  }

  async function updateCustomerAccount(id: number, input: {
    displayName: string
    email: string
    phone: string
    enabled: boolean
    password?: string
  }) {
    await api.updateStoreAccountAsAdmin(id, input)
    refresh()
  }

  function openCreate() {
    setFormAsset(null)
    setFormOpen(true)
  }

  async function saveAsset(input: AssetInput) {
    if (formAsset) await api.updateAsset(formAsset.id, input)
    else await api.createAsset(input)
    refresh()
  }

  async function createUser(input: { username: string; displayName: string; password: string; role: Role }) {
    await api.createUser(input)
    refresh()
  }

  async function updateUser(id: number, input: { displayName: string; role: Role; enabled: boolean; password?: string }) {
    await api.updateUser(id, input)
    refresh()
  }

  async function deleteUser(id: number) {
    await api.deleteUser(id)
    refresh()
  }

  async function moveItemToTrash(type: TrashRecord['type'], id: number) {
    try {
      await api.moveToTrash(type, id)
      refresh()
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Không thể chuyển dữ liệu vào thùng rác')
      throw exception
    }
  }

  async function restoreTrashItem(id: number) {
    await api.restoreTrashItem(id)
    refresh()
  }

  async function deleteTrashItem(id: number) {
    await api.deleteTrashItem(id)
    refresh()
  }

  async function moveOrderToTrash(id: number) {
    await api.moveOrderToTrash(id)
    refresh()
  }

  async function handleAddCustomer(input: CustomerInput) {
    await api.createCustomer(input)
    refresh()
  }

  async function handleUpdateCustomer(id: number, input: CustomerInput) {
    await api.updateCustomer(id, input)
    refresh()
  }

  async function handleDeleteCustomer(id: number) {
    await api.deleteCustomer(id)
    refresh()
  }

  async function closeMaintenance(id: number, note: string) {
    await api.closeMaintenance(id, note)
    refresh()
  }

  async function closeCustomerRepairRequest(id: number, note: string) {
    await api.closeCustomerRepairRequest(id, note)
    refresh()
  }

  // Chọn mua từ danh mục sản phẩm -> chuyển thẳng sang trang Thanh toán
  function handleSelectFromCatalog(asset: Asset) {
    setCheckoutInitialAsset(asset)
    setSection('checkout')
  }

  if (!session) return <LoginView onLogin={login} />

  // Menu điều hướng phân theo quyền
  const isCashier = session.role === 'CASHIER'
  const isFixer = session.role === 'FIXER'
  const isAdmin = session.role === 'ADMIN'
  // Cashier có thể xem kho để gửi phiếu kiểm tra sản phẩm
  const canViewWarehouse = isAdmin || isCashier
  // FIXER + ADMIN + CASHIER có thể xem kiểm tra sản phẩm
  const canViewMaintenance = isAdmin || isFixer || isCashier

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <span className="brand-mark"><Package size={20} /></span>
          <span><strong>SIÊU THỊ MINI ĂN VẶT & ĐỒ CHƠI</strong><small>QUẢN LÝ & BÁN HÀNG</small></span>
          <span className="brand-version">01</span>
        </div>

        <p className="nav-label">
          {isCashier ? 'ĐIỂM BÁN HÀNG & KHO' : isFixer ? 'XỬ LÝ HÀNG LỖI THIẾT BỊ' : 'BÁN HÀNG & KHO HÀNG'}
        </p>
        <nav className="main-nav" aria-label="Điều hướng chính">
          {/* Tổng quan: chỉ ADMIN */}
          {isAdmin && (
            <button
              className={`nav-item ${section === 'overview' ? 'active' : ''}`}
              onClick={() => { setSection('overview'); setError('') }}
            >
              <LayoutDashboard size={17} />
              <span>Tổng quan</span>
            </button>
          )}

          {/* Thanh toán: ADMIN + CASHIER */}
          {(isAdmin || isCashier) && (
            <button
              className={`nav-item ${section === 'checkout' ? 'active' : ''}`}
              onClick={() => { setSection('checkout'); setError('') }}
            >
              <CreditCard size={17} />
              <span>Thanh toán (POS)</span>
            </button>
          )}

          {/* Danh mục: chỉ ADMIN */}
          {isAdmin && (
            <button
              className={`nav-item ${section === 'catalog' ? 'active' : ''}`}
              onClick={() => { setSection('catalog'); setError('') }}
            >
              <Package size={17} />
              <span>Danh mục sản phẩm</span>
              {allAssets.length > 0 && <span className="nav-count">{allAssets.length}</span>}
            </button>
          )}

          {/* Kho hàng hóa: ADMIN + CASHIER (cashier vào kho để gửi phiếu kiểm tra sản phẩm) */}
          {canViewWarehouse && (
            <button
              className={`nav-item ${section === 'warehouse' ? 'active' : ''}`}
              onClick={() => { setSection('warehouse'); setError('') }}
            >
              <Boxes size={17} />
              <span>Kho hàng hóa</span>
              {summary?.total ? <span className="nav-count">{summary.total}</span> : null}
            </button>
          )}

          {/* Khách hàng: chỉ ADMIN */}
          {isAdmin && (
            <button
              className={`nav-item ${section === 'customers' ? 'active' : ''}`}
              onClick={() => { setSection('customers'); setError('') }}
            >
              <Users size={17} />
              <span>Quản lý khách hàng</span>
              {customers.length > 0 && <span className="nav-count">{customers.length}</span>}
            </button>
          )}

          {/* Phần Quản trị / Kiểm tra sản phẩm: ADMIN + FIXER + CASHIER (để cashier gửi phản hồi kiểm tra sản phẩm) */}
          {canViewMaintenance && (
            <>
              <p className="nav-label nav-admin-label">
                {isAdmin ? 'QUẢN TRỊ & HẬU MÃI' : isFixer ? 'XỬ LÝ HÀNG LỖI' : 'HỖ TRỢ HÀNG HÓA'}
              </p>

              {isAdmin && (
                <button
                  className={`nav-item ${section === 'reviews' ? 'active' : ''}`}
                  onClick={() => { setSection('reviews'); setError('') }}
                >
                  <Star size={17} />
                  <span>Bình luận & Đánh giá</span>
                  {reviews.length > 0 && <span className="nav-count">{reviews.length}</span>}
                </button>
              )}

              <button
                className={`nav-item ${section === 'maintenance' ? 'active' : ''}`}
                onClick={() => { setSection('maintenance'); setError('') }}
              >
                <Wrench size={17} />
                <span>Theo dõi hàng hóa</span>
                {maintenance.length > 0 && <span className="nav-count">{maintenance.length}</span>}
              </button>

              {isAdmin && (
                <button
                  className={`nav-item ${section === 'users' ? 'active' : ''}`}
                  onClick={() => { setSection('users'); setError('') }}
                >
                  <ShieldCheck size={17} />
                  <span>Quản trị tài khoản</span>
                  {users.length > 0 && <span className="nav-count">{users.length}</span>}
                </button>
              )}
              {isAdmin && (
                <button className={`nav-item ${section === 'customerAccounts' ? 'active' : ''}`} onClick={() => { setSection('customerAccounts'); setError('') }}>
                  <Users size={17} />
                  <span>Tài khoản khách hàng</span>
                  {customerAccounts.length > 0 && <span className="nav-count">{customerAccounts.length}</span>}
                </button>
              )}
            </>
          )}
        </nav>


        <div className="sidebar-bottom">
          <div className="connection-status">
            <span className="connection-dot" />
            CƠ SỞ DỮ LIỆU: <span className="connection-host">H2 / MySQL</span>
          </div>
          <div className="profile-row">
            <span className="profile-avatar">{session.displayName.charAt(0).toUpperCase()}</span>
            <span className="profile-copy">
              <strong>{session.displayName}</strong>
              <small>{session.role === 'ADMIN' ? 'Quản trị viên' : session.role === 'CASHIER' ? 'Nhân viên thu ngân' : session.role === 'FIXER' ? 'Nhân viên kiểm tra hàng hóa' : 'Nhân viên kho'}</small>
            </span>
            <button className="icon-button profile-logout" title="Đăng xuất" aria-label="Đăng xuất" onClick={logout}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Hệ thống Store</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{pageTitles[section]}</strong>
          </div>
          <div className="topbar-tools">
            <a className="storefront-top-link" href="/store"><Store size={15} /> Cửa hàng</a>
            {!isFixer && (
              <label className="top-search">
                <Search size={15} />
                <input
                  aria-label="Tìm nhanh"
                  placeholder="Tìm sản phẩm, mã hàng..."
                  value={search}
                  onChange={event => { setSearch(event.target.value); setPage(0); setSection('warehouse') }}
                />
              </label>
            )}
            <span className="topbar-divider" />
            <span className="role-indicator">
              <ShieldCheck size={15} /> {session.role === 'ADMIN' ? 'Admin' : session.role === 'CASHIER' ? 'Cashier' : session.role === 'FIXER' ? 'Fixer' : 'Staff'}
            </span>
            <div className="mobile-profile">
              <span className="mobile-profile-avatar">{session.displayName.charAt(0).toUpperCase()}</span>
              <span className="mobile-profile-name">{session.displayName}</span>
              <button className="icon-button" title="Đăng xuất" aria-label="Đăng xuất" onClick={logout}>
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </header>

        <div className="content-area">
          {error && (
            <div className="global-error" role="alert">
              <span>{error}</span>
              <button className="text-button" onClick={() => setError('')}>Đóng</button>
            </div>
          )}

          {/* Guard: cashier chỉ được checkout, warehouse và maintenance */}
          {isCashier && section !== 'checkout' && section !== 'warehouse' && section !== 'maintenance' && (
            <div className="global-error" role="alert">
              <span>⛔ Tài khoản Thu Ngân chỉ được phép truy cập Thanh toán, Kho hàng hóa và Kiểm tra sản phẩm.</span>
              <button className="text-button" onClick={() => setSection('checkout')}>Quay về Thanh toán</button>
            </div>
          )}

          {/* Guard: fixer chỉ được vào maintenance */}
          {isFixer && section !== 'maintenance' && (
            <div className="global-error" role="alert">
              <span>⛔ Tài khoản Nhân viên kiểm tra hàng hóa chỉ được phép truy cập mục Kiểm tra sản phẩm.</span>
              <button className="text-button" onClick={() => setSection('maintenance')}>Quay về Kiểm tra sản phẩm</button>
            </div>
          )}

          {section === 'overview' && isAdmin && (
            <DashboardView
              summary={summary}
              recentAssets={recentAssets}
              onOpenAssets={() => setSection('warehouse')}
            />
          )}

          {section === 'checkout' && (isAdmin || isCashier) && (
            <CheckoutView
              assets={allAssets}
              customers={customers}
              session={session}
              initialSelectedAsset={checkoutInitialAsset}
              initialSelectedCustomer={checkoutInitialCustomer}
              onClearInitialSelection={() => {
                setCheckoutInitialAsset(null)
                setCheckoutInitialCustomer(null)
              }}
              onOrderCompleted={refresh}
              onMoveOrderToTrash={isAdmin ? moveOrderToTrash : undefined}
              trashItems={trash}
              trashLoading={trashLoading}
              onRestoreTrashItem={isAdmin ? restoreTrashItem : undefined}
              onDeleteTrashItem={isAdmin ? deleteTrashItem : undefined}
            />
          )}

          {section === 'catalog' && isAdmin && (
            <BrandCatalogView
              assets={allAssets}
              brands={productBrands}
              loading={loading && allAssets.length === 0}
              onSelectForCheckout={handleSelectFromCatalog}
              onViewDetail={setSelectedAsset}
              trashItems={trash}
              trashLoading={trashLoading}
              onCreateBrand={async name => { await api.createProductBrand(name); refresh() }}
              onUpdateBrand={async (id, name) => { await api.updateProductBrand(id, name); refresh() }}
              onMoveBrandToTrash={id => moveItemToTrash('BRAND', id)}
              onRestoreTrashItem={restoreTrashItem}
              onDeleteTrashItem={deleteTrashItem}
            />
          )}

          {section === 'warehouse' && canViewWarehouse && (
            <AssetsView
              page={assetPage}
              search={search}
              status={status}
              manufacturer={manufacturer}
              loading={loading}
              canManage={session.role === 'ADMIN'}
              onSearch={value => { setSearch(value); setPage(0) }}
              onStatus={value => { setStatus(value); setPage(0) }}
              onManufacturer={value => { setManufacturer(value); setPage(0) }}
              onCreate={openCreate}
              onSelect={setSelectedAsset}
              onPage={setPage}
              onMoveToTrash={id => { void moveItemToTrash('ASSET', id).catch(() => undefined) }}
              trashItems={trash}
              trashLoading={trashLoading}
              onRestoreTrashItem={restoreTrashItem}
              onDeleteTrashItem={deleteTrashItem}
            />
          )}

          {section === 'customers' && isAdmin && (
            <CustomersView
              customers={customers}
              loading={loading && customers.length === 0}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              trashItems={trash.filter(item => item.type === 'CUSTOMER')}
              trashLoading={trashLoading}
              onRestoreTrashItem={restoreTrashItem}
              onDeleteTrashItem={deleteTrashItem}
              onSelectForCheckout={customer => {
                setCheckoutInitialCustomer(customer)
                setSection('checkout')
              }}
            />
          )}

          {section === 'reviews' && session.role === 'ADMIN' && (
            <ReviewsView
              reviews={reviews}
              loading={loading && reviews.length === 0}
              onRefresh={refresh}
            />
          )}

          {section === 'maintenance' && canViewMaintenance && (
            <MaintenanceView
              items={maintenance}
              repairRequests={customerRepairRequests}
              loading={loading}
              canResolve={isAdmin || isFixer}
              onCloseTicket={closeMaintenance}
              onCloseCustomerRequest={closeCustomerRepairRequest}
            />
          )}

          {section === 'customerAccounts' && session.role === 'ADMIN' && (
            <div className="page-stack">
              <div className="page-heading-row"><div><p className="eyebrow">QUẢN LÝ TÀI KHOẢN CỬA HÀNG</p><h2>Danh sách tài khoản khách hàng</h2><p className="muted">Xem, tìm kiếm, chỉnh sửa và khóa/mở tài khoản khách đã đăng ký.</p></div></div>
              <CustomerAccountsAdminView accounts={customerAccounts} loading={customerAccountsLoading} onUpdate={updateCustomerAccount} />
            </div>
          )}

          {section === 'users' && session.role === 'ADMIN' && (
            <UsersView
              users={users}
              customerAccounts={customerAccounts}
              customerAccountsLoading={customerAccountsLoading}
              loading={loading}
              onCreate={createUser}
              onUpdate={updateUser}
              onDelete={deleteUser}
              onUpdateCustomerAccount={updateCustomerAccount}
              trashItems={trash}
              trashLoading={trashLoading}
              onRestoreTrashItem={restoreTrashItem}
              onDeleteTrashItem={deleteTrashItem}
            />
          )}

          {section !== 'checkout' && (
            <div className="content-footnote">
              <span>SIÊU THỊ MINI ĂN VẶT & ĐỒ CHƠI & BÁN HÀNG</span>
              <span>Cơ sở dữ liệu: Cục bộ</span>
              <button className="text-button" onClick={refresh}>
                <RefreshCw size={14} /> Làm mới
              </button>
            </div>
          )}
        </div>
      </main>

      {formOpen && <AssetFormModal asset={formAsset} onClose={() => setFormOpen(false)} onSave={saveAsset} />}
      {selectedAsset && (
        <AssetDetailPanel
          asset={selectedAsset}
          canManage={session.role === 'ADMIN'}
          canManageAssignments={isAdmin}
          canRequestMaintenance={isAdmin || isCashier}
          onClose={() => setSelectedAsset(null)}
          onEdit={() => { setFormAsset(selectedAsset); setSelectedAsset(null); setFormOpen(true) }}
          onChanged={refresh}
        />
      )}
    </div>
  )
}

export default function App() {
  if (window.location.pathname.replace(/\/+$/, '') === '/store'
      || window.location.pathname.startsWith('/store/')) return <StorefrontView />
  return <AdminApp />
}