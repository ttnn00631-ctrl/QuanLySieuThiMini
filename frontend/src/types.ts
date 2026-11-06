export type Role = 'ADMIN' | 'STAFF' | 'CASHIER' | 'FIXER'
export type CustomerRole = 'CUSTOMER'
export type AssetStatus = 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED' | 'SOLD'
export type AssetType = 'TOY' | 'SNACK' | 'DRINK' | 'ACCESSORY' | 'OTHER'

export interface Session {
  token: string
  username: string
  displayName: string
  role: Role
}

export type MembershipTier = 'BRONZE' | 'SILVER' | 'GOLD'

export interface Customer {
  id: number
  fullName: string
  phone: string
  email: string | null
  address: string | null
  membershipTier: MembershipTier
  totalSpent: number
  ordersCount: number
  joinedDate: string | null
}

export interface CustomerInput {
  fullName: string
  phone: string
  email?: string
  address?: string
  membershipTier: MembershipTier
}

export interface ProductReview {
  id: number
  customerName: string
  productName: string
  rating: number
  comment: string
  createdAt: string
  adminReply: string | null
}

export interface CartItem {
  asset: Asset
  quantity: number
  unitPrice: number
}

export interface SaleOrder {
  id: number
  orderCode: string
  customerName: string
  customerPhone: string | null
  isGuest: boolean
  cashierName: string
  subtotal: number
  discountAmount: number
  totalAmount: number
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'PENDING'
  orderStatus: 'PENDING' | 'COMPLETED' | 'CANCELLED'
  itemsJson: string
  createdAt: string
}

export interface CreateSaleOrderRequest {
  customerId: number | null
  guest: boolean
  guestName: string
  guestPhone: string
  paymentMethod: SaleOrder['paymentMethod']
  cashReceived: number | null
  items: Array<{ assetId: number; quantity: 1 }>
}

export interface Asset {
  id: number
  assetCode: string
  serialNumber: string | null
  type: AssetType
  manufacturer: string
  modelName: string
  processor: string | null
  memoryGb: number | null
  storage: string | null
  screenSizeInch: number | null
  refreshRateHz: number | null
  usbPorts: string | null
  hasHeadphoneJack: boolean | null
  hasDedicatedGraphics: boolean | null
  purchaseDate: string | null
  warrantyUntil: string | null
  purchaseCost: number | null
  location: string
  assigneeName: string | null
  status: AssetStatus
  notes: string | null
}

export interface ProductBrand {
  id: number
  name: string
}

export interface StoreProduct {
  id: number
  assetCode: string
  type: AssetType
  status: AssetStatus
  manufacturer: string
  modelName: string
  imageUrl: string | null
  processor: string | null
  memoryGb: number | null
  storage: string | null
  screenSizeInch: number | null
  refreshRateHz: number | null
  usbPorts: string | null
  hasHeadphoneJack: boolean | null
  hasDedicatedGraphics: boolean | null
  price: number
  viewCount: number
}

export interface CustomerRepairRequestInput {
  deviceType: string
  manufacturer: string
  modelName: string
  serialNumber?: string
  issue: string
}

export interface CustomerRepairRequestItem {
  id: number
  customerName: string
  customerUsername: string
  customerPhone: string
  customerEmail: string | null
  deviceType: string
  manufacturer: string
  modelName: string
  serialNumber: string | null
  issue: string
  openedAt: string
  closedAt: string | null
  resolutionNote: string | null
  status: 'OPEN' | 'CLOSED'
}

export interface CreateStoreOrderRequest {
  assetIds: number[]
}

export interface CustomerSession {
  token: string
  username: string
  displayName: string
  role: CustomerRole
}

export interface CustomerAccount {
  id: number
  username: string
  displayName: string
  email: string | null
  phone: string | null
  enabled: boolean
  createdAt: string
}

export interface TrashRecord {
  id: number
  type: 'ASSET' | 'CUSTOMER' | 'USER' | 'ORDER' | 'BRAND'
  entityId: number
  label: string
  summary: string
  deletedAt: string
  deletedBy: string
}

export interface AssetInput {
  assetCode: string
  serialNumber: string
  type: AssetType
  manufacturer: string
  modelName: string
  processor: string
  memoryGb: number | null
  storage: string
  screenSizeInch: number | null
  refreshRateHz: number | null
  usbPorts: string
  hasHeadphoneJack: boolean | null
  hasDedicatedGraphics: boolean | null
  purchaseDate: string | null
  warrantyUntil: string | null
  purchaseCost: number | null
  location: string
  notes: string
}

export interface AssetPage {
  content: Asset[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface DashboardSummary {
  total: number
  available: number
  assigned: number
  maintenance: number
  retired: number
}

export interface Assignment {
  id: number
  assigneeName: string
  location: string
  assignedAt: string
  returnedAt: string | null
  note: string | null
  returnNote: string | null
}

export interface MaintenanceItem {
  id: number
  assetId: number
  assetCode: string
  issue: string
  openedAt: string
  closedAt: string | null
  resolutionNote: string | null
  status: 'OPEN' | 'CLOSED'
}

export interface AppUser {
  id: number
  username: string
  displayName: string
  role: Role
  enabled: boolean
}