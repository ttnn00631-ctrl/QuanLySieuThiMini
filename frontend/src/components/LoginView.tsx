import { ArrowRight, LockKeyhole, Package } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { Session } from '../types'

interface LoginViewProps {
  onLogin: (username: string, password: string) => Promise<Session>
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await onLogin(username, password)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Đăng nhập chưa thành công')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-story">
        <div className="login-mark"><Package size={19} /><span>MINI MART / 01</span></div>
        <div className="login-story-copy">
          <p className="eyebrow">HỆ THỐNG QUẢN LÝ SIÊU THỊ MINI</p>
          <h1>Siêu thị mini.<br /><span>Ăn vặt vui – đồ chơi xinh.</span></h1>
        </div>
        <div className="login-story-footer"><span>QUẢN LÝ HÀNG HÓA & BÁN HÀNG</span><span>2026</span></div>
      </section>
      <section className="login-panel">
        <form className="login-form" onSubmit={submit}>
          <span className="login-icon"><LockKeyhole size={20} /></span>
          <p className="eyebrow">CHÀO MỪNG TRỞ LẠI</p>
          <h2>Đăng nhập</h2>
          <p className="muted">Đăng nhập bằng tài khoản nhân viên hoặc khách hàng.</p>
          <label className="field-label" htmlFor="username">Tên đăng nhập</label>
          <input id="username" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} required />
          <label className="field-label" htmlFor="password">Mật khẩu</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary login-submit" type="submit" disabled={loading}>
            {loading ? 'Đang xác thực...' : 'Vào hệ thống'} <ArrowRight size={17} />
          </button>
          <a className="login-store-link" href="/store">Xem cửa hàng dành cho khách hàng</a>
        </form>
      </section>
    </main>
  )
}