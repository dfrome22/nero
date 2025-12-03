import styles from './AgentCard.module.css'

export interface AgentCardProps {
  title: string
  description: string
  icon: string
  status: 'online' | 'offline' | 'busy'
  onClick?: () => void
}

function AgentCard({
  title,
  description,
  icon,
  status,
  onClick,
}: AgentCardProps): React.JSX.Element {
  const cardContent = (
    <>
      <div className={styles['header']}>
        <span className={styles['icon']}>{icon}</span>
        <span
          className={`${styles['status'] ?? ''} ${styles[status] ?? ''}`}
          aria-label={`Status: ${status}`}
        />
      </div>

      <h3 className={styles['title']}>{title}</h3>
      <p className={styles['description']}>{description}</p>

      <div className={styles['footer']}>
        <span className={styles['statusText']}>{status}</span>
      </div>
    </>
  )

  if (onClick !== undefined) {
    return (
      <button
        type="button"
        className={`${styles['card'] ?? ''} ${styles['clickable'] ?? ''}`}
        onClick={onClick}
      >
        {cardContent}
      </button>
    )
  }

  return <article className={styles['card']}>{cardContent}</article>
}

export default AgentCard
