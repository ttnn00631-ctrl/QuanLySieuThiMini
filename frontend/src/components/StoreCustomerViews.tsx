import { ArrowLeft, ArrowRight, Check, Package, PackageCheck, ShoppingBag, UserRound, Wrench } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api'
import type { CustomerAccount, CustomerRepairRequestInput, CustomerSession, Session, StoreProduct } from '../types'
import { formatCurrency, productImageFor } from '../utils'

type AuthMode = 'login' | 'register'

async function loginStaffFromStore(username: string, password: string): Promise<Session | null> {
  try {
    return await api.login(username, password)
  } catch {
    return null
  }
}

interface StoreAuthPageProps {
  mode: AuthMode
  onAuthenticated: (session: CustomerSession, isRegistration: boolean) => void
}

export function StoreAuthPage({ mode, onAuthenticated }: StoreAuthPageProps) {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isRegister = mode === 'register'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (isRegister) {
        onAuthenticated(await api.registerStoreAccount({
          username: username.trim(),
          displayName: displayName.trim(),
          password,
        }), true)
        return
      }
      try {
        onAuthenticated(await api.loginStoreAccount(username.trim(), password), false)
      } catch (customerError) {
        const staffSession = await loginStaffFromStore(username.trim(), password)
        if (!staffSession) throw customerError
        localStorage.setItem('asset-manager-session', JSON.stringify(staffSession))
        window.location.href = '/store'
      }
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Không thể xác thực tài khoản')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="store-account-page">
      <a className="store-back-link" href="/store"><ArrowLeft size={15} /> Trở về cửa hàng</a>
      <form className="store-account-card" onSubmit={event => void submit(event)}>
        <span className="store-account-icon"><UserRound size={21} /></span>
        <p className="store-kicker">{isRegister ? 'TÀI KHOẢN KHÁCH HÀNG' : 'CHÀO MỪNG TRỞ LẠI'}</p>
        <h1>{isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}</h1>
        <p className="store-account-intro">{isRegister ? 'Đăng ký để lưu thông tin và gửi yêu cầu mua hàng.' : 'Đăng nhập để tiếp tục với giỏ hàng của bạn.'}</p>
        {isRegister && <label><span>Họ và tên</span><input autoComplete="name" value={displayName} onChange={event => setDisplayName(event.target.value)} required maxLength={120} /></label>}
        <label><span>Tên tài khoản</span><input autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} required minLength={3} maxLength={80} pattern="[A-Za-z0-9._-]+" title="Dùng chữ cái, số, dấu chấm, gạch ngang hoặc gạch dưới" /></label>
        <label><span>Mật khẩu</span><input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} required minLength={isRegister ? 8 : undefined} maxLength={72} /></label>
        {isRegister && <small className="store-account-hint">Email và số điện thoại có thể bổ sung sau trong trang thông tin tài khoản.</small>}
        {error && <p className="store-cart-error" role="alert">{error}</p>}
        <button className="store-account-submit" type="submit" disabled={busy}>{busy ? 'Đang xử lý...' : isRegister ? 'Đăng ký tài khoản' : 'Đăng nhập'} <ArrowRight size={16} /></button>
        <p className="store-account-switch">{isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'} <a href={`${isRegister ? '/store/login' : '/store/register'}${window.location.search}`}>{isRegister ? 'Đăng nhập' : 'Đăng ký'}</a></p>
      </form>
    </section>
  )
}

interface StoreProfilePageProps {
  session: CustomerSession | null
  account: CustomerAccount | null
  loading: boolean
  error: string
  onSave: (account: CustomerAccount) => void
  onLogout: () => void
}

interface StaffAccountDetailsPageProps {
  session: Session
  onLogout: () => void
}

const staffRoleLabels: Record<Session['role'], string> = {
  ADMIN: 'Quản trị viên',
  STAFF: 'Nhân viên',
  CASHIER: 'Thu ngân',
  FIXER: 'Nhân viên kiểm tra hàng hóa',
}

export function StaffAccountDetailsPage({ session, onLogout }: StaffAccountDetailsPageProps) {
  return (
    <section className="store-account-page">
      <a className="store-back-link" href="/store"><ArrowLeft size={15} /> Trở về cửa hàng</a>
      <div className="store-profile-layout">
        <aside className="store-profile-aside">
          <span className="store-profile-avatar">{session.displayName.charAt(0).toUpperCase()}</span>
          <p className="store-kicker">TÀI KHOẢN NHÂN VIÊN</p>
          <h1>{session.displayName}</h1>
          <span className="store-profile-username">@{session.username}</span>
          <button className="store-logout-button" onClick={onLogout}>Đăng xuất</button>
        </aside>
        <section className="store-profile-form" aria-labelledby="staff-account-details-title">
          <p className="store-kicker">CHI TIẾT TÀI KHOẢN</p>
          <h2 id="staff-account-details-title">Thông tin tài khoản</h2>
          <p className="store-account-intro">Thông tin tài khoản nhân viên đang đăng nhập.</p>
          <dl className="store-account-details-list">
            <div><dt>Tên đăng nhập</dt><dd>@{session.username}</dd></div>
            <div><dt>Họ và tên</dt><dd>{session.displayName}</dd></div>
            <div><dt>Vai trò</dt><dd>{staffRoleLabels[session.role]}</dd></div>
          </dl>
        </section>
      </div>
    </section>
  )
}

export function StoreProfilePage({ session, account, loading, error: initialError, onSave, onLogout }: StoreProfilePageProps) {
  const [displayName, setDisplayName] = useState(account?.displayName ?? '')
  const [email, setEmail] = useState(account?.email ?? '')
  const [phone, setPhone] = useState(account?.phone ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!account) return
    setDisplayName(account.displayName)
    setEmail(account.email ?? '')
    setPhone(account.phone ?? '')
  }, [account])

  if (!session) {
    return <section className="store-account-page"><div className="store-account-card store-account-message"><span className="store-account-icon"><UserRound size={21} /></span><h1>Đăng nhập tài khoản</h1><p>Đăng nhập để xem và cập nhật thông tin cá nhân.</p><a className="store-account-submit" href="/store/login">Đăng nhập <ArrowRight size={16} /></a></div></section>
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const updated = await api.updateStoreAccount({ displayName: displayName.trim(), email: email.trim(), phone: phone.trim() })
      onSave(updated)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Không thể cập nhật tài khoản')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="store-account-page">
      <a className="store-back-link" href="/store"><ArrowLeft size={15} /> Trở về cửa hàng</a>
      <div className="store-profile-layout">
        <aside className="store-profile-aside"><span className="store-profile-avatar">{session.displayName.charAt(0).toUpperCase()}</span><p className="store-kicker">TÀI KHOẢN KHÁCH</p><h1>{session.displayName}</h1><span className="store-profile-username">@{session.username}</span><button className="store-logout-button" onClick={onLogout}>Đăng xuất</button></aside>
        <form className="store-profile-form" onSubmit={event => void submit(event)}>
          <p className="store-kicker">CHI TIẾT TÀI KHOẢN</p><h2>Thông tin tài khoản</h2><p className="store-account-intro">Xem và cập nhật thông tin cá nhân; đăng xuất khỏi tài khoản tại khung bên cạnh.</p>
          {loading && <p className="store-account-hint">Đang tải hồ sơ...</p>}
          {initialError && <p className="store-cart-error" role="alert">{initialError}</p>}
          <label><span>Tên tài khoản</span><input value={session.username} disabled /></label>
          <label><span>Họ và tên</span><input autoComplete="name" value={displayName} onChange={event => setDisplayName(event.target.value)} required maxLength={120} /></label>
          <label><span>Email</span><input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} maxLength={120} placeholder="email@example.com" /></label>
          <label><span>Số điện thoại</span><input type="tel" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)} maxLength={20} placeholder="09xxxxxxxx" /></label>
          {error && <p className="store-cart-error" role="alert">{error}</p>}
          <button className="store-account-submit" type="submit" disabled={busy || loading}>{busy ? 'Đang lưu...' : 'Lưu thông tin'} <Check size={16} /></button>
        </form>
      </div>
    </section>
  )
}

interface StoreProductDetailPageProps {
  product: StoreProduct | null
  loading: boolean
  onAddToCart: (product: StoreProduct) => void
}

function specification(value: string | number | null | undefined, suffix = '') {
  return value === null || value === undefined || value === '' ? 'Không áp dụng' : `${value}${suffix}`
}

const productStatusLabels: Record<StoreProduct['status'], string> = {
  AVAILABLE: 'Còn hàng',
  ASSIGNED: 'Đã xuất hàng',
  MAINTENANCE: 'Đang kiểm tra sản phẩm',
  RETIRED: 'Ngừng kinh doanh',
  SOLD: 'Đã bán',
}

export function StoreProductDetailPage({ product, loading, onAddToCart }: StoreProductDetailPageProps) {
  if (loading) return <section className="store-product-detail-page"><p className="store-state-card">Đang tải thông tin sản phẩm...</p></section>
  if (!product) return <section className="store-product-detail-page"><a className="store-back-link" href="/store"><ArrowLeft size={15} /> Trở về cửa hàng</a><p className="store-state-card">Sản phẩm không còn sẵn sàng hoặc không tồn tại.</p></section>

  const image = productImageFor(product)

  return (
    <section className="store-product-detail-page">
      <a className="store-back-link" href="/store#products"><ArrowLeft size={15} /> Trở về danh sách sản phẩm</a>
      <div className="store-product-detail">
        <div className="store-detail-photo"><img src={image} alt={`Ảnh sản phẩm ${product.manufacturer} ${product.modelName}`} /></div>
        <div className="store-detail-copy">
          <span className="store-product-type">{product.manufacturer} · {product.type}</span>
          <h1>{product.modelName}</h1>
          <span className={`store-stock-state ${product.status === 'AVAILABLE' ? 'available' : ''}`}>{productStatusLabels[product.status]}</span>
          <p className="store-detail-price">{formatCurrency(product.price)}</p>
          <dl className="store-spec-grid">
            <div><dt><Package size={15} /> Mô tả sản phẩm</dt><dd>{specification(product.processor)}</dd></div>
            <div><dt><PackageCheck size={15} /> Số lượng tham khảo</dt><dd>{product.memoryGb == null ? 'Liên hệ cửa hàng' : `${product.memoryGb} ${product.storage || 'sản phẩm'}`}</dd></div>
            <div><dt><PackageCheck size={15} /> Đơn vị tính</dt><dd>{specification(product.storage)}</dd></div>
          </dl>
          <button className="store-detail-add-button" disabled={product.status !== 'AVAILABLE'} onClick={() => onAddToCart(product)}>
            <ShoppingBag size={17} /> {product.status === 'AVAILABLE' ? 'Thêm vào giỏ hàng' : 'Sản phẩm hiện không có sẵn'}
          </button>
        </div>
      </div>
    </section>
  )
}

interface StoreRepairPageProps {
  session: CustomerSession | null
  account: CustomerAccount | null
  accountLoading: boolean
  accountError: string
}

export function StoreRepairPage({ session, account, accountLoading, accountError }: StoreRepairPageProps) {
  const [deviceType, setDeviceType] = useState('Đồ ăn vặt')
  const [manufacturer, setManufacturer] = useState('')
  const [modelName, setModelName] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [issue, setIssue] = useState('')
  const [error, setError] = useState('')
  const [submittedId, setSubmittedId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  if (!session) {
    return <section className="store-repair-page">
      <a className="store-back-link" href="/store"><ArrowLeft size={15} /> Trở về cửa hàng</a>
      <div className="store-repair-card store-repair-gate">
        <span className="store-account-icon"><Wrench size={21} /></span>
        <p className="store-kicker">PHẢN HỒI SẢN PHẨM</p>
        <h1>Đăng nhập để gửi yêu cầu</h1>
        <p className="store-account-intro">Đăng nhập tài khoản khách hàng để nhân viên siêu thị tiếp nhận và liên hệ hỗ trợ sản phẩm.</p>
        <a className="store-account-submit" href="/store/login?repair=1">Đăng nhập <ArrowRight size={16} /></a>
      </div>
    </section>
  }

  if (accountLoading) {
    return <section className="store-repair-page"><p className="store-state-card">Đang tải thông tin liên hệ...</p></section>
  }

  if (!account?.phone) {
    return <section className="store-repair-page">
      <a className="store-back-link" href="/store"><ArrowLeft size={15} /> Trở về cửa hàng</a>
      <div className="store-repair-card store-repair-gate">
        <span className="store-account-icon"><Wrench size={21} /></span>
        <p className="store-kicker">PHẢN HỒI SẢN PHẨM</p>
        <h1>Bổ sung số điện thoại</h1>
        <p className="store-account-intro">Nhân viên siêu thị cần số điện thoại để liên hệ về phản hồi sản phẩm.</p>
        {accountError && <p className="store-cart-error" role="alert">{accountError}</p>}
        <a className="store-account-submit" href="/store/account">Cập nhật thông tin <ArrowRight size={16} /></a>
      </div>
    </section>
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const request: CustomerRepairRequestInput = {
        deviceType,
        manufacturer: manufacturer.trim(),
        modelName: modelName.trim(),
        serialNumber: serialNumber.trim() || undefined,
        issue: issue.trim(),
      }
      const result = await api.createStoreRepairRequest(request)
      setSubmittedId(result.id)
      setManufacturer('')
      setModelName('')
      setSerialNumber('')
      setIssue('')
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Không gửi được phản hồi sản phẩm')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="store-repair-page">
      <a className="store-back-link" href="/store"><ArrowLeft size={15} /> Trở về cửa hàng</a>
      <form className="store-repair-card" onSubmit={event => void submit(event)}>
        <p className="store-kicker">CHĂM SÓC KHÁCH HÀNG</p>
        <h1>Gửi phản hồi sản phẩm</h1>
        <p className="store-account-intro">Nhân viên siêu thị sẽ tiếp nhận thông tin và liên hệ với bạn qua số điện thoại bên dưới.</p>
        <div className="store-repair-contact"><UserRound size={16} /><span><strong>{account.displayName}</strong><small>{account.phone}</small></span><a href="/store/account">Sửa thông tin</a></div>
        <label><span>Danh mục sản phẩm</span><select value={deviceType} onChange={event => setDeviceType(event.target.value)}><option>Đồ ăn vặt</option><option>Đồ chơi</option><option>Nước uống</option><option>Phụ kiện</option></select></label>
        <div className="store-repair-fields">
          <label><span>Thương hiệu sản phẩm</span><input value={manufacturer} onChange={event => setManufacturer(event.target.value)} required maxLength={100} placeholder="Ví dụ: Oishi" /></label>
          <label><span>Tên sản phẩm</span><input value={modelName} onChange={event => setModelName(event.target.value)} required maxLength={120} placeholder="Ví dụ: Snack khoai tây" /></label>
        </div>
        <label><span>Mã lô hàng <small>(không bắt buộc)</small></span><input value={serialNumber} onChange={event => setSerialNumber(event.target.value)} maxLength={100} /></label>
        <label><span>Nội dung phản hồi <b>*</b></span><textarea value={issue} onChange={event => setIssue(event.target.value)} required maxLength={1000} rows={4} placeholder="Mô tả tình trạng sản phẩm và thời điểm phát sinh..." /></label>
        {error && <p className="store-cart-error" role="alert">{error}</p>}
        {submittedId !== null && <p className="store-repair-success" role="status"><Check size={16} /> Đã gửi yêu cầu #{submittedId}. Nhân viên siêu thị sẽ sớm liên hệ.</p>}
        <button className="store-account-submit" type="submit" disabled={busy}>{busy ? 'Đang gửi...' : 'Gửi phản hồi sản phẩm'} <ArrowRight size={16} /></button>
      </form>
    </section>
  )
}
