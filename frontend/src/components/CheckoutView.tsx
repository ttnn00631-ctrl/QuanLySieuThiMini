import { useState, useMemo } from 'react'
import {
  Package, ShoppingCart, Trash2, Plus, CreditCard, Banknote, QrCode,
  User, CheckCircle2, Search, Printer, Receipt, History, AlertCircle, X
} from 'lucide-react'
import type { Asset, Customer, SaleOrder, CartItem, Session } from '../types'
import { formatCurrency } from '../utils'
import { api } from '../api'
import { Pagination, usePagination } from './Pagination'
import { TrashView } from './TrashView'
import { ManagementViewToggle } from './ManagementViewToggle'
import type { TrashRecord } from '../types'

function productGroupKey(asset: Asset) {
  return `${asset.manufacturer}\u0000${asset.modelName}\u0000${asset.purchaseCost ?? 0}`
}

interface CheckoutViewProps {
  assets: Asset[]
  customers: Customer[]
  session: Session
  initialSelectedAsset?: Asset | null
  initialSelectedCustomer?: Customer | null
  onClearInitialSelection?: () => void
  onOrderCompleted?: () => void
  onMoveOrderToTrash?: (id: number) => Promise<void>
  trashItems?: TrashRecord[]
  trashLoading?: boolean
  onRestoreTrashItem?: (id: number) => Promise<void>
  onDeleteTrashItem?: (id: number) => Promise<void>
}

export function CheckoutView({
  assets,
  customers,
  session,
  initialSelectedAsset,
  initialSelectedCustomer,
  onClearInitialSelection,
  onOrderCompleted,
  onMoveOrderToTrash,
  trashItems = [],
  trashLoading = false,
  onRestoreTrashItem,
  onDeleteTrashItem,
}: CheckoutViewProps) {
  // Giỏ hàng
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (initialSelectedAsset) {
      return [{
        asset: initialSelectedAsset,
        quantity: 1,
        unitPrice: initialSelectedAsset.purchaseCost || 0
      }]
    }
    return []
  })

  // Chọn loại khách hàng: member hoặc guest
  const [customerType, setCustomerType] = useState<'member' | 'guest'>(initialSelectedCustomer ? 'member' : 'guest')
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>(initialSelectedCustomer?.id ?? '')
  const [customerSearch, setCustomerSearch] = useState('')
  const [guestName, setGuestName] = useState('Khách vãng lai')
  const [guestPhone, setGuestPhone] = useState('')

  // Tìm kiếm sản phẩm bên cột trái
  const [productSearch, setProductSearch] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('ALL')

  // Phương thức thanh toán
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CARD'>('CASH')
  const [cashGiven, setCashGiven] = useState<number | ''>('')

  // Modal hóa đơn
  const [completedOrder, setCompletedOrder] = useState<SaleOrder | null>(null)
  const [historyOrders, setHistoryOrders] = useState<SaleOrder[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [showTrash, setShowTrash] = useState(false)
  const trashedOrders = trashItems.filter(item => item.type === 'ORDER')

  async function moveOrderToTrash(order: SaleOrder) {
    if (!onMoveOrderToTrash || !window.confirm(`Chuyển hóa đơn ${order.orderCode} vào thùng rác?`)) return
    try {
      await onMoveOrderToTrash(order.id)
      setHistoryOrders(current => current.filter(item => item.id !== order.id))
      historyPagination.setPage(0)
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : 'Không thể chuyển hóa đơn vào thùng rác')
    }
  }

  async function processWebsiteRequest(order: SaleOrder, action: 'complete' | 'cancel') {
    if (session.role !== 'ADMIN') return
    const prompt = action === 'complete'
      ? `Chốt yêu cầu ${order.orderCode}? Các sản phẩm sẽ được đánh dấu đã bán và bị ẩn khỏi cửa hàng.`
      : `Từ chối yêu cầu ${order.orderCode}? Sản phẩm vẫn được giữ trong kho.`
    if (!window.confirm(prompt)) return
    try {
      const updated = action === 'complete'
        ? await api.completeWebsiteRequest(order.id)
        : await api.cancelWebsiteRequest(order.id)
      setHistoryOrders(current => current.map(item => item.id === updated.id ? updated : item))
      setMessage(action === 'complete' ? 'Đã chốt yêu cầu mua hàng.' : 'Đã từ chối yêu cầu mua hàng.')
      onOrderCompleted?.()
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : 'Không thể xử lý yêu cầu mua hàng')
    }
  }

  // Lọc sản phẩm sẵn sàng
  const availableAssets = useMemo(() => {
    return assets.filter(a => {
      const matchStatus = a.status === 'AVAILABLE'
      const matchBrand = selectedBrand === 'ALL' || a.manufacturer.toLowerCase() === selectedBrand.toLowerCase()
      const matchSearch = !productSearch.trim() ||
        a.modelName.toLowerCase().includes(productSearch.toLowerCase()) ||
        a.assetCode.toLowerCase().includes(productSearch.toLowerCase()) ||
        a.manufacturer.toLowerCase().includes(productSearch.toLowerCase())
      return matchStatus && matchBrand && matchSearch
    })
  }, [assets, selectedBrand, productSearch])
  const productGroups = useMemo(() => {
    const groups = new Map<string, { key: string; asset: Asset; assets: Asset[] }>()
    for (const asset of availableAssets) {
      const key = productGroupKey(asset)
      const group = groups.get(key)
      if (group) group.assets.push(asset)
      else groups.set(key, { key, asset, assets: [asset] })
    }
    return [...groups.values()]
  }, [availableAssets])
  const cartGroups = useMemo(() => {
    const groups = new Map<string, { key: string; items: CartItem[] }>()
    for (const item of cart) {
      const key = productGroupKey(item.asset)
      const group = groups.get(key)
      if (group) group.items.push(item)
      else groups.set(key, { key, items: [item] })
    }
    return [...groups.values()]
  }, [cart])

  // Khách hàng đã chọn
  const selectedCustomer = useMemo(() => {
    if (customerType === 'guest' || !selectedCustomerId) return null
    return customers.find(c => c.id === Number(selectedCustomerId)) || null
  }, [customerType, selectedCustomerId, customers])
  const matchingCustomers = useMemo(() => {
    const term = customerSearch.trim().toLowerCase()
    return term
      ? customers.filter(customer =>
        customer.fullName.toLowerCase().includes(term) || customer.phone.includes(term))
      : customers
  }, [customers, customerSearch])
  const productPagination = usePagination(productGroups, 8)
  const historyPagination = usePagination(historyOrders)

  // Tỷ lệ giảm giá theo hạng thành viên
  const discountRate = useMemo(() => {
    if (!selectedCustomer) return 0
    if (selectedCustomer.membershipTier === 'GOLD') return 0.10 // Giảm 10%
    if (selectedCustomer.membershipTier === 'SILVER') return 0.05 // Giảm 5%
    if (selectedCustomer.membershipTier === 'BRONZE') return 0.02 // Giảm 2%
    return 0
  }, [selectedCustomer])

  // Tính tiền
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  }, [cart])

  const discountAmount = useMemo(() => {
    return Math.round(subtotal * discountRate)
  }, [subtotal, discountRate])

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - discountAmount)
  }, [subtotal, discountAmount])

  const changeAmount = useMemo(() => {
    if (typeof cashGiven !== 'number') return 0
    return Math.max(0, cashGiven - totalAmount)
  }, [cashGiven, totalAmount])

  // Thêm vào giỏ
  function addToCart(asset: Asset) {
    setCart(prev => {
      const existing = prev.find(item => item.asset.id === asset.id)
      if (existing) return prev
      return [...prev, {
        asset,
        quantity: 1,
        unitPrice: asset.purchaseCost || 0
      }]
    })
  }

  function removeFromCart(assetId: number) {
    setCart(prev => prev.filter(item => item.asset.id !== assetId))
  }

  function changeProductQuantity(asset: Asset, change: 1 | -1) {
    if (change === -1) {
      const selected = cart.find(item => productGroupKey(item.asset) === productGroupKey(asset))
      if (selected) removeFromCart(selected.asset.id)
      return
    }

    const selectedAssetIds = new Set(cart.map(item => item.asset.id))
    const nextAsset = assets.find(candidate =>
      candidate.status === 'AVAILABLE' &&
      productGroupKey(candidate) === productGroupKey(asset) &&
      !selectedAssetIds.has(candidate.id),
    )
    if (!nextAsset) {
      setMessage(`Không còn sản phẩm ${asset.modelName} sẵn sàng trong kho.`)
      return
    }
    addToCart(nextAsset)
  }

  // Xử lý thanh toán
  async function handleCheckout() {
    if (cart.length === 0) {
      setMessage('Giỏ hàng đang trống, vui lòng chọn ít nhất 1 sản phẩm!')
      return
    }

    if (customerType === 'member' && !selectedCustomerId) {
      setMessage('Vui lòng chọn khách hàng thành viên hoặc chuyển sang chế độ Khách vãng lai!')
      return
    }

    // Với giao dịch tiền mặt, cho phép thanh toán đúng số tiền hóa đơn
    // khi chưa nhập tiền khách đưa.
    const received = paymentMethod === 'CASH' ? (typeof cashGiven === 'number' ? cashGiven : totalAmount) : null
    if (paymentMethod === 'CASH' && (received === null || received < totalAmount)) {
      setMessage('Số tiền khách đưa chưa đủ để thanh toán hóa đơn!')
      return
    }

    setProcessing(true)
    setMessage('')

    try {
      const savedOrder = await api.createOrder({
        customerId: customerType === 'member' ? selectedCustomer?.id ?? null : null,
        guest: customerType === 'guest',
        guestName: guestName || 'Khách vãng lai',
        guestPhone,
        paymentMethod,
        cashReceived: received,
        items: cart.map(item => ({ assetId: item.asset.id, quantity: 1 as const })),
      })
      setCompletedOrder(savedOrder)
      setCart([])
      setSelectedCustomerId('')
      setCustomerType('guest')
      setCustomerSearch('')
      setGuestName('Khách vãng lai')
      setGuestPhone('')
      setCashGiven('')
      onClearInitialSelection?.()
      if (onOrderCompleted) onOrderCompleted()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Có lỗi khi tạo hóa đơn thanh toán')
    } finally {
      setProcessing(false)
    }
  }

  // Xem lịch sử đơn hàng
  async function loadOrderHistory() {
    try {
      const orders = await api.orders()
      setHistoryOrders(orders)
      historyPagination.setPage(0)
      setShowHistory(true)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Không tải được lịch sử đơn hàng')
    }
  }

  if (showTrash && onRestoreTrashItem && onDeleteTrashItem) {
    return <div className="checkout-page-container">
      <div className="checkout-top-header"><div><h1 className="view-title">Hóa đơn</h1><p className="view-subtitle">Khôi phục hoặc xóa vĩnh viễn hóa đơn ngay trong khu vực bán hàng.</p></div><ManagementViewToggle archived activeCount={historyOrders.length} archivedCount={trashedOrders.length} onChange={setShowTrash} /></div>
      <TrashView items={trashedOrders} loading={trashLoading} types={['ORDER']} onRestore={onRestoreTrashItem} onDeleteForever={onDeleteTrashItem} />
    </div>
  }

  return (
    <div className="checkout-page-container">
      <div className="checkout-top-header">
        <div>
          <h1 className="view-title">Điểm bán hàng & Thanh toán (POS)</h1>
          <p className="view-subtitle">Lập hóa đơn bán hàng cho đồ ăn vặt và đồ chơi, hỗ trợ thành viên và khách vãng lai</p>
        </div>
        <div className="pos-actions-header">
          <span className="cashier-tag">
            Thu ngân: <strong>{session.displayName} ({session.role})</strong>
          </span>
          <button className="btn-secondary" onClick={loadOrderHistory}>
            <History size={16} /> Lịch sử đơn hàng
          </button>
          {onRestoreTrashItem && onDeleteTrashItem && <ManagementViewToggle archived={false} activeCount={historyOrders.length} archivedCount={trashedOrders.length} onChange={setShowTrash} />}
        </div>
      </div>

      {message && (
        <div className="pos-alert-banner">
          <AlertCircle size={17} />
          <span>{message}</span>
          <button onClick={() => setMessage('')}><X size={15} /></button>
        </div>
      )}

      <div className="pos-split-layout">
        {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM SẴN CÓ ĐỂ CHỌN */}
        <section className="pos-products-column">
          <div className="pos-column-card">
            <div className="pos-search-row">
              <div className="pos-search-input">
                <Search size={16} />
                <input
                  placeholder="Tìm sản phẩm theo tên, mã hàng, thương hiệu..."
                  value={productSearch}
                  onChange={e => { setProductSearch(e.target.value); productPagination.setPage(0) }}
                />
              </div>

              <select
                className="pos-brand-select"
                value={selectedBrand}
                onChange={e => { setSelectedBrand(e.target.value); productPagination.setPage(0) }}
              >
                <option value="ALL">Tất cả thương hiệu sản phẩm</option>
                {[...new Set(assets.map(asset => asset.manufacturer))].sort().map(manufacturer => (
                  <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
                ))}
              </select>
            </div>

            <div className="pos-products-scroll-grid">
              {availableAssets.length === 0 ? (
                <div className="pos-empty-products">
                  <Package size={36} />
                  <p>Không tìm thấy sản phẩm nào trong kho sẵn sàng bán</p>
                </div>
              ) : (
                productPagination.pageItems.map(group => (
                  <div key={group.key} className="pos-product-item" onClick={() => changeProductQuantity(group.asset, 1)}>
                    <div className="pos-item-thumb">
                      <Package size={26} />
                    </div>
                    <div className="pos-item-details">
                      <div className="pos-item-brand">{group.asset.manufacturer}</div>
                      <div className="pos-item-title" title={group.asset.modelName}>{group.asset.modelName}</div>
                      <div className="pos-item-specs">{group.asset.processor || 'Sản phẩm siêu thị mini'} • {group.asset.storage || 'Đơn vị tính'}</div>
                      <div className="pos-item-price">{formatCurrency(group.asset.purchaseCost ?? 0)}</div>
                      <div className="pos-item-specs">Còn {group.assets.length} sản phẩm</div>
                    </div>
                    <button className="pos-add-btn" title="Thêm một sản phẩm vào đơn hàng" aria-label={`Thêm ${group.asset.modelName}`} onClick={event => { event.stopPropagation(); changeProductQuantity(group.asset, 1) }}>
                      <Plus size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
            {availableAssets.length > 0 && (
              <Pagination
                totalItems={productGroups.length}
                page={productPagination.page}
                pageSize={8}
                onPageChange={productPagination.setPage}
              />
            )}
          </div>
        </section>

        {/* CỘT PHẢI: GIỎ HÀNG, KHÁCH HÀNG & THANH TOÁN */}
        <section className="pos-cart-column">
          <div className="pos-column-card">
            {/* THÔNG TIN KHÁCH HÀNG */}
            <div className="pos-section-header">
              <User size={18} />
              <h3>Khách hàng</h3>
            </div>

            <div className="customer-type-toggle">
              <button
                type="button"
                className={`type-toggle-btn ${customerType === 'member' ? 'active' : ''}`}
                onClick={() => setCustomerType('member')}
              >
                Khách thành viên (Có tích điểm)
              </button>
              <button
                type="button"
                className={`type-toggle-btn ${customerType === 'guest' ? 'active' : ''}`}
                onClick={() => setCustomerType('guest')}
              >
                Khách vãng lai (Mua nhanh)
              </button>
            </div>

            {customerType === 'member' ? (
              <div className="member-picker-box">
                <input
                  className="customer-select-dropdown"
                  aria-label="Tìm khách hàng thành viên"
                  placeholder="Tìm khách theo tên hoặc số điện thoại..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                />
                <select
                  className="customer-select-dropdown"
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">-- Chọn khách hàng thành viên ({customers.length} khách) --</option>
                  {matchingCustomers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} - SĐT: {c.phone} - [Hạng {c.membershipTier}]
                    </option>
                  ))}
                </select>

                {selectedCustomer && (
                  <div className={`selected-member-card tier-${selectedCustomer.membershipTier.toLowerCase()}`}>
                    <div className="member-card-row">
                      <strong>{selectedCustomer.fullName}</strong>
                      <span className={`membership-pill ${selectedCustomer.membershipTier.toLowerCase()}`}>
                        Hạng {selectedCustomer.membershipTier === 'GOLD' ? 'VÀNG (-10%)' : selectedCustomer.membershipTier === 'SILVER' ? 'BẠC (-5%)' : 'ĐỒNG (-2%)'}
                      </span>
                    </div>
                    <div className="member-card-sub">
                      <span>SĐT: {selectedCustomer.phone}</span>
                      <span>Đã chi tiêu: {formatCurrency(selectedCustomer.totalSpent)}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="guest-inputs-box">
                <div className="guest-input-row">
                  <label>Tên khách hàng:</label>
                  <input
                    placeholder="Khách vãng lai..."
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                  />
                </div>
                <div className="guest-input-row">
                  <label>Số điện thoại (tùy chọn):</label>
                  <input
                    placeholder="Nhập SĐT để nhận bảo hành..."
                    value={guestPhone}
                    onChange={e => setGuestPhone(e.target.value)}
                  />
                </div>
              </div>
            )}

            <hr className="pos-divider" />

            {/* GIỎ HÀNG */}
            <div className="pos-section-header">
              <ShoppingCart size={18} />
              <h3>Sản phẩm thanh toán ({cart.reduce((sum, item) => sum + item.quantity, 0)})</h3>
            </div>

            <div className="cart-items-list">
              {cart.length === 0 ? (
                <div className="cart-empty-placeholder">
                  <Package size={32} />
                  <p>Chưa có sản phẩm nào được chọn.</p>
                  <small>Chọn sản phẩm từ danh sách bên trái để thêm vào đơn hàng.</small>
                </div>
              ) : (
                cartGroups.map(group => {
                  const item = group.items[0]
                  const quantity = group.items.reduce((sum, selected) => sum + selected.quantity, 0)
                  const availableCount = assets.filter(candidate =>
                    candidate.status === 'AVAILABLE' && productGroupKey(candidate) === group.key,
                  ).length
                  return (
                    <div key={group.key} className="cart-item-row">
                      <div className="cart-item-info">
                        <div className="cart-item-name">{item.asset.modelName}</div>
                        <div className="cart-item-unit">{formatCurrency(item.unitPrice)} / sản phẩm</div>
                      </div>

                      <div className="cart-qty-controls">
                        <button type="button" aria-label={`Giảm số lượng ${item.asset.modelName}`} disabled={processing} onClick={() => changeProductQuantity(item.asset, -1)}>−</button>
                        <span className="cart-qty-number" aria-label={`Số lượng ${item.asset.modelName}`}>{quantity}</span>
                        <button type="button" aria-label={`Tăng số lượng ${item.asset.modelName}`} disabled={processing || quantity >= availableCount} onClick={() => changeProductQuantity(item.asset, 1)}>+</button>
                      </div>

                      <div className="cart-item-sum">
                        {formatCurrency(quantity * item.unitPrice)}
                      </div>

                      <button
                        className="cart-remove-btn"
                        title="Xóa sản phẩm"
                        onClick={() => setCart(current => current.filter(selected => !group.items.some(cartItem => cartItem.asset.id === selected.asset.id)))}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            <hr className="pos-divider" />

            {/* PHƯƠNG THỨC THANH TOÁN */}
            <div className="pos-section-header">
              <CreditCard size={18} />
              <h3>Phương thức thanh toán</h3>
            </div>

            <div className="payment-method-selector">
              <button
                type="button"
                className={`pm-btn ${paymentMethod === 'CASH' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('CASH')}
              >
                <Banknote size={16} /> Tiền mặt
              </button>
              <button
                type="button"
                className={`pm-btn ${paymentMethod === 'BANK_TRANSFER' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
              >
                <QrCode size={16} /> Chuyển khoản QR
              </button>
              <button
                type="button"
                className={`pm-btn ${paymentMethod === 'CARD' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('CARD')}
              >
                <CreditCard size={16} /> Quẹt thẻ POS
              </button>
            </div>

            {/* TÍNH TOÁN VÀ TIỀN THỐI */}
            <div className="pos-calc-box">
              <div className="calc-row">
                <span>Tạm tính ({cart.reduce((a, b) => a + b.quantity, 0)} sản phẩm):</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="calc-row discount-row">
                  <span>Ưu đãi thành viên ({discountRate * 100}%):</span>
                  <span>- {formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="calc-row total-row">
                <span>TỔNG THANH TOÁN:</span>
                <span className="final-price">{formatCurrency(totalAmount)}</span>
              </div>

              {paymentMethod === 'CASH' && (
                <div className="cash-input-group">
                  <div className="calc-row">
                    <label>Tiền khách đưa (VNĐ):</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      aria-label="Tiền khách đưa"
                      placeholder={`Mặc định: trả đủ ${formatCurrency(totalAmount)}`}
                      value={cashGiven}
                      onChange={e => setCashGiven(e.target.value ? Number(e.target.value) : '')}
                    />
                  </div>
                  {typeof cashGiven === 'number' && cashGiven >= totalAmount && (
                    <div className="calc-row change-row">
                      <span>Tiền thối lại cho khách:</span>
                      <strong>{formatCurrency(changeAmount)}</strong>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'CASH' && cashGiven === '' && totalAmount > 0 && (
                <p className="muted">Không nhập tiền khách đưa: hệ thống mặc định khách trả đúng số tiền hóa đơn.</p>
              )}

              {paymentMethod === 'BANK_TRANSFER' && totalAmount > 0 && (
                <div className="qr-preview-box">
                  <div className="qr-code-placeholder">
                    <QrCode size={64} />
                    <span>Thông tin chuyển khoản (không tự xác nhận giao dịch)</span>
                  </div>
                  <div className="qr-guide-text">
                    <p>Chỉ hoàn tất hóa đơn sau khi đã kiểm tra tiền vào tài khoản. Kiểm tra lại thông tin ngân hàng trước khi sử dụng.</p>
                    <p>Ngân hàng: <strong>MBBank</strong></p>
                    <p>Số tài khoản: <strong>0388999999</strong></p>
                    <p>Số tiền: <strong>{formatCurrency(totalAmount)}</strong></p>
                    <p>Nội dung: <strong>THANHTOAN SIÊU THỊ</strong></p>
                  </div>
                </div>
              )}
            </div>

            {/* NÚT HOÀN TẤT THANH TOÁN */}
            <button
              className="btn-complete-checkout"
              disabled={cart.length === 0 || processing}
              onClick={() => void handleCheckout()}
            >
              <CheckCircle2 size={19} />
              <span>{processing ? 'Đang xuất hóa đơn...' : `Thanh toán ${formatCurrency(totalAmount)}`}</span>
            </button>
          </div>
        </section>
      </div>

      {/* MODAL HÓA ĐƠN XUẤT SAU KHI THANH TOÁN */}
      {completedOrder && (
        <div className="modal-backdrop">
          <div className="receipt-modal-card">
            <div className="receipt-header">
              <div className="store-brand">
                <Package size={28} />
                <h2>SIÊU THỊ MINI ĂN VẶT & ĐỒ CHƠI</h2>
              </div>
              <p className="receipt-tagline">HÓA ĐƠN BÁN HÀNG KIÊM PHIẾU BẢO HÀNH</p>
              <div className="receipt-code-pill">Mã HĐ: {completedOrder.orderCode}</div>
            </div>

            <div className="receipt-meta-grid">
              <div><span>Ngày lập:</span> <strong>{new Date().toLocaleString('vi-VN')}</strong></div>
              <div><span>Thu ngân:</span> <strong>{completedOrder.cashierName}</strong></div>
              <div><span>Khách hàng:</span> <strong>{completedOrder.customerName} {completedOrder.isGuest ? '(Vãng lai)' : ''}</strong></div>
              <div><span>Số điện thoại:</span> <strong>{completedOrder.customerPhone || 'N/A'}</strong></div>
              <div><span>Phương thức:</span> <strong>{completedOrder.paymentMethod === 'CASH' ? 'Tiền mặt' : completedOrder.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản QR' : 'Thẻ POS'}</strong></div>
            </div>

            <hr className="receipt-dashed" />

            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th style={{ textAlign: 'center' }}>SL</th>
                  <th style={{ textAlign: 'right' }}>Đơn giá</th>
                  <th style={{ textAlign: 'right' }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {JSON.parse(completedOrder.itemsJson || '[]').map((it: any, idx: number) => (
                  <tr key={idx}>
                    <td>
                      <strong>{it.modelName}</strong>
                      <div className="receipt-serial-note">Mã: {it.assetCode}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(it.unitPrice)}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <hr className="receipt-dashed" />

            <div className="receipt-summary">
              <div className="receipt-sum-line">
                <span>Tạm tính:</span>
                <span>{formatCurrency(completedOrder.subtotal)}</span>
              </div>
              {completedOrder.discountAmount > 0 && (
                <div className="receipt-sum-line discount">
                  <span>Chiết khấu thành viên:</span>
                  <span>- {formatCurrency(completedOrder.discountAmount)}</span>
                </div>
              )}
              <div className="receipt-sum-line total">
                <span>TỔNG CỘNG ĐÃ THANH TOÁN:</span>
                <span>{formatCurrency(completedOrder.totalAmount)}</span>
              </div>
            </div>

            <div className="receipt-footer-notes">
              <p>Cảm ơn quý khách đã tin tưởng mua sắm!</p>
              <small>Kiểm tra sản phẩm khi nhận hàng • Hỗ trợ đổi trả theo chính sách cửa hàng</small>
            </div>

            <div className="receipt-actions-bar">
              <button className="btn-print" onClick={() => window.print()}>
                <Printer size={16} /> In hóa đơn
              </button>
              <button className="btn-primary" onClick={() => setCompletedOrder(null)}>
                Đóng & Tạo đơn tiếp theo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM LỊCH SỬ ĐƠN HÀNG */}
      {showHistory && (
        <div className="modal-backdrop">
          <div className="history-modal-card">
            <div className="modal-header">
            <h2><History size={20} /> Đơn hàng & yêu cầu website ({historyOrders.length})</h2>
              <button className="close-btn" onClick={() => setShowHistory(false)}><X size={18} /></button>
            </div>
            <div className="history-table-container">
              {historyOrders.length === 0 ? (
                <div className="empty-history"><Receipt size={32} /><p>Chưa có hóa đơn nào được tạo</p></div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Mã HĐ</th>
                      <th>Khách hàng</th>
                      <th>Thu ngân</th>
                      <th>Trạng thái</th>
                      <th>Phương thức</th>
                      <th>Thời gian</th>
                      <th style={{ textAlign: 'right' }}>Tổng tiền</th>
                      <th>Yêu cầu</th>
                      {onMoveOrderToTrash && <th><span className="sr-only">Thao tác</span></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {historyPagination.pageItems.map(ord => (
                      <tr key={ord.id}>
                        <td><strong>{ord.orderCode}</strong></td>
                        <td>
                          {ord.customerName} {ord.isGuest ? <span className="guest-badge">Vãng lai</span> : ''}
                          <div className="sub-text">{ord.customerPhone}</div>
                        </td>
                        <td>{ord.cashierName}</td>
                        <td><span className={`order-status order-status-${(ord.orderStatus || 'COMPLETED').toLowerCase()}`}>{ord.orderStatus === 'PENDING' ? 'Chờ xác nhận' : ord.orderStatus === 'CANCELLED' ? 'Đã từ chối' : ord.paymentMethod === 'PENDING' ? 'Đã xác nhận' : 'Đã hoàn tất'}</span></td>
                        <td>{ord.paymentMethod === 'PENDING' ? 'Yêu cầu website' : ord.paymentMethod === 'CASH' ? 'Tiền mặt' : ord.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Thẻ'}</td>
                        <td>{new Date(ord.createdAt).toLocaleString('vi-VN')}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
                          {formatCurrency(ord.totalAmount)}
                        </td>
                        <td>{ord.orderStatus === 'PENDING' && session.role === 'ADMIN' && <div className="website-order-actions"><button className="button button-primary compact-button" onClick={() => void processWebsiteRequest(ord, 'complete')}>Chốt đơn</button><button className="button button-danger-quiet compact-button" onClick={() => void processWebsiteRequest(ord, 'cancel')}>Từ chối</button></div>}</td>
                        {onMoveOrderToTrash && <td><button className="icon-button trash-row-action" title="Chuyển hóa đơn vào thùng rác" aria-label={`Chuyển ${ord.orderCode} vào thùng rác`} onClick={() => void moveOrderToTrash(ord)}><Trash2 size={15} /></button></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {historyOrders.length > 0 && (
                <Pagination
                  totalItems={historyOrders.length}
                  page={historyPagination.page}
                  pageSize={10}
                  onPageChange={historyPagination.setPage}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
