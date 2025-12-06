import type { ComplianceReport, RegsBotQueryType, RegsBotResponse } from '@/types/orchestration'
import { extractObligationsFromReport } from '@/types/orchestration'
import { RegsBotService } from '@agents/regsbot/index'
import { ComplianceReportDisplay } from '@components/ComplianceReport'
import { FacilitySelector, type SelectedFacility } from '@components/FacilitySelector'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './AgentPage.module.css'

// Create a singleton instance
const regsBot = new RegsBotService()

// Query type options for the dropdown
const QUERY_TYPES: { value: RegsBotQueryType; label: string }[] = [
  { value: 'general', label: '💬 General Question' },
  { value: 'what-to-monitor', label: '📊 What to Monitor' },
  { value: 'qa-requirements', label: '🧪 QA/QC Requirements' },
  { value: 'what-to-calculate', label: '🔢 Calculations Required' },
  { value: 'reporting-requirements', label: '📄 Reporting Requirements' },
  { value: 'applicable-regulations', label: '📚 Applicable Regulations' },
  { value: 'emission-limits', label: '⚡ Emission Limits' },
  { value: 'missing-data', label: '🔄 Missing Data Procedures' },
  { value: 'what-to-record', label: '📁 Recordkeeping' },
]

function RegsBot(): React.JSX.Element {
  const navigate = useNavigate()
  const [question, setQuestion] = useState('')
  const [queryType, setQueryType] = useState<RegsBotQueryType>('general')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<RegsBotResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [facility, setFacility] = useState<SelectedFacility | null>(null)
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [reportExpanded, setReportExpanded] = useState(true)

  // Track which ORIS code we've generated a report for to avoid re-generating
  const lastReportOrisRef = useRef<number | null>(null)

  // Check if a facility is selected and full plan is loaded
  const hasFacility = facility?.fullPlan !== null && facility?.fullPlan !== undefined

  // Auto-generate report when a new facility with a plan is selected
  useEffect(() => {
    if (
      hasFacility &&
      facility?.orisCode !== undefined &&
      facility?.orisCode !== null &&
      facility.orisCode !== lastReportOrisRef.current &&
      !generatingReport
    ) {
      lastReportOrisRef.current = facility.orisCode
      void (async () => {
        setGeneratingReport(true)
        setError(null)
        try {
          const report = await regsBot.generateComplianceReport(facility.orisCode!, facility.apiKey)
          setComplianceReport(report)
          setReportExpanded(true)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to generate report')
        } finally {
          setGeneratingReport(false)
        }
      })()
    }
  }, [hasFacility, facility?.orisCode, facility?.apiKey, generatingReport])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!question.trim() && queryType === 'general') return

    setLoading(true)
    setError(null)

    try {
      const input: Parameters<typeof regsBot.ask>[0] = {}
      if (question.trim()) {
        input.question = question.trim()
      }
      if (queryType !== 'general') {
        input.queryType = queryType
      }
      // Include full facility context with monitoring plan if available
      if (facility?.fullPlan !== null && facility?.fullPlan !== undefined) {
        const ctx: import('@/types/orchestration').RegsBotContext = {
          orisCode: facility.orisCode ?? 0,
          monitoringPlan: facility.fullPlan
            .data as unknown as import('@/types/ecmps-api').MonitoringPlan,
        }
        if (facility.facilityName !== null && facility.facilityName !== '')
          ctx.facilityName = facility.facilityName
        if (
          facility.locationInfo?.locationId !== undefined &&
          facility.locationInfo.locationId !== ''
        )
          ctx.locationId = facility.locationInfo.locationId
        else if (facility.selectedLocationId !== null && facility.selectedLocationId !== '')
          ctx.locationId = facility.selectedLocationId
        if (facility.locationInfo?.locationType !== undefined)
          ctx.locationType = facility.locationInfo.locationType
        if (
          facility.locationInfo?.unitId !== undefined &&
          facility.locationInfo.unitId !== null &&
          facility.locationInfo.unitId !== ''
        )
          ctx.unitId = facility.locationInfo.unitId
        if (
          facility.locationInfo?.stackPipeId !== undefined &&
          facility.locationInfo.stackPipeId !== null &&
          facility.locationInfo.stackPipeId !== ''
        )
          ctx.stackPipeId = facility.locationInfo.stackPipeId
        if (facility.stateCode !== null && facility.stateCode !== '')
          ctx.stateCode = facility.stateCode
        if (facility.facilityInfo?.programCodes !== undefined)
          ctx.programs = facility.facilityInfo.programCodes
        else if (facility.locationInfo?.programCodes !== undefined)
          ctx.programs = facility.locationInfo.programCodes
        if (facility.locationInfo?.parameters !== undefined)
          ctx.parameters = facility.locationInfo.parameters
        input.context = ctx
      } else if (facility?.orisCode !== null && facility?.orisCode !== undefined) {
        const ctx: import('@/types/orchestration').RegsBotContext = { orisCode: facility.orisCode }
        if (facility.facilityName !== null && facility.facilityName !== '')
          ctx.facilityName = facility.facilityName
        if (facility.stateCode !== null && facility.stateCode !== '')
          ctx.stateCode = facility.stateCode
        input.context = ctx
      }
      const result = await regsBot.ask(input)
      setResponse(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickQuestion = async (q: string): Promise<void> => {
    setQuestion(q)
    setQueryType('general')
    setLoading(true)
    setError(null)

    try {
      const input: Parameters<typeof regsBot.ask>[0] = { question: q }
      if (facility?.fullPlan !== null && facility?.fullPlan !== undefined) {
        const ctx: import('@/types/orchestration').RegsBotContext = {
          orisCode: facility.orisCode ?? 0,
          monitoringPlan: facility.fullPlan
            .data as unknown as import('@/types/ecmps-api').MonitoringPlan,
        }
        if (facility.facilityName !== null && facility.facilityName !== '')
          ctx.facilityName = facility.facilityName
        if (
          facility.locationInfo?.locationId !== undefined &&
          facility.locationInfo.locationId !== ''
        )
          ctx.locationId = facility.locationInfo.locationId
        else if (facility.selectedLocationId !== null && facility.selectedLocationId !== '')
          ctx.locationId = facility.selectedLocationId
        if (facility.locationInfo?.locationType !== undefined)
          ctx.locationType = facility.locationInfo.locationType
        if (
          facility.locationInfo?.unitId !== undefined &&
          facility.locationInfo.unitId !== null &&
          facility.locationInfo.unitId !== ''
        )
          ctx.unitId = facility.locationInfo.unitId
        if (
          facility.locationInfo?.stackPipeId !== undefined &&
          facility.locationInfo.stackPipeId !== null &&
          facility.locationInfo.stackPipeId !== ''
        )
          ctx.stackPipeId = facility.locationInfo.stackPipeId
        if (facility.stateCode !== null && facility.stateCode !== '')
          ctx.stateCode = facility.stateCode
        if (facility.facilityInfo?.programCodes !== undefined)
          ctx.programs = facility.facilityInfo.programCodes
        else if (facility.locationInfo?.programCodes !== undefined)
          ctx.programs = facility.locationInfo.programCodes
        if (facility.locationInfo?.parameters !== undefined)
          ctx.parameters = facility.locationInfo.parameters
        input.context = ctx
      } else if (facility?.orisCode !== null && facility?.orisCode !== undefined) {
        const ctx: import('@/types/orchestration').RegsBotContext = { orisCode: facility.orisCode }
        if (facility.facilityName !== null && facility.facilityName !== '')
          ctx.facilityName = facility.facilityName
        if (facility.stateCode !== null && facility.stateCode !== '')
          ctx.stateCode = facility.stateCode
        input.context = ctx
      }
      const result = await regsBot.ask(input)
      setResponse(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async (): Promise<void> => {
    if (facility === null || facility.orisCode === null || facility.orisCode === undefined) return

    setGeneratingReport(true)
    setError(null)

    try {
      const report = await regsBot.generateComplianceReport(facility.orisCode, facility.apiKey)
      setComplianceReport(report)
      setReportExpanded(true)
      lastReportOrisRef.current = facility.orisCode
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setGeneratingReport(false)
    }
  }

  const handleReportQuestionClick = (q: string): void => {
    handleQuickQuestion(q).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'An error occurred')
    })
  }

  const handleSendToRequirementsBot = (): void => {
    if (!complianceReport) return

    navigate('/agents/requirements', {
      state: {
        complianceReport,
        extractedObligations: extractObligationsFromReport(complianceReport),
      },
    })
  }

  return (
    <div className={styles.agentPage}>
      <header className={styles.header}>
        <span className={styles.icon}>📜</span>
        <div className={styles.headerText}>
          <h1 className={styles.title}>RegsBot</h1>
          <p className={styles.subtitle}>EPA Regulatory Knowledge Oracle</p>
        </div>
        <div className={styles.status}>
          <span className={styles.statusDot} />
          <span>Online</span>
        </div>
      </header>

      <div className={styles.content}>
        {/* Facility Selection */}
        <FacilitySelector onSelectionChange={setFacility} />

        {/* Auto-generated Compliance Report (collapsible) */}
        {hasFacility && (
          <section className={styles.card}>
            <button
              type="button"
              className={styles.collapsibleHeader}
              onClick={() => {
                setReportExpanded(!reportExpanded)
              }}
              aria-expanded={reportExpanded}
            >
              <span className={styles.collapsibleTitle}>
                📊 Compliance Report
                {generatingReport && ' — Generating...'}
                {complianceReport && !generatingReport && ' ✓'}
              </span>
              <span className={styles.collapsibleIcon}>{reportExpanded ? '▼' : '▶'}</span>
            </button>

            {reportExpanded && (
              <div className={styles.collapsibleContent}>
                {generatingReport && (
                  <div className={styles.loadingState}>
                    <span className={styles.spinner}>⏳</span>
                    <p>Analyzing monitoring plan and generating compliance report...</p>
                  </div>
                )}

                {!generatingReport && complianceReport && (
                  <ComplianceReportDisplay
                    report={complianceReport}
                    stateCode={facility?.stateCode ?? undefined}
                    fuelTypes={facility?.facilityInfo?.primaryFuels}
                    onQuestionClick={handleReportQuestionClick}
                    onSendToRequirementsBot={handleSendToRequirementsBot}
                  />
                )}

                {!generatingReport && !complianceReport && error && (
                  <div className={styles.error}>
                    <p>Failed to generate report: {error}</p>
                    <button
                      type="button"
                      className={styles.submitButton}
                      onClick={() => void handleGenerateReport()}
                    >
                      🔄 Retry
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Query Input Form */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Ask a Regulatory Question</h2>
          {hasFacility && facility !== null && (
            <p className={styles.contextBadge}>
              📍 Context: {facility.facilityName} ({facility.orisCode})
              {facility.locationInfo !== null && (
                <>
                  {' : '}
                  {facility.locationInfo.locationType === 'stack' ||
                  facility.locationInfo.locationType === 'pipe'
                    ? `Stack/Pipe ${facility.locationInfo.locationId}`
                    : `Unit ${facility.locationInfo.locationId}`}
                </>
              )}{' '}
              — MP Loaded ✓
            </p>
          )}
          <form
            onSubmit={(e) => {
              void handleSubmit(e)
            }}
            className={styles.queryForm}
          >
            <div className={styles.formRow}>
              <label htmlFor="queryType">Query Type:</label>
              <select
                id="queryType"
                value={queryType}
                onChange={(e) => {
                  setQueryType(e.target.value as RegsBotQueryType)
                }}
                className={styles.select}
              >
                {QUERY_TYPES.map((qt) => (
                  <option key={qt.value} value={qt.value}>
                    {qt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formRow}>
              <label htmlFor="question">Your Question:</label>
              <textarea
                id="question"
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value)
                }}
                placeholder={
                  hasFacility
                    ? `Ask about ${facility?.facilityName}...`
                    : 'Select a facility above, or ask a general regulatory question...'
                }
                className={styles.textarea}
                rows={3}
              />
            </div>

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? '🔄 Asking...' : '🔍 Ask RegsBot'}
            </button>
          </form>
        </section>

        {/* Error Display */}
        {error !== null && !generatingReport && (
          <section className={styles.card}>
            <div className={styles.error}>
              <strong>Error:</strong> {error}
            </div>
          </section>
        )}

        {/* Response Display */}
        {response !== null && (
          <>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>
                Answer
                <span className={styles.confidenceBadge} data-confidence={response.confidence}>
                  {response.confidence} confidence
                </span>
              </h2>
              <p className={styles.answer}>{response.answer}</p>

              {response.warnings && response.warnings.length > 0 && (
                <div className={styles.warnings}>
                  {response.warnings.map((warning, i) => (
                    <p key={i} className={styles.warning}>
                      ⚠️ {warning}
                    </p>
                  ))}
                </div>
              )}
            </section>

            {response.citations.length > 0 && (
              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Citations</h2>
                <ul className={styles.citationList}>
                  {response.citations.map((cite, i) => (
                    <li key={i} className={styles.citation}>
                      <strong>{cite.reference}</strong>
                      <span className={styles.citationTitle}>{cite.title}</span>
                      <span className={styles.citationDesc}>{cite.excerpt}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {response.relatedQuestions !== undefined && response.relatedQuestions.length > 0 && (
              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Follow-up Questions</h2>
                <div className={styles.quickQuestions}>
                  {response.relatedQuestions.map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        void handleQuickQuestion(q)
                      }}
                      className={styles.quickButton}
                      disabled={loading}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default RegsBot
