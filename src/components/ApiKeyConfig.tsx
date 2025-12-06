/**
 * API Key Configuration Component
 *
 * Allows users to:
 * 1. Enter their EPA ECMPS API key (session-only, not persisted)
 * 2. Choose data source: Live API, Demo Data, or Upload JSON
 *
 * The API key is kept in React state only - it's cleared when the page refreshes.
 * This is intentional for security: users must re-enter the key each session.
 */

import { useCallback, useEffect, useState } from 'react'
import styles from './ApiKeyConfig.module.css'

// ============================================================================
// TYPES
// ============================================================================

export type DataSource = 'api' | 'demo' | 'upload'

export interface ApiConfig {
  dataSource: DataSource
  apiKey: string
  hasApiKey: boolean
}

interface ApiKeyConfigProps {
  onConfigChange: (config: ApiConfig) => void
  showDataSourceSelector?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ApiKeyConfig({
  onConfigChange,
  showDataSourceSelector = true,
}: ApiKeyConfigProps): React.JSX.Element {
  const [dataSource, setDataSource] = useState<DataSource>('demo')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)

  // Notify parent of config changes
  const notifyConfigChange = useCallback(() => {
    onConfigChange({
      dataSource,
      apiKey: dataSource === 'api' ? apiKey : '',
      hasApiKey: dataSource !== 'api' || apiKey.trim() !== '',
    })
  }, [dataSource, apiKey, onConfigChange])

  useEffect(() => {
    notifyConfigChange()
  }, [notifyConfigChange])

  const handleDataSourceChange = (source: DataSource): void => {
    setDataSource(source)
  }

  const maskApiKey = (key: string): string => {
    if (key.length <= 8) return '••••••••'
    return key.slice(0, 4) + '••••••••' + key.slice(-4)
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        <span className={styles.icon}>🔑</span>
        Data Source Configuration
      </h3>

      {showDataSourceSelector && (
        <div className={styles.sourceSelector}>
          <label className={styles.label}>Choose your data source:</label>
          <div className={styles.options}>
            <button
              type="button"
              className={`${styles.option} ${dataSource === 'api' ? styles.selected : ''}`}
              onClick={() => {
                handleDataSourceChange('api')
              }}
            >
              <span className={styles.optionIcon}>🌐</span>
              <span className={styles.optionLabel}>Live EPA API</span>
              <span className={styles.optionDesc}>Real-time facility data</span>
            </button>

            <button
              type="button"
              className={`${styles.option} ${dataSource === 'demo' ? styles.selected : ''}`}
              onClick={() => {
                handleDataSourceChange('demo')
              }}
            >
              <span className={styles.optionIcon}>📋</span>
              <span className={styles.optionLabel}>Demo Data</span>
              <span className={styles.optionDesc}>Sample facilities (ORIS 3, 8, 2650)</span>
            </button>

            <button
              type="button"
              className={`${styles.option} ${dataSource === 'upload' ? styles.selected : ''}`}
              onClick={() => {
                handleDataSourceChange('upload')
              }}
            >
              <span className={styles.optionIcon}>📁</span>
              <span className={styles.optionLabel}>Upload JSON</span>
              <span className={styles.optionDesc}>Import monitoring plan file</span>
            </button>
          </div>
        </div>
      )}

      {dataSource === 'api' && (
        <div className={styles.apiKeySection}>
          <label className={styles.label}>
            EPA ECMPS API Key
            <a
              href="https://www.epa.gov/airmarkets/cam-api-portal"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.helpLink}
            >
              Get API Key →
            </a>
          </label>

          <div className={styles.keyInput}>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value)
              }}
              placeholder="Enter your API key..."
              className={styles.input}
            />
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => {
                setShowKey(!showKey)
              }}
            >
              {showKey ? '🙈' : '👁️'}
            </button>
          </div>

          {apiKey.trim() !== '' && (
            <div className={styles.keyStatus}>
              <span className={styles.checkmark}>✓</span>
              Key entered: {showKey ? apiKey : maskApiKey(apiKey)}
            </div>
          )}

          <p className={styles.note}>
            Your API key is kept in memory only and will be cleared when you refresh the page.
          </p>
        </div>
      )}

      {dataSource === 'demo' && (
        <div className={styles.demoInfo}>
          <p>
            <strong>Demo mode</strong> uses sample data for these facilities:
          </p>
          <ul>
            <li>
              <strong>ORIS 3</strong> - Barry (Alabama Power)
            </li>
            <li>
              <strong>ORIS 8</strong> - Gorgas (Alabama Power)
            </li>
            <li>
              <strong>ORIS 2650</strong> - Sample multi-unit facility
            </li>
          </ul>
        </div>
      )}

      {dataSource === 'upload' && (
        <div className={styles.uploadSection}>
          <p>Upload a monitoring plan JSON file exported from ECMPS.</p>
          <label className={styles.uploadLabel}>
            <input
              type="file"
              accept=".json"
              className={styles.fileInput}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file !== undefined) {
                  // TODO: Handle file upload
                  console.warn('File upload handler not implemented:', file.name)
                }
              }}
            />
            <span className={styles.uploadBtn}>📂 Choose File</span>
          </label>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// COMPACT DATA SOURCE SELECTOR (for inline use)
// ============================================================================

interface DataSourceSelectorProps {
  value: DataSource
  onChange: (source: DataSource) => void
  disabled?: boolean
}

export function DataSourceSelector({
  value,
  onChange,
  disabled = false,
}: DataSourceSelectorProps): React.JSX.Element {
  return (
    <div className={styles.compactSelector}>
      <button
        type="button"
        className={`${styles.compactOption} ${value === 'api' ? styles.selected : ''}`}
        onClick={() => {
          onChange('api')
        }}
        disabled={disabled}
        title="Live EPA API"
      >
        🌐
      </button>
      <button
        type="button"
        className={`${styles.compactOption} ${value === 'demo' ? styles.selected : ''}`}
        onClick={() => {
          onChange('demo')
        }}
        disabled={disabled}
        title="Demo Data"
      >
        📋
      </button>
      <button
        type="button"
        className={`${styles.compactOption} ${value === 'upload' ? styles.selected : ''}`}
        onClick={() => {
          onChange('upload')
        }}
        disabled={disabled}
        title="Upload JSON"
      >
        📁
      </button>
    </div>
  )
}

// ============================================================================
// HOOK FOR CONSUMING CONFIG
// ============================================================================

export function useApiConfig(): {
  config: ApiConfig
  setConfig: React.Dispatch<React.SetStateAction<ApiConfig>>
  canUseLiveApi: boolean
} {
  const [config, setConfig] = useState<ApiConfig>({
    dataSource: 'demo',
    apiKey: '',
    hasApiKey: false,
  })

  const canUseLiveApi = config.dataSource === 'api' && config.apiKey.trim() !== ''

  return { config, setConfig, canUseLiveApi }
}

export default ApiKeyConfig
