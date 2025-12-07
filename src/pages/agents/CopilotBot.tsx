/**
 * CopilotBot Page - Comment Scanner & GitHub Issue Creator
 *
 * Scans repository for Copilot-generated comments (TODO, FIXME, HACK, XXX, NOTE)
 * and provides tools to create GitHub issues from them.
 */

import { useState, useMemo } from 'react'
import { CopilotBotService } from '@agents/copilotbot/index'
import type { CommentMarker, ScanResult } from '@/utils/comment-scanner'
import type { GitHubIssue } from '@agents/copilotbot/index'
import styles from './AgentPage.module.css'

function CopilotBot(): React.JSX.Element {
  const copilotBot = useMemo(() => new CopilotBotService(), [])
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<CommentMarker['type'][]>([
    'TODO',
    'FIXME',
    'HACK',
  ])
  const [issues, setIssues] = useState<GitHubIssue[]>([])
  const [showSummary, setShowSummary] = useState(false)
  const [verifyImplementation, setVerifyImplementation] = useState(true)

  const handleScan = async (): Promise<void> => {
    setLoading(true)
    try {
      const result = await copilotBot.scanRepository({
        includeTypes: selectedTypes,
        verifyImplementation,
      })

      // Verify implementation status if enabled
      let finalMarkers = result.markers
      if (verifyImplementation) {
        finalMarkers = await copilotBot.verifyMarkers(result.markers)
      }

      setScanResult({ ...result, markers: finalMarkers })
      setIssues(copilotBot.generateGitHubIssues(finalMarkers))
      setShowSummary(false)
    } catch (err) {
      console.error('Scan failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleType = (type: CommentMarker['type']): void => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const renderMarkerTypeCard = (type: CommentMarker['type']): React.JSX.Element => {
    const isActive = selectedTypes.includes(type)
    const icons: Record<CommentMarker['type'], string> = {
      FIXME: '🔴',
      TODO: '📝',
      HACK: '⚠️',
      XXX: '❓',
      NOTE: '📌',
    }
    const descriptions: Record<CommentMarker['type'], string> = {
      FIXME: 'Critical bugs that need immediate attention',
      TODO: 'Features or tasks to implement',
      HACK: 'Temporary workarounds needing refactoring',
      XXX: 'Items requiring review or decision',
      NOTE: 'Important documentation notes',
    }

    return (
      <div
        key={type}
        className={`${styles.queryTypeCard} ${isActive ? styles.queryTypeCardActive : ''}`}
        onClick={() => {
          toggleType(type)
        }}
        style={{ cursor: 'pointer' }}
      >
        <div className={styles.queryTypeIcon}>{icons[type]}</div>
        <div className={styles.queryTypeLabel}>{type}</div>
        <div className={styles.queryTypeDesc}>{descriptions[type]}</div>
      </div>
    )
  }

  const renderMarkers = (): React.JSX.Element => {
    if (!scanResult || scanResult.markers.length === 0) {
      return (
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>🔍</div>
          <p>No markers found. Try scanning with different options.</p>
        </div>
      )
    }

    return (
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-md)',
          }}
        >
          <h3>
            Found {scanResult.totalMarkers} markers in {scanResult.totalFiles} files
          </h3>
          <button
            type="button"
            onClick={() => {
              setShowSummary(!showSummary)
            }}
            className={styles.quickButton}
          >
            {showSummary ? '📋 Hide Summary' : '📋 Show Summary'}
          </button>
        </div>

        {showSummary && (
          <div className={styles.card} style={{ marginBottom: 'var(--space-lg)' }}>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
              {copilotBot.generateScanSummary(scanResult)}
            </pre>
          </div>
        )}

        <div className={styles.dataGrid}>
          {issues.map((issue, index) => {
            const marker = issue.marker
            const statusIcons: Record<string, string> = {
              'not-implemented': '⚠️',
              partial: '⚡',
              implemented: '✅',
              unknown: '❓',
            }
            const statusColors: Record<string, string> = {
              'not-implemented': '#fef3c7',
              partial: '#dbeafe',
              implemented: '#dcfce7',
              unknown: '#f3f4f6',
            }

            return (
              <div key={index} className={styles.dataItem}>
                <strong>{issue.title}</strong>
                <p style={{ fontSize: '0.875rem', marginTop: 'var(--space-xs)' }}>
                  📁 {marker.file}:{marker.line}
                </p>

                {/* Implementation Status Badge */}
                {marker.implementationStatus !== undefined &&
                  marker.implementationStatus !== 'unknown' && (
                    <div
                      style={{
                        padding: '4px 8px',
                        background: statusColors[marker.implementationStatus] ?? '#f3f4f6',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        marginTop: 'var(--space-xs)',
                        display: 'inline-block',
                      }}
                    >
                      {statusIcons[marker.implementationStatus]}{' '}
                      {marker.implementationStatus === 'not-implemented'
                        ? 'Not Implemented'
                        : marker.implementationStatus === 'partial'
                          ? 'Partially Implemented'
                          : 'Implemented'}
                    </div>
                  )}

                {marker.verificationNote !== undefined && (
                  <p
                    style={{ fontSize: '0.75rem', marginTop: 'var(--space-xs)', color: '#6b7280' }}
                  >
                    {marker.verificationNote}
                  </p>
                )}

                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--space-xs)',
                    marginTop: 'var(--space-sm)',
                    flexWrap: 'wrap',
                  }}
                >
                  {issue.labels.map((label) => (
                    <span
                      key={label}
                      style={{
                        padding: '2px 8px',
                        background: '#e5e7eb',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <details style={{ marginTop: 'var(--space-sm)' }}>
                  <summary
                    style={{
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: 'var(--color-accent)',
                    }}
                  >
                    View Issue Body
                  </summary>
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.75rem',
                      marginTop: 'var(--space-xs)',
                    }}
                  >
                    {issue.body}
                  </pre>
                </details>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.agentPage}>
      <header className={styles.heroHeader}>
        <div className={styles.heroContent}>
          <span className={styles.heroIcon}>🤖</span>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>CopilotBot</h1>
            <p className={styles.heroSubtitle}>Comment Scanner & GitHub Issue Creator</p>
          </div>
        </div>
        <div className={styles.heroStatus}>
          <span className={styles.statusPulse} />
          <span>Ready to Scan</span>
        </div>
        {scanResult && (
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <div className={styles.heroStatValue}>{scanResult.totalMarkers}</div>
              <div className={styles.heroStatLabel}>Markers Found</div>
            </div>
            <div className={styles.heroStat}>
              <div className={styles.heroStatValue}>{scanResult.totalFiles}</div>
              <div className={styles.heroStatLabel}>Files Affected</div>
            </div>
            <div className={styles.heroStat}>
              <div className={styles.heroStatValue}>{issues.length}</div>
              <div className={styles.heroStatLabel}>Issues Ready</div>
            </div>
          </div>
        )}
      </header>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Select Comment Types to Scan</h2>
        <p className={styles.hint} style={{ marginBottom: 'var(--space-md)' }}>
          Choose which types of comments you want to scan for in the repository.
        </p>
        <div className={styles.queryTypeGrid}>
          {['FIXME', 'TODO', 'HACK', 'XXX', 'NOTE'].map((type) =>
            renderMarkerTypeCard(type as CommentMarker['type'])
          )}
        </div>

        <div
          style={{
            marginTop: 'var(--space-md)',
            padding: 'var(--space-md)',
            background: '#f9fafb',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={verifyImplementation}
              onChange={(e) => {
                setVerifyImplementation(e.target.checked)
              }}
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ fontSize: '0.875rem' }}>
              <strong>Verify Implementation Status</strong> - Check if TODOs are actually
              implemented
            </span>
          </label>
          <p
            style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              marginTop: 'var(--space-xs)',
              marginLeft: '24px',
            }}
          >
            Analyzes surrounding code to detect if the TODO comment is still valid or already
            implemented
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void handleScan()
          }}
          disabled={loading || selectedTypes.length === 0}
          className={styles.submitButton}
          style={{ marginTop: 'var(--space-lg)' }}
        >
          {loading ? '⏳ Scanning...' : '🔍 Scan Repository'}
        </button>
      </div>

      {scanResult && (
        <div className={styles.card} style={{ marginTop: 'var(--space-lg)' }}>
          <h2 className={styles.cardTitle}>Scan Results</h2>
          {renderMarkers()}
        </div>
      )}

      <div className={styles.card} style={{ marginTop: 'var(--space-lg)' }}>
        <h2 className={styles.cardTitle}>About CopilotBot</h2>
        <div style={{ lineHeight: 1.7 }}>
          <p>
            CopilotBot helps you track and manage Copilot-generated comments throughout your
            codebase. It scans for common comment markers like TODO, FIXME, HACK, XXX, and NOTE,
            then prepares GitHub issue payloads that can be used to create issues automatically.
          </p>
          <h3 style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
            Features:
          </h3>
          <ul className={styles.capabilities}>
            <li>Scan repository for Copilot-generated comments</li>
            <li>Filter by comment type (FIXME, TODO, HACK, XXX, NOTE)</li>
            <li>Generate GitHub issue payloads with appropriate labels</li>
            <li>Group and prioritize markers by severity</li>
            <li>View detailed summary reports</li>
          </ul>
          <h3 style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
            Workflow:
          </h3>
          <ol style={{ marginLeft: 'var(--space-lg)', lineHeight: 1.7 }}>
            <li>Select which comment types to scan for</li>
            <li>Click &quot;Scan Repository&quot; to find all markers</li>
            <li>Review the results and generated issue templates</li>
            <li>Use the issue templates to create GitHub issues (manual or automated)</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default CopilotBot
