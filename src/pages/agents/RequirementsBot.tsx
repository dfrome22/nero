import styles from './AgentPage.module.css'

function RequirementsBot(): React.JSX.Element {
  return (
    <div className={styles.agentPage}>
      <header className={styles.header}>
        <span className={styles.icon}>📋</span>
        <div className={styles.headerText}>
          <h1 className={styles.title}>RequirementsBot</h1>
          <p className={styles.subtitle}>Requirements Engineering Specialist</p>
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
            <li>Create user personas for DAHS systems</li>
            <li>Generate workflow diagrams</li>
            <li>Map user journeys</li>
            <li>Write functional requirements</li>
            <li>Define acceptance criteria</li>
            <li>Trace requirements to regulations</li>
          </ul>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Output Formats</h2>
          <ul className={styles.capabilities}>
            <li>User Stories (As a... I want... So that...)</li>
            <li>Workflow Diagrams (Mermaid/PlantUML)</li>
            <li>Journey Maps</li>
            <li>Requirements Traceability Matrix</li>
          </ul>
        </section>

        <section className={styles.card}>
          <div className={styles.placeholder}>
            <div className={styles.placeholderIcon}>🚧</div>
            <p>Requirements workspace coming soon</p>
            <p>Integration with RegsBot in progress</p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default RequirementsBot
