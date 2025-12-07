import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { Council } from './Council'

function renderCouncil(): ReturnType<typeof render> {
  return render(
    <BrowserRouter>
      <Council />
    </BrowserRouter>
  )
}

describe('Council', () => {
  it('renders war council heading', () => {
    renderCouncil()
    expect(screen.getByRole('heading', { name: /War Council/i })).toBeInTheDocument()
  })

  it('displays council preset options', () => {
    renderCouncil()
    expect(screen.getByText('Compliance Review Council')).toBeInTheDocument()
    expect(screen.getByText('Feature Design Council')).toBeInTheDocument()
    expect(screen.getByText('Adversarial Audit')).toBeInTheDocument()
    expect(screen.getByText('Full War Council')).toBeInTheDocument()
  })

  it('shows demo session loader button', () => {
    renderCouncil()
    expect(screen.getByRole('button', { name: /Load Demo Session/i })).toBeInTheDocument()
  })

  it('loads demo session when demo button clicked', async () => {
    const user = userEvent.setup()
    renderCouncil()

    const demoButton = screen.getByRole('button', { name: /Load Demo Session/i })
    await user.click(demoButton)

    // Should now show the session layout with transcript
    expect(screen.getByText('CSAPR Unit Implementation Review')).toBeInTheDocument()
    expect(screen.getByText(/in-progress/i)).toBeInTheDocument()
  })

  it('displays transcript messages after loading demo', async () => {
    const user = userEvent.setup()
    renderCouncil()

    await user.click(screen.getByRole('button', { name: /Load Demo Session/i }))

    // Check for messages in the transcript
    expect(screen.getByText(/I have reviewed the applicable regulations/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Our DAHS system can handle the monitoring requirements/i)
    ).toBeInTheDocument()
  })

  it('shows findings panel after loading session', async () => {
    const user = userEvent.setup()
    renderCouncil()

    await user.click(screen.getByRole('button', { name: /Load Demo Session/i }))

    // Should show the findings panel
    expect(screen.getByRole('heading', { name: /Findings/i })).toBeInTheDocument()
  })

  it('shows action items panel after loading session', async () => {
    const user = userEvent.setup()
    renderCouncil()

    await user.click(screen.getByRole('button', { name: /Load Demo Session/i }))

    // Should show action items
    expect(screen.getByRole('heading', { name: /Action Items/i })).toBeInTheDocument()
    expect(screen.getByText(/Verify polling interval compliance/i)).toBeInTheDocument()
  })

  it('shows open questions panel after loading session', async () => {
    const user = userEvent.setup()
    renderCouncil()

    await user.click(screen.getByRole('button', { name: /Load Demo Session/i }))

    // Should show open questions
    expect(screen.getByRole('heading', { name: /Open Questions/i })).toBeInTheDocument()
    expect(
      screen.getByText(/Does the facility have existing CEMS infrastructure/i)
    ).toBeInTheDocument()
  })

  it('navigates back to dashboard via link', () => {
    renderCouncil()
    const backLink = screen.getByRole('link', { name: /Back to Dashboard/i })
    expect(backLink).toHaveAttribute('href', '/')
  })

  it('starts a new session when preset is selected', async () => {
    const user = userEvent.setup()
    renderCouncil()

    const compliancePreset = screen.getByRole('button', {
      name: /Compliance Review Council.*Full regulatory compliance review/is,
    })
    await user.click(compliancePreset)

    // Should show session layout with the preset name
    expect(screen.getByText('Compliance Review Council')).toBeInTheDocument()
  })
})
