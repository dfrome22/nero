import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AgentCard from './AgentCard'

describe('AgentCard', () => {
  const defaultProps = {
    title: 'Test Agent',
    description: 'Test description',
    icon: '🤖',
    status: 'online' as const,
  }

  it('renders card with title and description', () => {
    render(<AgentCard {...defaultProps} />)

    expect(screen.getByText('Test Agent')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('displays the icon', () => {
    render(<AgentCard {...defaultProps} />)

    expect(screen.getByText('🤖')).toBeInTheDocument()
  })

  it('shows status indicator', () => {
    render(<AgentCard {...defaultProps} status="online" />)

    expect(screen.getByLabelText('Status: online')).toBeInTheDocument()
  })

  it('renders as button when onClick is provided', async () => {
    const handleClick = vi.fn()
    render(<AgentCard {...defaultProps} onClick={handleClick} />)

    const button = screen.getByRole('button')
    await userEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders as article when onClick is not provided', () => {
    render(<AgentCard {...defaultProps} />)

    expect(screen.getByRole('article')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it.each(['online', 'offline', 'busy'] as const)('displays %s status correctly', (status) => {
    render(<AgentCard {...defaultProps} status={status} />)

    expect(screen.getByText(status)).toBeInTheDocument()
  })
})
