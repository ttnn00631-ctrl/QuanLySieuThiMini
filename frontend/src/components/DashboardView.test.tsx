import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DashboardView } from './DashboardView'

describe('DashboardView', () => {
  it('shows asset status counts and recent products', () => {
    render(<DashboardView
      summary={{ total: 4, available: 1, assigned: 2, maintenance: 1, retired: 0 }}
      recentAssets={[{
        id: 1,
        assetCode: 'LT-01',
        serialNumber: null,
        type: 'SNACK',
        manufacturer: 'Oishi',
        modelName: 'Snack khoai tây',
        processor: 'Intel Core Ultra 5',
        memoryGb: 16,
        storage: 'Gói',
        screenSizeInch: 14,
        refreshRateHz: 60,
        usbPorts: '2 × USB-A, 2 × USB-C',
        hasHeadphoneJack: true,
        hasDedicatedGraphics: false,
        purchaseDate: null,
        warrantyUntil: null,
        purchaseCost: null,
        location: 'Kho hàng hóa',
        assigneeName: null,
        status: 'AVAILABLE',
        notes: null,
      }]}
      onOpenAssets={vi.fn()}
    />)

    expect(screen.getByText('Tổng quan siêu thị')).toBeInTheDocument()
    expect(screen.getByText('4 sản phẩm')).toBeInTheDocument()
    expect(screen.getByText('LT-01')).toBeInTheDocument()
    expect(screen.getByText('Oishi Snack khoai tây')).toBeInTheDocument()
  })
})