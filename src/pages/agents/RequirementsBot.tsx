import { RequirementsBotService } from '@/agents/requirementsbot'
import type {
  DAHSProfile,
  GapAnalysis,
  GapStatus,
  RegsBotToRequirementsBotContext,
} from '@/types/orchestration'
import { extractObligationsFromReport } from '@/types/orchestration'
import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import styles from './AgentPage.module.css'

// Default DAHS profile for gap analysis
const DEFAULT_DAHS_PROFILE: DAHSProfile = {
  id: 'default-profile',
  name: 'Standard DAHS',
  version: '1.0',
  capabilities: [
    {
      id: 'cap-cem-so2',
      name: 'SO2 CEMS Monitoring',
      category: 'monitoring',
      description: 'Continuous SO2 monitoring via CEMS',
      parameters: ['SO2'],
      configurable: true,
    },
    {
      id: 'cap-cem-nox',
      name: 'NOx CEMS Monitoring',
      category: 'monitoring',
      description: 'Continuous NOx monitoring via CEMS',
      parameters: ['NOx'],
      configurable: true,
    },
    {
      id: 'cap-cem-co2',
      name: 'CO2 CEMS Monitoring',
      category: 'monitoring',
      description: 'Continuous CO2 monitoring via CEMS',
      parameters: ['CO2'],
      configurable: true,
    },
    {
      id: 'cap-cem-flow',
      name: 'Flow CEMS Monitoring',
      category: 'monitoring',
      description: 'Continuous flow monitoring via CEMS',
      parameters: ['FLOW'],
      configurable: true,
    },
    {
      id: 'cap-calc-mass',
      name: 'Mass Emissions Calculation',
      category: 'calculation',
      description: 'Calculate mass emissions using Part 75 formulas',
      configurable: true,
    },
    {
      id: 'cap-qa-rata',
      name: 'RATA Test Management',
      category: 'qa',
      description: 'Manage RATA tests and schedules',
      configurable: false,
    },
    {
      id: 'cap-qa-cal',
      name: 'Calibration Management',
      category: 'qa',
      description: 'Daily calibration tracking and alerts',
      configurable: false,
    },
    {
      id: 'cap-report-edr',
      name: 'EDR Reporting',
      category: 'reporting',
      description: 'Electronic Data Report generation',
      configurable: true,
    },
  ],
  supportedParameters: ['SO2', 'NOx', 'CO2', 'FLOW', 'O2', 'OPACITY'],
  supportedCalculations: ['hourly_average', 'daily_average', 'mass_emission', 'heat_input'],
  supportedReports: ['emissions_summary', 'quarterly_excess', 'annual_compliance'],
}

// Status colors and labels
const STATUS_CONFIG: Record<GapStatus, { color: string; bgColor: string; label: string }> = {
  'fully-supported': { color: 'text-green-800', bgColor: 'bg-green-100', label: 'Fully Supported' },
  'config-required': { color: 'text-blue-800', bgColor: 'bg-blue-100', label: 'Config Required' },
  'partial-support': {
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100',
    label: 'Partial Support',
  },
  'not-supported': { color: 'text-red-800', bgColor: 'bg-red-100', label: 'Not Supported' },
  'manual-process': { color: 'text-gray-800', bgColor: 'bg-gray-100', label: 'Manual Process' },
  'needs-review': { color: 'text-orange-800', bgColor: 'bg-orange-100', label: 'Needs Review' },
}

interface GapItemProps {
  gap: GapAnalysis
}

function GapItem({ gap }: GapItemProps): React.ReactElement {
  const config = STATUS_CONFIG[gap.status]

  return (
    <div className="mb-4 rounded-lg border border-gray-200 p-4">
      <div className="mb-2 flex items-start justify-between">
        <div className="flex-1">
          <span className="font-semibold">{gap.obligation.summary}</span>
          <span className="ml-2 text-sm text-gray-500">{gap.obligation.regulatoryBasis}</span>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${config.bgColor} ${config.color}`}
        >
          {config.label}
        </span>
      </div>

      {gap.gapDescription && <p className="mb-2 text-sm text-gray-600">{gap.gapDescription}</p>}

      {gap.recommendedSolution && (
        <div className="mb-2 rounded bg-blue-50 p-2 text-sm">
          <span className="font-medium text-blue-700">Recommended: </span>
          <span className="text-blue-600">{gap.recommendedSolution}</span>
        </div>
      )}

      {gap.developmentEffort &&
        gap.developmentEffort !== 'none' &&
        gap.developmentEffort !== 'configuration' && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">Effort: </span>
            <span
              className={`capitalize ${
                gap.developmentEffort === 'major'
                  ? 'text-red-600'
                  : gap.developmentEffort === 'moderate'
                    ? 'text-yellow-600'
                    : 'text-green-600'
              }`}
            >
              {gap.developmentEffort}
            </span>
          </div>
        )}

      {gap.notes && gap.notes.length > 0 && (
        <ul className="mt-2 list-inside list-disc text-sm text-gray-500">
          {gap.notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface SummaryCardProps {
  value: number
  label: string
  color: string
  onClick?: () => void
  isActive?: boolean
}

function SummaryCard({
  value,
  label,
  color,
  onClick,
  isActive,
}: SummaryCardProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border-2 p-4 text-center transition-all ${
        isActive ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
      } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </button>
  )
}

function RequirementsBot(): React.JSX.Element {
  const location = useLocation()
  const context = location.state as RegsBotToRequirementsBotContext | undefined

  const [activeFilter, setActiveFilter] = useState<GapStatus | 'all'>('all')

  // Run gap analysis on received context
  const { gapResults, summary } = useMemo(() => {
    if (!context?.complianceReport) {
      return { gapResults: [], summary: null }
    }

    const service = new RequirementsBotService(DEFAULT_DAHS_PROFILE)

    // Extract obligations from the report if not provided
    const obligations =
      context.extractedObligations.length > 0
        ? context.extractedObligations
        : extractObligationsFromReport(context.complianceReport)

    const results = service.analyzeAllObligations(obligations)

    // Calculate summary
    const summaryData = {
      fullySupported: results.filter((g) => g.status === 'fully-supported').length,
      configRequired: results.filter((g) => g.status === 'config-required').length,
      partialSupport: results.filter((g) => g.status === 'partial-support').length,
      notSupported: results.filter((g) => g.status === 'not-supported').length,
      manualProcess: results.filter((g) => g.status === 'manual-process').length,
      needsReview: results.filter((g) => g.status === 'needs-review').length,
    }

    return { gapResults: results, summary: summaryData }
  }, [context])

  // Filter gaps based on active filter
  const filteredGaps = useMemo(() => {
    if (activeFilter === 'all') return gapResults
    return gapResults.filter((g) => g.status === activeFilter)
  }, [gapResults, activeFilter])

  // If no context, show placeholder
  if (!context?.complianceReport) {
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
              <li>Perform gap analysis against DAHS capabilities</li>
            </ul>
          </section>

          <section className={styles.card}>
            <div className={styles.placeholder}>
              <div className={styles.placeholderIcon}>📊</div>
              <p>No Compliance Report Loaded</p>
              <p className="mt-2 text-sm text-gray-500">
                Generate a report in RegsBot, then click "Send to RequirementsBot" to run gap
                analysis.
              </p>
              <Link
                to="/agents/regs"
                className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Go to RegsBot
              </Link>
            </div>
          </section>
        </div>
      </div>
    )
  }

  const report = context.complianceReport

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

      <div className="p-6">
        {/* Facility Info Bar */}
        <div className="mb-6 flex items-center justify-between rounded-lg bg-gray-100 p-4">
          <div>
            <h2 className="text-xl font-bold">{report.facilityName}</h2>
            <p className="text-sm text-gray-600">ORIS Code: {report.orisCode}</p>
          </div>
          <div className="flex gap-4">
            <Link
              to="/agents/regs"
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-200"
            >
              ← Back to RegsBot
            </Link>
            <button className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700">
              Export to ADO
            </button>
          </div>
        </div>

        {/* Gap Analysis Section */}
        <section className="mb-6">
          <h2 className="mb-4 text-2xl font-bold">Gap Analysis</h2>

          {/* Summary Cards */}
          {summary && (
            <div className="mb-6 grid grid-cols-3 gap-4 sm:grid-cols-6">
              <SummaryCard
                value={summary.fullySupported}
                label="Fully Supported"
                color="text-green-600"
                onClick={() => {
                  setActiveFilter(activeFilter === 'fully-supported' ? 'all' : 'fully-supported')
                }}
                isActive={activeFilter === 'fully-supported'}
              />
              <SummaryCard
                value={summary.configRequired}
                label="Config Required"
                color="text-blue-600"
                onClick={() => {
                  setActiveFilter(activeFilter === 'config-required' ? 'all' : 'config-required')
                }}
                isActive={activeFilter === 'config-required'}
              />
              <SummaryCard
                value={summary.partialSupport}
                label="Partial Support"
                color="text-yellow-600"
                onClick={() => {
                  setActiveFilter(activeFilter === 'partial-support' ? 'all' : 'partial-support')
                }}
                isActive={activeFilter === 'partial-support'}
              />
              <SummaryCard
                value={summary.notSupported}
                label="Not Supported"
                color="text-red-600"
                onClick={() => {
                  setActiveFilter(activeFilter === 'not-supported' ? 'all' : 'not-supported')
                }}
                isActive={activeFilter === 'not-supported'}
              />
              <SummaryCard
                value={summary.manualProcess}
                label="Manual Process"
                color="text-gray-600"
                onClick={() => {
                  setActiveFilter(activeFilter === 'manual-process' ? 'all' : 'manual-process')
                }}
                isActive={activeFilter === 'manual-process'}
              />
              <SummaryCard
                value={summary.needsReview}
                label="Needs Review"
                color="text-orange-600"
                onClick={() => {
                  setActiveFilter(activeFilter === 'needs-review' ? 'all' : 'needs-review')
                }}
                isActive={activeFilter === 'needs-review'}
              />
            </div>
          )}

          {/* Filter indicator */}
          {activeFilter !== 'all' && (
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              <span>Showing: {STATUS_CONFIG[activeFilter].label}</span>
              <button
                onClick={() => {
                  setActiveFilter('all')
                }}
                className="text-blue-600 hover:underline"
              >
                Clear filter
              </button>
            </div>
          )}

          {/* Gap Items */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            {filteredGaps.length === 0 ? (
              <p className="text-center text-gray-500">No obligations to analyze</p>
            ) : (
              filteredGaps.map((gap) => <GapItem key={gap.obligationId} gap={gap} />)
            )}
          </div>
        </section>

        {/* Development Items Section */}
        {summary && summary.notSupported + summary.partialSupport > 0 && (
          <section className="mb-6">
            <h2 className="mb-4 text-xl font-bold">Development Backlog</h2>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="mb-4 text-gray-600">
                {summary.notSupported + summary.partialSupport} items require development work.
              </p>
              <button className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700">
                Export Development Items
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default RequirementsBot
