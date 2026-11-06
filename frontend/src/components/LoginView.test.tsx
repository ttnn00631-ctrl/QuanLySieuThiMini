import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LoginView } from './LoginView'

describe('LoginView', () => {
  it('does not prefill or display demo credentials', () => {
    const onLogin = vi.fn(async () => ({
      token: 'token',
      username: 'admin',
      displayName: 'Quản trị viên',
      role: 'ADMIN' as const,
    }))

    render(<LoginView onLogin={onLogin} />)

    expect(screen.getByLabelText('Tên đăng nhập')).toHaveValue('')
    expect(screen.queryByText(/tài khoản demo|mật khẩu mặc định/i)).not.toBeInTheDocument()
    expect(screen.getByText('HỆ THỐNG QUẢN LÝ SIÊU THỊ MINI')).toBeInTheDocument()
  })
})
