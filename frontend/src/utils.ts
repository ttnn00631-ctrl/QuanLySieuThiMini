import type { AssetStatus, AssetType } from './types'

export function statusLabel(status: AssetStatus) {
  return ({ AVAILABLE: 'Còn hàng', ASSIGNED: 'Đã xuất hàng', MAINTENANCE: 'Chờ xử lý', RETIRED: 'Ngừng kinh doanh', SOLD: 'Đã bán' })[status]
}

export function typeLabel(type: AssetType) {
  return ({ TOY: 'Đồ chơi', SNACK: 'Đồ ăn vặt', DRINK: 'Nước uống', ACCESSORY: 'Phụ kiện đồ chơi', OTHER: 'Sản phẩm khác' })[type]
}

export function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) : '—'
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function formatCurrency(value: number | null) {
  return value == null ? '—' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

// Ảnh chụp sản phẩm thực tế dùng cho cửa hàng. Nếu sau này nhân viên tải ảnh riêng
// lên sản phẩm (imageUrl), ảnh riêng sẽ được ưu tiên; bỏ qua các đường dẫn SVG cũ.
const REAL_PRODUCT_PHOTOS = {
  SNACK: 'https://fmcgnepal.com/images/snacks.webp',
  DRINK: 'https://p2.trrsf.com/image/fget/cf/940/0/images.terra.com/2023/07/02/reflejo_pag1-t8cxsnqdz0vr.jpg',
  TOY: 'https://igrashky24.com.ua/image/catalog/categori/ihrashky.png',
  ACCESSORY: 'https://igrashky24.com.ua/image/catalog/categori/ihrashky.png',
  OTHER: 'https://altawfeermarket.com/assets/images/1775260496_2887.png',
} as const

export function productImageFor(product: { manufacturer: string; imageUrl?: string | null; type?: string }) {
  const savedImage = product.imageUrl?.trim()
  if (savedImage && !/\.(svg)(\?.*)?$/i.test(savedImage) && (/^https?:\/\//i.test(savedImage) || /^\/uploads\//i.test(savedImage))) {
    return savedImage
  }
  const type = (product.type ?? 'OTHER') as keyof typeof REAL_PRODUCT_PHOTOS
  return REAL_PRODUCT_PHOTOS[type] ?? REAL_PRODUCT_PHOTOS.OTHER
}
