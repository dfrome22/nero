import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from './Dashboard'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: (): typeof mockNavigate => mockNavigate,
  }
})

describe('Dashboard', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders dashboard heading', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
  })

  it('displays all agent cards', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    expect(screen.getByText('RegsBot')).toBeInTheDocument()
    expect(screen.getByText('RequirementsBot')).toBeInTheDocument()
    expect(screen.getByText('FigmaBot')).toBeInTheDocument()
    expect(screen.getByText('TestingBot')).toBeInTheDocument()
  })

  it('navigates to agent page on card click', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    const regsBotCard = screen.getByText('RegsBot').closest('button')
    if (regsBotCard !== null) {
      await userEvent.click(regsBotCard)
      expect(mockNavigate).toHaveBeenCalledWith('/agents/regs')
    }
  })

  it('shows system status section', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    expect(screen.getByText('System Status')).toBeInTheDocument()
    expect(screen.getByText('Total Agents')).toBeInTheDocument()
  })
})
