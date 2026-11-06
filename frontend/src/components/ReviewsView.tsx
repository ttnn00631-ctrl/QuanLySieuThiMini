import { useState, useMemo } from 'react'
import {
  Star, MessageSquare, Package, ShieldCheck, Reply, Send, CheckCircle2, Filter
} from 'lucide-react'
import type { ProductReview } from '../types'
import { api } from '../api'
import { Pagination, usePagination } from './Pagination'

interface ReviewsViewProps {
  reviews: ProductReview[]
  loading: boolean
  onRefresh: () => void
}

export function ReviewsView({ reviews, loading, onRefresh }: ReviewsViewProps) {
  const [selectedRating, setSelectedRating] = useState<number | 0>(0)
  const [replyTextMap, setReplyTextMap] = useState<Record<number, string>>({})
  const [replyingId, setReplyingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  // Thống kê điểm trung bình
  const stats = useMemo(() => {
    if (reviews.length === 0) return { avg: 5, total: 0, fiveStar: 0, fourStar: 0, threeStar: 0, replied: 0 }
    const total = reviews.length
    const sum = reviews.reduce((a, b) => a + b.rating, 0)
    const avg = Number((sum / total).toFixed(1))
    const fiveStar = reviews.filter(r => r.rating === 5).length
    const fourStar = reviews.filter(r => r.rating === 4).length
    const threeStar = reviews.filter(r => r.rating <= 3).length
    const replied = reviews.filter(r => Boolean(r.adminReply)).length
    return { avg, total, fiveStar, fourStar, threeStar, replied }
  }, [reviews])

  const filteredReviews = useMemo(() => {
    if (selectedRating === 0) return reviews
    return reviews.filter(r => r.rating === selectedRating)
  }, [reviews, selectedRating])
  const pagination = usePagination(filteredReviews)

  async function handleSendReply(reviewId: number) {
    const text = replyTextMap[reviewId]?.trim()
    if (!text) return
    setSubmitting(true)
    try {
      await api.replyReview(reviewId, text)
      setMessage('Đã gửi phản hồi thành công!')
      setReplyingId(null)
      onRefresh()
    } catch {
      setMessage('Không thể gửi phản hồi lúc này.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="reviews-view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Bình luận & Đánh giá từ Khách hàng</h1>
          <p className="view-subtitle">Khu vực quản trị dành cho Admin: Theo dõi phản hồi thực tế của khách hàng và gửi câu trả lời</p>
        </div>
        <div className="admin-badge-indicator">
          <ShieldCheck size={16} /> Chế độ Quản trị viên
        </div>
      </div>

      {message && (
        <div className="pos-alert-banner">
          <CheckCircle2 size={16} /> <span>{message}</span>
          <button onClick={() => setMessage('')}>Đóng</button>
        </div>
      )}

      {/* Thẻ tổng quan số sao & tỷ lệ phản hồi */}
      <div className="reviews-summary-grid">
        <div className="rating-overview-card">
          <div className="score-big">{stats.avg}</div>
          <div className="stars-row">
            {[1, 2, 3, 4, 5].map(st => (
              <Star
                key={st}
                size={20}
                className={st <= Math.round(stats.avg) ? 'star-filled' : 'star-empty'}
              />
            ))}
          </div>
          <p className="score-label">Đánh giá trung bình ({stats.total} nhận xét)</p>
        </div>

        <div className="rating-breakdown-card">
          <h4>Phân loại hàng hóa mức độ hài lòng</h4>
          <div className="breakdown-bar-row">
            <span>5 sao</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${stats.total ? (stats.fiveStar / stats.total) * 100 : 0}%` }} />
            </div>
            <strong>{stats.fiveStar}</strong>
          </div>
          <div className="breakdown-bar-row">
            <span>4 sao</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${stats.total ? (stats.fourStar / stats.total) * 100 : 0}%` }} />
            </div>
            <strong>{stats.fourStar}</strong>
          </div>
          <div className="breakdown-bar-row">
            <span>≤ 3 sao</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${stats.total ? (stats.threeStar / stats.total) * 100 : 0}%` }} />
            </div>
            <strong>{stats.threeStar}</strong>
          </div>
        </div>

        <div className="admin-replied-card">
          <div className="stat-icon-wrapper"><MessageSquare size={22} /></div>
          <div>
            <span className="stat-label">Tỷ lệ đã phản hồi</span>
            <strong className="stat-number">{stats.total ? Math.round((stats.replied / stats.total) * 100) : 100}%</strong>
            <small>{stats.replied} / {stats.total} đánh giá đã trả lời</small>
          </div>
        </div>
      </div>

      {/* Bộ lọc số sao */}
      <div className="reviews-filter-bar">
        <span className="filter-title"><Filter size={15} /> Lọc đánh giá:</span>
        <button
          className={`filter-star-btn ${selectedRating === 0 ? 'active' : ''}`}
          onClick={() => { setSelectedRating(0); pagination.setPage(0) }}
        >
          Tất cả ({reviews.length})
        </button>
        <button
          className={`filter-star-btn ${selectedRating === 5 ? 'active' : ''}`}
          onClick={() => { setSelectedRating(5); pagination.setPage(0) }}
        >
          ⭐⭐⭐⭐⭐ 5 sao ({stats.fiveStar})
        </button>
        <button
          className={`filter-star-btn ${selectedRating === 4 ? 'active' : ''}`}
          onClick={() => { setSelectedRating(4); pagination.setPage(0) }}
        >
          ⭐⭐⭐⭐ 4 sao ({stats.fourStar})
        </button>
        <button
          className={`filter-star-btn ${selectedRating === 3 ? 'active' : ''}`}
          onClick={() => { setSelectedRating(3); pagination.setPage(0) }}
        >
          ⭐⭐⭐ 3 sao ({stats.threeStar})
        </button>
      </div>

      {/* Danh sách các bình luận */}
      <div className="reviews-list-container">
        {loading ? (
          <div className="loading-card">Đang tải danh sách đánh giá...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="empty-catalog-card">
            <MessageSquare size={36} />
            <p>Không có đánh giá nào cho mức sao này</p>
          </div>
        ) : (
          pagination.pageItems.map(rev => (
            <div key={rev.id} className="review-item-card">
              <div className="review-header-row">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">
                    {rev.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong>{rev.customerName}</strong>
                    <div className="review-product-tag">
                      <Package size={13} /> Sản phẩm: <span>{rev.productName}</span>
                    </div>
                  </div>
                </div>

                <div className="review-meta-right">
                  <div className="review-stars">
                    {[1, 2, 3, 4, 5].map(st => (
                      <Star
                        key={st}
                        size={16}
                        className={st <= rev.rating ? 'star-filled' : 'star-empty'}
                      />
                    ))}
                  </div>
                  <span className="review-time">
                    {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              <div className="review-comment-body">
                "{rev.comment}"
              </div>

              {/* Phần phản hồi của Admin */}
              {rev.adminReply ? (
                <div className="admin-reply-box">
                  <div className="admin-reply-header">
                    <ShieldCheck size={14} /> <strong>Phản hồi từ Ban Quản Trị Store:</strong>
                  </div>
                  <p>{rev.adminReply}</p>
                </div>
              ) : replyingId === rev.id ? (
                <div className="reply-editor-box">
                  <textarea
                    rows={3}
                    placeholder="Viết câu trả lời hoặc cảm ơn khách hàng..."
                    value={replyTextMap[rev.id] || ''}
                    onChange={e => setReplyTextMap(prev => ({ ...prev, [rev.id]: e.target.value }))}
                  />
                  <div className="reply-editor-actions">
                    <button className="btn-secondary" onClick={() => setReplyingId(null)}>Hủy</button>
                    <button
                      className="btn-primary"
                      disabled={submitting}
                      onClick={() => handleSendReply(rev.id)}
                    >
                      <Send size={14} /> {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="review-actions-bottom">
                  <button
                    className="btn-reply-toggle"
                    onClick={() => {
                      setReplyingId(rev.id)
                      setReplyTextMap(prev => ({ ...prev, [rev.id]: prev[rev.id] || '' }))
                    }}
                  >
                    <Reply size={14} /> Trả lời đánh giá này
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {!loading && filteredReviews.length > 0 && (
        <Pagination
          totalItems={filteredReviews.length}
          page={pagination.page}
          pageSize={10}
          onPageChange={pagination.setPage}
        />
      )}
    </div>
  )
}
