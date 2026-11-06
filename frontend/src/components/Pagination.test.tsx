import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Pagination, usePagination } from './Pagination'

afterEach(cleanup)

describe('Pagination', () => {
  it('shows the current range and changes pages', () => {
    const onPageChange = vi.fn()
    render(<Pagination totalItems={23} page={1} pageSize={10} onPageChange={onPageChange} />)

    expect(screen.getByText('Hiển thị 11–20 trên 23')).toBeInTheDocument()
    expect(screen.getByText('Trang 2 / 3')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Trang tiếp' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('shows an empty range and disables navigation when no results exist', () => {
    render(<Pagination totalItems={0} page={0} pageSize={10} onPageChange={vi.fn()} />)

    expect(screen.getByText('Hiển thị 0–0 trên 0')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trang trước' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Trang tiếp' })).toBeDisabled()
  })

  it('slices the list and clamps back to the last available page', () => {
    function List({ items }: { items: number[] }) {
      const pagination = usePagination(items, 2)
      return (
        <>
          <output>{pagination.pageItems.join(',')}</output>
          <button onClick={() => pagination.setPage(pagination.page + 1)}>Tiếp</button>
        </>
      )
    }

    const { rerender } = render(<List items={[1, 2, 3, 4, 5]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp' }))
    expect(screen.getByText('3,4')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp' }))
    expect(screen.getByText('5')).toBeInTheDocument()

    rerender(<List items={[1, 2]} />)
    expect(screen.getByText('1,2')).toBeInTheDocument()
  })
})
