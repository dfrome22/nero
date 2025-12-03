import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )

    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('displays the NERO branding', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )

    expect(screen.getByText('NERO')).toBeInTheDocument()
  })

  it('shows dashboard by default', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )

    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
  })
})
