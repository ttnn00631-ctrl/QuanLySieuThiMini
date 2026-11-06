import type {
  AppUser,
  Asset,
  AssetInput,
  AssetPage,
  Assignment,
  CreateSaleOrderRequest,
  CreateStoreOrderRequest,
  CustomerAccount,
  CustomerSession,
  DashboardSummary,
  MaintenanceItem,
  Role,
  Session,
  StoreProduct,
  CustomerRepairRequestInput,
  CustomerRepairRequestItem,
  ProductBrand,
  TrashRecord,
} from './types'

type ViteImportMeta = ImportMeta & { readonly env: { readonly VITE_API_URL?: string } }

const API_BASE = (import.meta as ViteImportMeta).env.VITE_API_URL ?? '/api'
let token: string | null = null

export function setApiToken(value: string | null) {
  token = value
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (response.status === 204) return undefined as T
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.message ?? 'Không thể kết nối máy chủ')
  return body as T
}

export const api = {
  login: (username: string, password: string) => request<Session>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),
  registerStoreAccount: (input: { username: string; displayName: string; password: string }) =>
    request<CustomerSession>('/store/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  loginStoreAccount: (username: string, password: string) =>
    request<CustomerSession>('/store/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  storeAccount: () => request<CustomerAccount>('/store/account'),
  updateStoreAccount: (input: { displayName: string; email: string; phone: string }) =>
    request<CustomerAccount>('/store/account', { method: 'PUT', body: JSON.stringify(input) }),
  storeAccounts: () => request<CustomerAccount[]>('/store/accounts'),
  updateStoreAccountAsAdmin: (id: number, input: {
    displayName: string; email: string; phone: string; enabled: boolean; password?: string
  }) => request<CustomerAccount>(`/store/accounts/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  dashboard: () => request<DashboardSummary>('/dashboard'),
  assets: (search: string, status: string, page = 0, size = 10, manufacturer = '') => {
    const params = new URLSearchParams({ page: String(page), size: String(size), sort: 'id,desc' })
    if (search.trim()) params.set('search', search.trim())
    if (status) params.set('status', status)
    if (manufacturer) params.set('manufacturer', manufacturer)
    return request<AssetPage>(`/assets?${params}`)
  },
  allAssets: async () => {
    const assets: Asset[] = []
    let page = 0
    let totalPages = 1
    while (page < totalPages) {
      const result = await api.assets('', '', page, 200)
      assets.push(...result.content)
      totalPages = result.totalPages
      page += 1
    }
    return assets
  },
  productBrands: () => request<ProductBrand[]>('/product-brands'),
  createProductBrand: (name: string) =>
    request<ProductBrand>('/product-brands', { method: 'POST', body: JSON.stringify({ name }) }),
  updateProductBrand: (id: number, name: string) =>
    request<ProductBrand>(`/product-brands/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  createAsset: (asset: AssetInput) => request<Asset>('/assets', {
    method: 'POST', body: JSON.stringify(asset),
  }),
  updateAsset: (id: number, asset: AssetInput) => request<Asset>(`/assets/${id}`, {
    method: 'PUT', body: JSON.stringify(asset),
  }),
  retireAsset: (id: number) => request<void>(`/assets/${id}`, { method: 'DELETE' }),
  assignments: (assetId: number) => request<Assignment[]>(`/assets/${assetId}/assignments`),
  assign: (assetId: number, assigneeName: string, location: string, note: string) =>
    request<Asset>(`/assets/${assetId}/assignments`, {
      method: 'POST', body: JSON.stringify({ assigneeName, location, note }),
    }),
  returnAsset: (assetId: number, note: string) => request<Asset>(`/assets/${assetId}/assignments/return`, {
    method: 'POST', body: JSON.stringify({ note }),
  }),
  maintenance: () => request<MaintenanceItem[]>('/maintenance'),
  assetMaintenance: (assetId: number) => request<MaintenanceItem[]>(`/assets/${assetId}/maintenance`),
  openMaintenance: (assetId: number, issue: string) => request<MaintenanceItem>(`/assets/${assetId}/maintenance`, {
    method: 'POST', body: JSON.stringify({ issue }),
  }),
  closeMaintenance: (id: number, resolutionNote: string) => request<MaintenanceItem>(`/maintenance/${id}/close`, {
    method: 'PATCH', body: JSON.stringify({ resolutionNote }),
  }),
  users: () => request<AppUser[]>('/users'),
  createUser: (user: { username: string; displayName: string; password: string; role: Role }) =>
    request<AppUser>('/users', { method: 'POST', body: JSON.stringify(user) }),
  updateUser: (id: number, user: { displayName: string; role: Role; enabled: boolean; password?: string }) =>
    request<AppUser>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(user) }),
  deleteUser: (id: number) => request<void>(`/users/${id}`, { method: 'DELETE' }),
  customers: (search = '', tier = '') => {
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())
    if (tier && tier !== 'ALL') params.set('tier', tier)
    return request<import('./types').Customer[]>(`/customers?${params}`)
  },
  createCustomer: (customer: import('./types').CustomerInput) =>
    request<import('./types').Customer>('/customers', { method: 'POST', body: JSON.stringify(customer) }),
  updateCustomer: (id: number, customer: Partial<import('./types').Customer>) =>
    request<import('./types').Customer>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(customer) }),
  deleteCustomer: (id: number) =>
    request<void>(`/customers/${id}`, { method: 'DELETE' }),
  moveOrderToTrash: (id: number) => api.moveToTrash('ORDER', id),
  reviews: (rating?: number) => {
    const query = rating ? `?rating=${rating}` : ''
    return request<import('./types').ProductReview[]>(`/reviews${query}`)
  },
  replyReview: (id: number, reply: string) =>
    request<import('./types').ProductReview>(`/reviews/${id}/reply`, { method: 'PATCH', body: JSON.stringify({ reply }) }),
  orders: () => request<import('./types').SaleOrder[]>('/orders'),
  createOrder: (order: CreateSaleOrderRequest) =>
    request<import('./types').SaleOrder>('/orders', { method: 'POST', body: JSON.stringify(order) }),
  storeProducts: () => request<StoreProduct[]>('/store/products'),
  recordStoreProductView: (id: number) =>
    request<number>(`/store/products/${id}/view`, { method: 'POST' }),
  createStoreRepairRequest: (input: CustomerRepairRequestInput) =>
    request<CustomerRepairRequestItem>('/store/repair-requests', { method: 'POST', body: JSON.stringify(input) }),
  customerRepairRequests: () =>
    request<CustomerRepairRequestItem[]>('/maintenance/customer-requests'),
  closeCustomerRepairRequest: (id: number, resolutionNote: string) =>
    request<CustomerRepairRequestItem>(`/maintenance/customer-requests/${id}/close`, {
      method: 'PATCH',
      body: JSON.stringify({ resolutionNote }),
    }),
  createStoreRequest: (requestData: CreateStoreOrderRequest) =>
    request<import('./types').SaleOrder>('/store/requests', { method: 'POST', body: JSON.stringify(requestData) }),
  completeWebsiteRequest: (id: number) =>
    request<import('./types').SaleOrder>(`/orders/${id}/complete-request`, { method: 'POST' }),
  cancelWebsiteRequest: (id: number) =>
    request<import('./types').SaleOrder>(`/orders/${id}/cancel-request`, { method: 'POST' }),
  trash: () => request<TrashRecord[]>('/trash'),
  moveToTrash: (type: TrashRecord['type'], id: number) =>
    request<TrashRecord>('/trash', { method: 'POST', body: JSON.stringify({ type, id }) }),
  restoreTrashItem: (id: number) =>
    request<void>(`/trash/${id}/restore`, { method: 'PATCH' }),
  deleteTrashItem: (id: number) =>
    request<void>(`/trash/${id}`, { method: 'DELETE' }),
}