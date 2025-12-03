import styles from './AgentPage.module.css'

function FigmaBot(): React.JSX.Element {
  return (
    <div className={styles.agentPage}>
      <header className={styles.header}>
        <span className={styles.icon}>🎨</span>
        <div className={styles.headerText}>
          <h1 className={styles.title}>FigmaBot</h1>
          <p className={styles.subtitle}>UI/UX Design Automation</p>
        </div>
        <div className={styles.status}>
          <span className={`${styles.statusDot} ${styles.offline}`} />
          <span>Offline</span>
        </div>
      </header>

      <div className={styles.content}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Capabilities</h2>
          <ul className={styles.capabilities}>
            <li>Generate wireframes from requirements</li>
            <li>Create component libraries</li>
            <li>Build interactive prototypes</li>
            <li>Ensure accessibility compliance</li>
            <li>Iterate with RequirementsBot feedback</li>
            <li>Export design specs for development</li>
          </ul>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Integrations</h2>
          <ul className={styles.capabilities}>
            <li>Figma API</li>
            <li>Design tokens export</li>
            <li>Storybook generation</li>
            <li>Accessibility audit tools</li>
          </ul>
        </section>

        <section className={styles.card}>
          <div className={styles.placeholder}>
            <div className={styles.placeholderIcon}>🔌</div>
            <p>Figma integration pending</p>
            <p>Requires Figma API configuration</p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default FigmaBot
