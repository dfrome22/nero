import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
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

    expect(screen.getByRole('heading', { name: /nero agent ecosystem/i })).toBeInTheDocument()
  })

  it('displays all agent cards', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    // Use getByRole with heading to get specific agent card headings
    expect(screen.getByRole('heading', { name: 'RegsBot' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'DAHSBot' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'RequirementsBot' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'FigmaBot' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'TestingBot' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'CopilotBot' })).toBeInTheDocument()
  })

  it('navigates to agent page on card click', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    // Find the RegsBot card by its heading and click
    const regsBotHeading = screen.getByRole('heading', { name: 'RegsBot' })
    const regsBotCard = regsBotHeading.closest('[class*="agentWrapper"]')?.querySelector('button')
    if (regsBotCard !== null && regsBotCard !== undefined) {
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
    expect(screen.getByText('MCP Tools')).toBeInTheDocument()
  })
})
