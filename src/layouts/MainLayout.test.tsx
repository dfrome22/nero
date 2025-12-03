import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import MainLayout from './MainLayout'

describe('MainLayout', () => {
  it('renders sidebar navigation', () => {
    render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    )

    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders main content area', () => {
    render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    )

    expect(screen.getByRole('main')).toBeInTheDocument()
  })
})
