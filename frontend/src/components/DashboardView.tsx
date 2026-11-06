import { ArrowUpRight, Package, Wrench } from 'lucide-react'
import type { Asset, DashboardSummary } from '../types'
import { statusLabel, typeLabel } from '../utils'

interface DashboardViewProps {
  summary: DashboardSummary | null
  recentAssets: Asset[]
  onOpenAssets: () => void
}

const breakdown = [
  { key: 'available', label: 'Còn hàng', tone: 'green' },
  { key: 'assigned', label: 'Đã xuất hàng', tone: 'blue' },
  { key: 'maintenance', label: 'Kiểm tra sản phẩm', tone: 'orange' },
  { key: 'retired', label: 'Ngừng kinh doanh', tone: 'gray' },
] as const

export function DashboardView({ summary, recentAssets, onOpenAssets }: DashboardViewProps) {
  const total = summary?.total ?? 0
  const stats = [
    { label: 'Tổng sản phẩm', value: summary?.total, icon: Package, tone: 'ink', note: 'Trong toàn hệ thống' },
    { label: 'Còn hàng', value: summary?.available, icon: Package, tone: 'green', note: 'Có thể bán ngay' },
    { label: 'Đã xuất hàng', value: summary?.assigned, icon: ArrowUpRight, tone: 'blue', note: 'Đã xuất cho khách' },
    { label: 'Đang kiểm tra sản phẩm', value: summary?.maintenance, icon: Wrench, tone: 'orange', note: 'Cần kiểm tra hàng hóa' },
  ]

  return (
    <div className="page-stack">
      <section className="welcome-strip">
        <div><p className="eyebrow">TỔNG QUAN SIÊU THỊ</p><h2>Tổng quan siêu thị</h2><p className="muted">Tình hình hàng ăn vặt và đồ chơi trong siêu thị.</p></div>
        <div className="welcome-date"><span>HÔM NAY</span><strong>{new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())}</strong></div>
      </section>

      <section className="stat-grid" aria-label="Chỉ số hàng hóa">
        {stats.map(({ label, value, icon: Icon, tone, note }, index) => (
          <article className={`stat-card stat-${tone} reveal reveal-${index + 1}`} key={label}>
            <div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={17} /></span></div>
            <strong className="stat-value">{value ?? '—'}</strong>
            <span className="stat-note">{note}</span>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="surface breakdown-panel">
          <div className="section-heading"><div><p className="eyebrow">PHÂN BỔ</p><h3>Tình trạng hàng hóa</h3></div><span className="total-chip">{total} sản phẩm</span></div>
          <div className="breakdown-bar" aria-label="Biểu đồ phân bổ">
            {breakdown.map(item => <span key={item.key} className={`bar-segment ${item.tone}`} style={{ width: `${total ? ((summary?.[item.key] ?? 0) / total) * 100 : 0}%` }} />)}
          </div>
          <div className="breakdown-rows">
            {breakdown.map(item => {
              const value = summary?.[item.key] ?? 0
              return <div className="breakdown-row" key={item.key}><span className={`legend-dot ${item.tone}`} /><span>{item.label}</span><strong>{value}</strong><span className="breakdown-percent">{total ? Math.round(value / total * 100) : 0}%</span></div>
            })}
          </div>
        </article>

        <article className="surface recent-panel">
          <div className="section-heading"><div><p className="eyebrow">CẬP NHẬT GẦN ĐÂY</p><h3>Sản phẩm mới nhập</h3></div><button className="text-button" onClick={onOpenAssets}>Tất cả <ArrowUpRight size={15} /></button></div>
          <div className="recent-list">
            {recentAssets.length === 0 ? <div className="empty-inline">Chưa có dữ liệu hàng hóa.</div> : recentAssets.map(asset => {
              const Icon = Package
              return <div className="recent-item" key={asset.id}><span className="device-icon"><Icon size={16} /></span><span className="recent-main"><strong>{asset.assetCode}</strong><small>{asset.manufacturer} {asset.modelName}</small></span><span className={`status-badge status-${asset.status.toLowerCase()}`}>{statusLabel(asset.status)}</span><span className="recent-type">{typeLabel(asset.type)}</span></div>
            })}
          </div>
        </article>
      </section>
    </div>
  )
}