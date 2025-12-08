import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import Sidebar from './Sidebar'

describe('Sidebar', () => {
  it('renders navigation element', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    )

    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('displays NERO branding', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    )

    expect(screen.getByText('NERO')).toBeInTheDocument()
  })

  it('renders all navigation links', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('War Council')).toBeInTheDocument()
    expect(screen.getByText('RegsBot')).toBeInTheDocument()
    expect(screen.getByText('RequirementsBot')).toBeInTheDocument()
    expect(screen.getByText('FigmaBot')).toBeInTheDocument()
    expect(screen.getByText('TestingBot')).toBeInTheDocument()
  })

  it('shows system status', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    )

    expect(screen.getByText('System Online')).toBeInTheDocument()
  })
})
