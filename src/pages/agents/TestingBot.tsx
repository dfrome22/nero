import styles from './AgentPage.module.css'

function TestingBot(): React.JSX.Element {
  return (
    <div className={styles.agentPage}>
      <header className={styles.header}>
        <span className={styles.icon}>🧪</span>
        <div className={styles.headerText}>
          <h1 className={styles.title}>TestingBot</h1>
          <p className={styles.subtitle}>TDD Infrastructure Specialist</p>
        </div>
        <div className={styles.status}>
          <span className={styles.statusDot} />
          <span>Online</span>
        </div>
      </header>

      <div className={styles.content}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Capabilities</h2>
          <ul className={styles.capabilities}>
            <li>Generate test specifications from requirements</li>
            <li>Create acceptance criteria</li>
            <li>Build design contracts</li>
            <li>Write unit test scaffolds</li>
            <li>Generate E2E test scenarios</li>
            <li>Track test coverage metrics</li>
          </ul>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Testing Stack</h2>
          <ul className={styles.capabilities}>
            <li>Vitest - Unit Testing</li>
            <li>React Testing Library - Component Testing</li>
            <li>Playwright - E2E Testing</li>
            <li>Coverage Reports - V8 Provider</li>
          </ul>
        </section>

        <section className={styles.card}>
          <div className={styles.placeholder}>
            <div className={styles.placeholderIcon}>🚧</div>
            <p>Test generation interface coming soon</p>
            <p>Integration with RequirementsBot in progress</p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default TestingBot
