import { useMemo, useState, type FormEvent } from 'react'
import { ArchiveRestore, Edit2, Package, Plus, ShoppingCart, Search, Layers, Eye, Tag, Trash2, X } from 'lucide-react'
import type { Asset, ProductBrand, TrashRecord } from '../types'
import { formatCurrency, productImageFor } from '../utils'
import { Pagination, usePagination } from './Pagination'
import { TrashView } from './TrashView'

interface BrandCatalogViewProps {
  assets: Asset[]
  brands: ProductBrand[]
  loading: boolean
  onSelectForCheckout: (asset: Asset) => void
  onViewDetail: (asset: Asset) => void
  trashItems: TrashRecord[]
  trashLoading: boolean
  onCreateBrand: (name: string) => Promise<void>
  onUpdateBrand: (id: number, name: string) => Promise<void>
  onMoveBrandToTrash: (id: number) => Promise<void>
  onRestoreTrashItem: (id: number) => Promise<void>
  onDeleteTrashItem: (id: number) => Promise<void>
}

export function BrandCatalogView({
  assets, brands, loading, onSelectForCheckout, onViewDetail,
  trashItems, trashLoading, onCreateBrand, onUpdateBrand, onMoveBrandToTrash,
  onRestoreTrashItem, onDeleteTrashItem,
}: BrandCatalogViewProps) {
  const [selectedBrand, setSelectedBrand] = useState('Tất cả')
  const [searchTerm, setSearchTerm] = useState('')
  const [manageOpen, setManageOpen] = useState(false)
  const [trashOpen, setTrashOpen] = useState(false)
  const [brandName, setBrandName] = useState('')
  const [editingBrand, setEditingBrand] = useState<ProductBrand | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const activeTrashCount = trashItems.filter(item => item.type === 'BRAND').length

  const filteredAssets = assets.filter(item => {
    const matchesBrand = selectedBrand === 'Tất cả' || item.manufacturer.toLowerCase() === selectedBrand.toLowerCase()
    const term = searchTerm.trim().toLowerCase()
    const matchesSearch = !term || item.modelName.toLowerCase().includes(term) ||
      item.assetCode.toLowerCase().includes(term) || item.manufacturer.toLowerCase().includes(term)
    return matchesBrand && matchesSearch
  })
  const pagination = usePagination(filteredAssets, 9)
  const brandCounts = useMemo(() => {
    const counts = new Map(brands.map(brand => [brand.name, 0]))
    for (const asset of assets) counts.set(asset.manufacturer, (counts.get(asset.manufacturer) ?? 0) + 1)
    return counts
  }, [assets, brands])

  function beginEdit(brand: ProductBrand) {
    setEditingBrand(brand)
    setBrandName(brand.name)
    setMessage('')
  }

  function resetForm() {
    setEditingBrand(null)
    setBrandName('')
  }

  async function saveBrand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = brandName.trim()
    if (!name) {
      setMessage('Vui lòng nhập tên thương hiệu.')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      if (editingBrand) {
        await onUpdateBrand(editingBrand.id, name)
        if (selectedBrand === editingBrand.name) setSelectedBrand(name)
      } else await onCreateBrand(name)
      resetForm()
      setMessage(editingBrand ? 'Đã cập nhật thương hiệu sản phẩm.' : 'Đã thêm thương hiệu sản phẩm.')
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : 'Không thể lưu thương hiệu sản phẩm.')
    } finally {
      setSaving(false)
    }
  }

  async function moveBrandToTrash(brand: ProductBrand) {
    if (!window.confirm(`Chuyển thương hiệu "${brand.name}" vào thùng rác? Các sản phẩm hiện có được giữ nguyên.`)) return
    setMessage('')
    try {
      await onMoveBrandToTrash(brand.id)
      if (selectedBrand === brand.name) setSelectedBrand('Tất cả')
      setMessage(`Đã chuyển thương hiệu ${brand.name} vào thùng rác.`)
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : 'Không thể chuyển hãng vào thùng rác.')
    }
  }

  return (
    <div className="brand-catalog-view">
      <div className="view-header">
        <div>
          <h1 className="view-title">Danh mục sản phẩm</h1>
          <p className="view-subtitle">Quản lý thương hiệu đồ ăn vặt, đồ chơi và sản phẩm trong kho</p>
        </div>
        <div className="catalog-header-actions">
          <button className="button button-secondary" onClick={() => { setManageOpen(value => !value); setTrashOpen(false); setMessage('') }}>
            <Tag size={16} /> {manageOpen ? 'Đóng quản lý danh mục' : 'Quản lý danh mục'}
          </button>
          <button className="button button-secondary" onClick={() => { setTrashOpen(value => !value); setManageOpen(false); setMessage('') }}>
            <ArchiveRestore size={16} /> Thùng rác ({activeTrashCount})
          </button>
          {!manageOpen && !trashOpen && <div className="catalog-search-bar">
            <Search size={16} />
            <input
              aria-label="Tìm sản phẩm trong danh mục"
              placeholder="Tìm theo tên hàng, thương hiệu, mã sản phẩm..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); pagination.setPage(0) }}
            />
          </div>}
        </div>
      </div>

      {manageOpen ? (
        <section className="surface brand-management-panel">
          <div className="brand-management-heading">
            <div><h2>Quản lý thương hiệu sản phẩm</h2><p>Thêm thương hiệu mới hoặc đổi tên/xóa hãng hiện có. Sản phẩm được giữ nguyên khi hãng chuyển vào thùng rác.</p></div>
            <button type="button" className="icon-action-btn" aria-label="Đóng quản lý danh mục" onClick={() => { setManageOpen(false); resetForm() }}><X size={17} /></button>
          </div>
          <form className="brand-management-form" onSubmit={event => void saveBrand(event)}>
            <label htmlFor="product-brand-name">{editingBrand ? `Sửa thương hiệu: ${editingBrand.name}` : 'Tên thương hiệu mới'}</label>
            <input id="product-brand-name" maxLength={100} value={brandName} onChange={event => setBrandName(event.target.value)} placeholder="Ví dụ: Oishi, Oreo, Skittles, ToyJoy..." />
            <button className="button button-primary" type="submit" disabled={saving}>{editingBrand ? <Edit2 size={15} /> : <Plus size={16} />}{saving ? 'Đang lưu...' : editingBrand ? 'Lưu thay đổi' : 'Thêm thương hiệu'}</button>
            {editingBrand && <button className="button button-secondary" type="button" onClick={resetForm}>Hủy sửa</button>}
          </form>
          {message && <p className="brand-management-message" role="status">{message}</p>}
          {brands.length === 0 ? <div className="trash-empty"><Tag size={28} /><strong>Chưa có thương hiệu sản phẩm</strong><span>Thêm thương hiệu đầu tiên bằng biểu mẫu phía trên.</span></div> : (
            <div className="brand-management-list">
              {brands.map(brand => (
                <article className="brand-management-row" key={brand.id}>
                  <span className="brand-management-name"><Tag size={16} /><strong>{brand.name}</strong><small>{brandCounts.get(brand.name) ?? 0} sản phẩm</small></span>
                  <div className="brand-management-actions">
                    <button className="button button-secondary compact-button" onClick={() => beginEdit(brand)}><Edit2 size={14} /> Sửa</button>
                    <button className="button button-danger-quiet compact-button" onClick={() => void moveBrandToTrash(brand)}><Trash2 size={14} /> Xóa</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : trashOpen ? (
        <TrashView items={trashItems} loading={trashLoading} types={['BRAND']} onRestore={onRestoreTrashItem} onDeleteForever={onDeleteTrashItem} />
      ) : (
        <>
          <div className="brand-pills-container">
            {['Tất cả', ...brands.map(brand => brand.name)].map(brand => (
              <button
                key={brand}
                className={`brand-pill-btn ${selectedBrand === brand ? 'active' : ''}`}
                onClick={() => { setSelectedBrand(brand); pagination.setPage(0) }}
              >
                <Package size={15} />
                <span>{brand}</span>
                <span className="brand-count-badge">{brand === 'Tất cả' ? assets.length : brandCounts.get(brand) ?? 0}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-card"><div className="loading-dot" /> Đang tải danh mục sản phẩm...</div>
          ) : filteredAssets.length === 0 ? (
            <div className="empty-catalog-card">
              <Package size={48} className="empty-icon" />
              <h3>Không tìm thấy sản phẩm phù hợp</h3>
              <p>Thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác.</p>
            </div>
          ) : (
            <div className="product-cards-grid">
              {pagination.pageItems.map(asset => {
                const isAvailable = asset.status === 'AVAILABLE'
                return (
                  <div key={asset.id} className="product-catalog-card">
                    <div className="card-top-badge">
                      <span className="brand-tag">{asset.manufacturer}</span>
                      <span className={`status-badge-mini ${isAvailable ? 'available' : 'busy'}`}>{isAvailable ? 'Còn hàng' : 'Đang xuất kho'}</span>
                    </div>
                    <div className="product-hero-icon">
                      <img className="product-brand-image" src={productImageFor({ manufacturer: asset.manufacturer, type: asset.type })} alt={`${asset.manufacturer} ${asset.modelName}`} loading="lazy" />
                      <span className="product-code-tag">{asset.assetCode}</span>
                    </div>
                    <div className="product-main-info">
                      <h3 className="product-model-name" title={asset.modelName}>{asset.modelName}</h3>
                      <div className="product-specs-list">
                        <div className="spec-item"><Package size={13} /> <span>{asset.processor || 'Mô tả sản phẩm'}</span></div>
                        <div className="spec-item"><Layers size={13} /> <span>{asset.memoryGb ?? 0} sản phẩm</span></div>
                        <div className="spec-item"><Layers size={13} /> <span>{asset.storage || 'Đơn vị bán lẻ'}</span></div>
                      </div>
                    </div>
                    <div className="product-card-footer">
                      <div className="price-box"><span className="price-label">Giá niêm yết</span><span className="price-value">{formatCurrency(asset.purchaseCost)}</span></div>
                      <div className="card-actions">
                        <button className="icon-action-btn" title="Xem chi tiết thông tin sản phẩm" onClick={() => onViewDetail(asset)}><Eye size={16} /></button>
                        <button className="btn-add-checkout" disabled={!isAvailable} onClick={() => onSelectForCheckout(asset)} title={isAvailable ? 'Chọn mua sản phẩm này' : 'Sản phẩm tạm thời hết trong kho'}>
                          <ShoppingCart size={15} /><span>{isAvailable ? 'Mua ngay' : 'Hết hàng'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {!loading && filteredAssets.length > 0 && <Pagination totalItems={filteredAssets.length} page={pagination.page} pageSize={9} onPageChange={pagination.setPage} />}
        </>
      )}
    </div>
  )
}
