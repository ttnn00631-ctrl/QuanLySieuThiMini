import { Eye, Package, Plus, Search, Trash2 } from 'lucide-react'
import type { Asset, AssetPage, AssetStatus } from '../types'
import { statusLabel, typeLabel } from '../utils'
import { Pagination } from './Pagination'
import { useState } from 'react'
import type { TrashRecord } from '../types'
import { TrashView } from './TrashView'
import { ManagementViewToggle } from './ManagementViewToggle'

interface AssetsViewProps {
  page: AssetPage | null
  search: string
  status: string
  manufacturer: string
  loading: boolean
  canManage: boolean
  onSearch: (value: string) => void
  onStatus: (value: string) => void
  onManufacturer: (value: string) => void
  onCreate: () => void
  onSelect: (asset: Asset) => void
  onPage: (page: number) => void
  onMoveToTrash: (id: number) => void
  trashItems: TrashRecord[]
  trashLoading: boolean
  onRestoreTrashItem: (id: number) => Promise<void>
  onDeleteTrashItem: (id: number) => Promise<void>
}

const manufacturers = ['Oishi', 'Oreo', 'Poca', 'Cosy', 'Coca-Cola', 'ToyJoy', 'Lego', 'Gấu Bông']

export function AssetsView({ page, search, status, manufacturer, loading, canManage, onSearch, onStatus, onManufacturer, onCreate, onSelect, onPage, onMoveToTrash, trashItems, trashLoading, onRestoreTrashItem, onDeleteTrashItem }: AssetsViewProps) {
  const [showTrash, setShowTrash] = useState(false)
  const trashedAssets = trashItems.filter(item => item.type === 'ASSET')
  return (
    <div className="page-stack">
      <section className="page-heading-row">
        <div>
          <p className="eyebrow">QUẢN LÝ SIÊU THỊ MINI</p>
          <h2>Kho hàng hóa</h2>
          <p className="muted">Quản lý tồn kho, nhập hàng và tình trạng kinh doanh đồ ăn vặt, đồ chơi.</p>
        </div>
        {canManage && <div className="asset-heading-actions"><button className="button button-primary" onClick={onCreate}><Plus size={17} /> Nhập hàng vào kho</button></div>}
      </section>
      {canManage && <ManagementViewToggle archived={showTrash} activeCount={page?.totalElements ?? 0} archivedCount={trashedAssets.length} onChange={setShowTrash} />}
      {showTrash && canManage ? <TrashView items={trashedAssets} loading={trashLoading} types={['ASSET']} onRestore={onRestoreTrashItem} onDeleteForever={onDeleteTrashItem} /> : <>
      <section className="surface inventory-surface">
        <div className="table-toolbar">
          <label className="search-field"><Search size={17} /><input aria-label="Tìm hàng hóa trong kho" placeholder="Mã hàng, tên sản phẩm, vị trí kho..." value={search} onChange={event => onSearch(event.target.value)} /><kbd>/</kbd></label>
          <div className="toolbar-right"><span className="result-count">{page?.totalElements ?? 0} sản phẩm trong kho</span><select aria-label="Lọc thương hiệu" value={manufacturer} onChange={event => onManufacturer(event.target.value)}><option value="">Tất cả thương hiệu</option>{manufacturers.map(brand => <option key={brand} value={brand}>{brand}</option>)}</select><select aria-label="Lọc trạng thái" value={status} onChange={event => onStatus(event.target.value)}><option value="">Tất cả trạng thái</option><option value="AVAILABLE">Trong kho (Sẵn sàng)</option><option value="ASSIGNED">Đã xuất kho</option><option value="MAINTENANCE">Đang kiểm tra sản phẩm</option><option value="RETIRED">Ngừng kinh doanh</option><option value="SOLD">Đã bán</option></select></div>
        </div>
        <div className="table-wrap">
          <table className="asset-table"><thead><tr><th>MÃ SẢN PHẨM</th><th>SẢN PHẨM</th><th>MÔ TẢ SẢN PHẨM</th><th>VỊ TRÍ KỆ HÀNG</th><th>TRẠNG THÁI</th><th><span className="sr-only">Chi tiết</span></th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={6}><div className="table-message">Đang tải danh sách kho...</div></td></tr>}
              {!loading && page?.content.length === 0 && <tr><td colSpan={6}><div className="table-message">Không tìm thấy sản phẩm nào trong kho.</div></td></tr>}
              {!loading && page?.content.map((asset: Asset) => {
                const Icon = Package
                return <tr key={asset.id}>
                  <td><span className="asset-code">{asset.assetCode}</span><small className="cell-secondary">{asset.serialNumber ? `Mã lô: ${asset.serialNumber}` : ''}</small></td>
                  <td><span className="device-cell"><span className="device-icon"><Icon size={16} /></span><span><strong>{asset.manufacturer} {asset.modelName}</strong><small>{typeLabel(asset.type)}</small></span></span></td>
                  <td><span className="cell-primary">{asset.processor || 'Sản phẩm siêu thị'}</span><small className="cell-secondary">{asset.memoryGb != null ? `${asset.memoryGb} ${asset.storage || 'sản phẩm'}` : 'Chưa cập nhật số lượng'}</small></td>
                  <td><span className="cell-primary">{asset.assigneeName || asset.location}</span><small className="cell-secondary">{asset.assigneeName ? asset.location : 'Chưa xuất kho'}</small></td>
                  <td><span className={`status-badge status-${asset.status.toLowerCase()}`}><span />{statusLabel(asset.status as AssetStatus)}</span></td>
                  <td><div className="asset-row-actions"><button className="icon-button row-action" title="Xem chi tiết" aria-label={`Xem ${asset.assetCode}`} onClick={() => onSelect(asset)}><Eye size={16} /></button>{canManage && <button className="icon-button row-action trash-row-action" title="Chuyển vào thùng rác" aria-label={`Chuyển ${asset.assetCode} vào thùng rác`} onClick={() => { if (window.confirm(`Chuyển sản phẩm ${asset.assetCode} vào thùng rác?`)) onMoveToTrash(asset.id) }}><Trash2 size={15} /></button>}</div></td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
        <Pagination
          className="table-footer"
          totalItems={page?.totalElements ?? 0}
          page={page?.number ?? 0}
          pageSize={page?.size ?? 10}
          onPageChange={onPage}
        />
      </section>
      </>}
    </div>
  )
}