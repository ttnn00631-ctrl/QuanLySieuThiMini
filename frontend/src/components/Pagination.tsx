import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

interface PaginationProps {
  totalItems: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ totalItems, page, pageSize, onPageChange, className = '' }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(page, pageCount - 1)
  const firstItem = totalItems === 0 ? 0 : currentPage * pageSize + 1
  const lastItem = Math.min((currentPage + 1) * pageSize, totalItems)

  return (
    <nav className={`list-pagination ${className}`} aria-label="Phân trang">
      <span className="pagination-summary">Hiển thị {firstItem}–{lastItem} trên {totalItems}</span>
      <div className="pagination-controls">
        <button
          className="icon-button"
          aria-label="Trang trước"
          disabled={currentPage === 0}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft size={17} />
        </button>
        <span aria-live="polite">Trang {currentPage + 1} / {pageCount}</span>
        <button
          className="icon-button"
          aria-label="Trang tiếp"
          disabled={currentPage + 1 >= pageCount}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </nav>
  )
}

export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(page, pageCount - 1)

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage)
  }, [page, currentPage])

  const pageItems = useMemo(
    () => items.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
    [items, currentPage, pageSize],
  )

  function changePage(nextPage: number) {
    setPage(Math.max(0, Math.min(nextPage, pageCount - 1)))
  }

  return { pageItems, page: currentPage, pageCount, setPage: changePage }
}
