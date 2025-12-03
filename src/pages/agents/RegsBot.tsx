import styles from './AgentPage.module.css'

function RegsBot(): React.JSX.Element {
  return (
    <div className={styles.agentPage}>
      <header className={styles.header}>
        <span className={styles.icon}>📜</span>
        <div className={styles.headerText}>
          <h1 className={styles.title}>RegsBot</h1>
          <p className={styles.subtitle}>Supreme Commander of EPA Knowledge</p>
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
            <li>Parse and index eCFR regulations</li>
            <li>Process EPA guidance documents</li>
            <li>Analyze state permit requirements</li>
            <li>Cross-reference regulatory sources</li>
            <li>Provide authoritative citations</li>
            <li>Track regulatory updates and changes</li>
          </ul>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Data Sources</h2>
          <ul className={styles.capabilities}>
            <li>eCFR Title 40 - Protection of Environment</li>
            <li>EPA Technical Guidance Documents</li>
            <li>State Environmental Agency Permits</li>
            <li>DAHS Compliance Requirements</li>
          </ul>
        </section>

        <section className={styles.card}>
          <div className={styles.placeholder}>
            <div className={styles.placeholderIcon}>🚧</div>
            <p>Chat interface coming soon</p>
            <p>RAG pipeline integration in progress</p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default RegsBot
