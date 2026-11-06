import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Asset, SaleOrder } from '../types'
import { api } from '../api'
import { CheckoutView } from './CheckoutView'

vi.mock('../api', () => ({
  api: {
    createOrder: vi.fn(),
    orders: vi.fn(),
  },
}))

const session = {
  token: 'token',
  username: 'cashier',
  displayName: 'Thu ngân',
  role: 'CASHIER' as const,
}

function makeAsset(id: number): Asset {
  return {
    id,
    assetCode: `ASSET-${id}`,
    serialNumber: null,
    type: 'SNACK',
    manufacturer: 'Coca-Cola',
    modelName: 'Snack khoai tây',
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
}

function makeOrder(): SaleOrder {
  return {
    id: 1,
    orderCode: 'POS-001',
    customerName: 'Khách vãng lai',
    customerPhone: null,
    isGuest: true,
    cashierName: 'Thu ngân',
    subtotal: 2000000,
    discountAmount: 0,
    totalAmount: 2000000,
    paymentMethod: 'CARD',
    orderStatus: 'COMPLETED',
    itemsJson: '[]',
    createdAt: '2025-01-01T00:00:00',
  }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('CheckoutView product quantities', () => {
  it('groups the model, changes its cart quantity, and caps it at available stock', () => {
    const assets = [makeAsset(1), makeAsset(2), makeAsset(3)]
    render(<CheckoutView assets={assets} customers={[]} session={session} initialSelectedAsset={assets[0]} />)

    expect(document.querySelectorAll('.pos-product-item')).toHaveLength(1)
    expect(screen.getByRole('option', { name: 'Coca-Cola' })).toBeInTheDocument()

    const quantity = screen.getByLabelText('Số lượng Snack khoai tây')
    const increase = screen.getByRole('button', { name: 'Tăng số lượng Snack khoai tây' })
    fireEvent.click(increase)
    expect(quantity).toHaveTextContent('2')
    expect(document.querySelector('.cart-item-sum')).toHaveTextContent('2.000.000')
    expect(screen.getByText('Tạm tính (2 sản phẩm):')).toBeInTheDocument()

    fireEvent.click(increase)
    expect(quantity).toHaveTextContent('3')
    expect(increase).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Giảm số lượng Snack khoai tây' }))
    expect(quantity).toHaveTextContent('2')
  })

  it('submits each selected product once while preserving the grouped quantity in the total', async () => {
    const assets = [makeAsset(1), makeAsset(2)]
    vi.mocked(api.createOrder).mockResolvedValue(makeOrder())
    render(<CheckoutView assets={assets} customers={[]} session={session} initialSelectedAsset={assets[0]} />)

    fireEvent.click(screen.getByRole('button', { name: 'Tăng số lượng Snack khoai tây' }))
    fireEvent.click(screen.getByRole('button', { name: 'Khách vãng lai (Mua nhanh)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Quẹt thẻ POS' }))
    fireEvent.click(screen.getByRole('button', { name: /Thanh toán/ }))

    await vi.waitFor(() => expect(api.createOrder).toHaveBeenCalledTimes(1))
    expect(api.createOrder).toHaveBeenCalledWith(expect.objectContaining({
      items: [
        { assetId: 1, quantity: 1 },
        { assetId: 2, quantity: 1 },
      ],
    }))
  })
})

describe('CheckoutView quick payment', () => {
  it('lets a walk-in customer pay the exact cash total without manually entering cash', async () => {
    const item = makeAsset(7)
    vi.mocked(api.createOrder).mockResolvedValue(makeOrder())
    render(<CheckoutView assets={[item]} customers={[]} session={session} initialSelectedAsset={item} />)

    expect(screen.getByRole('button', { name: 'Khách vãng lai (Mua nhanh)' })).toHaveClass('active')
    fireEvent.click(screen.getByRole('button', { name: /Thanh toán 1\.000\.000/ }))

    await vi.waitFor(() => expect(api.createOrder).toHaveBeenCalledWith(expect.objectContaining({
      guest: true,
      customerId: null,
      paymentMethod: 'CASH',
      cashReceived: 1000000,
      items: [{ assetId: 7, quantity: 1 }],
    })))
  })

  it('does not submit when the entered cash amount is below the total', async () => {
    const item = makeAsset(8)
    render(<CheckoutView assets={[item]} customers={[]} session={session} initialSelectedAsset={item} />)
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Tiền khách đưa' }), { target: { value: '500000' } })
    fireEvent.click(screen.getByRole('button', { name: /Thanh toán 1\.000\.000/ }))
    expect(screen.getByText('Số tiền khách đưa chưa đủ để thanh toán hóa đơn!')).toBeInTheDocument()
    expect(api.createOrder).not.toHaveBeenCalled()
  })
})
