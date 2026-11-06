import { describe, expect, it } from 'vitest'
import { formatCurrency, productImageFor, statusLabel, typeLabel } from './utils'

describe('inventory labels and formatting', () => {
  it('translates status and device type to Vietnamese', () => {
    expect(statusLabel('MAINTENANCE')).toBe('Chờ xử lý')
    expect(typeLabel('SNACK')).toBe('Đồ ăn vặt')
  })

  it('formats purchase value as Vietnamese dong', () => {
    expect(formatCurrency(15000)).toContain('15.000')
    expect(formatCurrency(null)).toBe('—')
  })

  it('uses real product photos for minimart products and ignores old illustration paths', () => {
    expect(productImageFor({ manufacturer: 'Cosy', imageUrl: '/old-computer-image.jpg' })).toBe('https://fmcgnepal.com/images/snacks.webp')
    expect(productImageFor({ manufacturer: 'Cosy', imageUrl: '/snack.svg' })).toBe('https://fmcgnepal.com/images/snacks.webp')
    expect(productImageFor({ manufacturer: 'Cosy', imageUrl: null })).toBe('https://fmcgnepal.com/images/snacks.webp')
  })

  it('maps product categories to real product photos', () => {
    expect(productImageFor({ manufacturer: 'Poca' })).toBe('https://fmcgnepal.com/images/snacks.webp')
    expect(productImageFor({ manufacturer: 'Coca-Cola' })).toBe('https://fmcgnepal.com/images/snacks.webp')
    expect(productImageFor({ manufacturer: 'Chin-su' })).toBe('https://fmcgnepal.com/images/snacks.webp')
    expect(productImageFor({ manufacturer: 'Oreo' })).toBe('https://fmcgnepal.com/images/snacks.webp')
    expect(productImageFor({ manufacturer: 'Cosy' })).toBe('https://fmcgnepal.com/images/snacks.webp')
    expect(productImageFor({ manufacturer: 'Oishi' })).toBe('https://fmcgnepal.com/images/snacks.webp')
    expect(productImageFor({ manufacturer: 'Coca-Cola', type: 'DRINK' })).toBe('https://p2.trrsf.com/image/fget/cf/940/0/images.terra.com/2023/07/02/reflejo_pag1-t8cxsnqdz0vr.jpg')
    expect(productImageFor({ manufacturer: 'ToyJoy' })).toBe('https://igrashky24.com.ua/image/catalog/categori/ihrashky.png')
    expect(productImageFor({ manufacturer: 'Plushie' })).toBe('https://igrashky24.com.ua/image/catalog/categori/ihrashky.png')
  })
})