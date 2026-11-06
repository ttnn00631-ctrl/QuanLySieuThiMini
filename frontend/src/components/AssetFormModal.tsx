import { X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { Asset, AssetInput, AssetType } from '../types'
import { typeLabel } from '../utils'

interface AssetFormModalProps { asset: Asset | null; onClose: () => void; onSave: (input: AssetInput) => Promise<void> }
const emptyAsset: AssetInput = { assetCode: '', serialNumber: '', type: 'SNACK', manufacturer: '', modelName: '', processor: '', memoryGb: 0, storage: 'Gói', screenSizeInch: null, refreshRateHz: null, usbPorts: '', hasHeadphoneJack: null, hasDedicatedGraphics: null, purchaseDate: null, warrantyUntil: null, purchaseCost: null, location: 'Kệ hàng', notes: '' }

export function AssetFormModal({ asset, onClose, onSave }: AssetFormModalProps) {
  const [form, setForm] = useState<AssetInput>(asset ? { assetCode: asset.assetCode, serialNumber: asset.serialNumber ?? '', type: asset.type, manufacturer: asset.manufacturer, modelName: asset.modelName, processor: asset.processor ?? '', memoryGb: asset.memoryGb, storage: asset.storage ?? 'Gói', screenSizeInch: null, refreshRateHz: null, usbPorts: '', hasHeadphoneJack: null, hasDedicatedGraphics: null, purchaseDate: asset.purchaseDate, warrantyUntil: asset.warrantyUntil, purchaseCost: asset.purchaseCost, location: asset.location, notes: asset.notes ?? '' } : emptyAsset)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  function update<K extends keyof AssetInput>(key: K, value: AssetInput[K]) { setForm(current => ({ ...current, [key]: value })) }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setError(''); try { await onSave(form); onClose() } catch (exception) { setError(exception instanceof Error ? exception.message : 'Không lưu được sản phẩm') } finally { setSaving(false) } }
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="modal-card asset-form-modal" role="dialog" aria-modal="true" aria-labelledby="asset-form-title">
      <header className="modal-header"><div><p className="eyebrow">THÔNG TIN HÀNG HÓA</p><h2 id="asset-form-title">{asset ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h2></div><button className="icon-button" aria-label="Đóng" onClick={onClose}><X size={19} /></button></header>
      <form onSubmit={submit}><div className="form-grid">
        <label><span>Mã sản phẩm <b>*</b></span><input value={form.assetCode} onChange={e => update('assetCode', e.target.value)} required maxLength={40} placeholder="VD: SNK-001" /></label>
        <label><span>Danh mục <b>*</b></span><select value={form.type} onChange={e => update('type', e.target.value as AssetType)}>{(['SNACK','TOY','DRINK','ACCESSORY','OTHER'] as AssetType[]).map(type => <option key={type} value={type}>{typeLabel(type)}</option>)}</select></label>
        <label><span>Thương hiệu <b>*</b></span><input value={form.manufacturer} onChange={e => update('manufacturer', e.target.value)} required maxLength={100} placeholder="Oishi, Oreo, ToyJoy..." /></label>
        <label><span>Tên sản phẩm <b>*</b></span><input value={form.modelName} onChange={e => update('modelName', e.target.value)} required maxLength={120} placeholder="Snack khoai tây, gấu bông..." /></label>
        <label><span>Số lượng <b>*</b></span><input type="number" min="0" value={form.memoryGb ?? 0} onChange={e => update('memoryGb', Number(e.target.value))} required /></label>
        <label><span>Đơn vị tính</span><input value={form.storage ?? ''} onChange={e => update('storage', e.target.value)} placeholder="Gói, chai, hộp, cái..." /></label>
        <label><span>Giá bán (VND)</span><input type="number" min="0" step="500" value={form.purchaseCost ?? ''} onChange={e => update('purchaseCost', e.target.value ? Number(e.target.value) : null)} /></label>
        <label><span>Ngày nhập hàng</span><input type="date" value={form.purchaseDate ?? ''} onChange={e => update('purchaseDate', e.target.value || null)} /></label>
        <label><span>Hạn sử dụng</span><input type="date" value={form.warrantyUntil ?? ''} onChange={e => update('warrantyUntil', e.target.value || null)} /></label>
        <label><span>Vị trí kệ hàng <b>*</b></span><input value={form.location} onChange={e => update('location', e.target.value)} required maxLength={120} placeholder="Kệ đồ ăn vặt A1" /></label>
        <label className="span-2"><span>Mô tả sản phẩm</span><textarea rows={3} value={form.processor ?? ''} onChange={e => update('processor', e.target.value)} maxLength={300} placeholder="Mô tả ngắn về sản phẩm..." /></label>
        <label className="span-2"><span>Ghi chú</span><textarea rows={2} value={form.notes ?? ''} onChange={e => update('notes', e.target.value)} maxLength={1000} /></label>
      </div>{error && <p className="form-error" role="alert">{error}</p>}<footer className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Hủy</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu sản phẩm'}</button></footer></form>
    </section></div>
}
