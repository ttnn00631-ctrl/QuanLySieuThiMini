import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Asset, ProductBrand } from '../types'
import { BrandCatalogView } from './BrandCatalogView'

const brands: ProductBrand[] = [{ id: 1, name: 'Oreo' }]
const asset: Asset = {
  id: 1,
  assetCode: 'SNK-001',
  serialNumber: null,
  type: 'SNACK',
  manufacturer: 'Oreo',
  modelName: 'Gấu bông mini',
  processor: 'Core i5',
  memoryGb: 16,
  storage: 'Gói',
  screenSizeInch: 14,
  refreshRateHz: null,
  usbPorts: null,
  hasHeadphoneJack: true,
  hasDedicatedGraphics: false,
  purchaseDate: null,
  warrantyUntil: null,
  purchaseCost: 1000000,
  location: 'Kho',
  assigneeName: null,
  status: 'AVAILABLE',
  notes: null,
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function renderCatalog(overrides: Partial<ComponentProps<typeof BrandCatalogView>> = {}) {
  const props = {
    assets: [asset],
    brands,
    loading: false,
    onSelectForCheckout: vi.fn(),
    onViewDetail: vi.fn(),
    trashItems: [],
    trashLoading: false,
    onCreateBrand: vi.fn().mockResolvedValue(undefined),
    onUpdateBrand: vi.fn().mockResolvedValue(undefined),
    onMoveBrandToTrash: vi.fn().mockResolvedValue(undefined),
    onRestoreTrashItem: vi.fn().mockResolvedValue(undefined),
    onDeleteTrashItem: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  render(<BrandCatalogView {...props} />)
  return props
}

describe('BrandCatalogView brand management', () => {
  it('shows the matching brand product image in the catalog card', () => {
    renderCatalog()

    expect(screen.getByRole('img', { name: 'Oreo Gấu bông mini' })).toHaveAttribute('src', '/snack.svg')
    expect(screen.getByText('SNK-001')).toBeInTheDocument()
  })

  it('adds a manufacturer from the catalog management panel', async () => {
    const props = renderCatalog()
    fireEvent.click(screen.getByRole('button', { name: 'Quản lý danh mục' }))
    fireEvent.change(screen.getByLabelText('Tên thương hiệu mới'), { target: { value: '  Oishi  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Thêm thương hiệu' }))

    await waitFor(() => expect(props.onCreateBrand).toHaveBeenCalledWith('Oishi'))
    expect(screen.getByRole('status')).toHaveTextContent('Đã thêm thương hiệu sản phẩm.')
  })

  it('edits manufacturer names and moves manufacturers to the temporary trash', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const props = renderCatalog()
    fireEvent.click(screen.getByRole('button', { name: 'Quản lý danh mục' }))

    fireEvent.click(screen.getByRole('button', { name: 'Sửa' }))
    fireEvent.change(screen.getByLabelText('Sửa thương hiệu: Oreo'), { target: { value: 'Oreo Inc.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() => expect(props.onUpdateBrand).toHaveBeenCalledWith(1, 'Oreo Inc.'))

    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))
    await waitFor(() => expect(props.onMoveBrandToTrash).toHaveBeenCalledWith(1))
    expect(confirm).toHaveBeenCalled()
  })

  it('shows the brand-only trash from the catalog page', () => {
    renderCatalog()
    fireEvent.click(screen.getByRole('button', { name: 'Thùng rác (0)' }))
    expect(screen.getByRole('heading', { name: 'Hãng sản phẩm đã xóa' })).toBeInTheDocument()
  })
})
