import {
  analyzeMonitoringPlan,
  getApplicableLimits,
  getCSAPRProgramsForState,
  getSeverityColor,
  isRGGIApplicable,
  type EmissionLimit,
} from '@/services/compliance-data'
import type {
  ComplianceGap,
  QARequirement as MCPQARequirement,
  MethodRecommendation,
  MonitoringPlanAnalysisOutput,
  Pollutant,
  SuggestedFormula,
} from '@/types/mcp'
import type {
  ApplicableRegulationItem,
  CalculationItem,
  ComplianceReport,
  EmissionLimitItem,
  MissingDataItem,
  MonitoringParameterGroup,
  QATestMatrixItem,
  RecordkeepingItem,
  ReportingScheduleItem,
} from '@/types/orchestration'
import { useState } from 'react'
import styles from './ComplianceReport.module.css'

/**
 * Extract pollutants from the compliance report for MCP analysis
 */
function extractPollutantsFromReport(report: ComplianceReport): Pollutant[] {
  const pollutants = new Set<Pollutant>()

  // Extract from monitoring parameters
  for (const param of report.monitoringByParameter) {
    const normalized = param.parameter.toUpperCase()
    if (['SO2', 'NOX', 'CO2', 'CO', 'HG', 'HCL', 'HF', 'PM'].includes(normalized)) {
      pollutants.add(normalized as Pollutant)
    }
  }

  // Extract from emission limits (uses 'parameter' field)
  for (const limit of report.limits) {
    const normalized = limit.parameter.toUpperCase()
    if (['SO2', 'NOX', 'CO2', 'CO', 'HG', 'HCL', 'HF', 'PM'].includes(normalized)) {
      pollutants.add(normalized as Pollutant)
    }
  }

  // Default to common pollutants if none found
  if (pollutants.size === 0) {
    return ['SO2', 'NOx', 'CO2'] as Pollutant[]
  }

  return Array.from(pollutants)
}

interface ComplianceReportDisplayProps {
  report: ComplianceReport
  stateCode?: string | undefined // Facility state for state-specific regulation matching
  fuelTypes?: string[] | undefined // Facility fuel types for limit matching
  onQuestionClick?: (question: string) => void
  onSendToRequirementsBot?: () => void
}

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultExpanded?: boolean
}

function CollapsibleSection({
  title,
  children,
  defaultExpanded = true,
}: CollapsibleSectionProps): React.ReactElement {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className={styles.collapsibleSection}>
      <button
        className={styles.collapsibleHeader}
        onClick={() => {
          setExpanded(!expanded)
        }}
        aria-expanded={expanded}
      >
        <h3 className={styles.collapsibleTitle}>{title}</h3>
        <span className={styles.collapsibleIcon}>{expanded ? '▼' : '▶'}</span>
      </button>
      {expanded && <div className={styles.collapsibleContent}>{children}</div>}
    </div>
  )
}

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString()
  } catch {
    return isoString
  }
}

function ProgramBadge({ program }: { program: string }): React.ReactElement {
  const programKey = program.toLowerCase().replace(/[^a-z]/g, '')
  const colorClassName = `programBadge${programKey.charAt(0).toUpperCase()}${programKey.slice(1)}`
  const colorClass = styles[colorClassName] ?? styles.programBadgeDefault

  return <span className={`${styles.programBadge} ${colorClass}`}>{program}</span>
}

function StatCard({ value, label }: { value: number | string; label: string }): React.ReactElement {
  return (
    <div className={styles.statCard}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}

/**
 * Enhanced state-specific program display using MCP data
 */
function StateSpecificProgramsSection({
  stateCode,
  fuelTypes,
}: {
  stateCode: string
  fuelTypes: string[]
}): React.ReactElement {
  const csaprPrograms = getCSAPRProgramsForState(stateCode)
  const hasRGGI = isRGGIApplicable(stateCode)
  const applicableLimits = getApplicableLimits({ fuelTypes })

  // Group CSAPR programs by type
  const noxAnnual = csaprPrograms.filter((p) => p.includes('NOX_ANNUAL'))
  const noxOzone = csaprPrograms.filter((p) => p.includes('OZONE'))
  const so2 = csaprPrograms.filter((p) => p.includes('SO2'))

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="mb-2 font-semibold text-blue-900">State: {stateCode}</h4>

        {/* CSAPR Programs */}
        {csaprPrograms.length > 0 && (
          <div className="mb-3">
            <span className="text-sm font-medium text-blue-800">CSAPR Trading Programs:</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {noxAnnual.length > 0 && (
                <span className="rounded bg-orange-100 px-2 py-1 text-xs text-orange-800">
                  NOx Annual ({noxAnnual.length})
                </span>
              )}
              {noxOzone.length > 0 && (
                <span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                  NOx Ozone Season ({noxOzone.length} groups)
                </span>
              )}
              {so2.length > 0 && (
                <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-800">
                  SO2 ({so2.length} groups)
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-blue-600">Programs: {csaprPrograms.join(', ')}</p>
          </div>
        )}

        {csaprPrograms.length === 0 && (
          <p className="text-sm text-gray-600">State not subject to CSAPR trading programs</p>
        )}

        {/* RGGI */}
        {hasRGGI && (
          <div className="mt-2 rounded bg-teal-100 px-2 py-1">
            <span className="text-sm font-medium text-teal-800">
              ✓ RGGI Participating State - CO2 cap-and-trade applies
            </span>
          </div>
        )}

        {/* Applicable Limits Count */}
        <div className="mt-3 text-sm text-gray-700">
          <strong>{applicableLimits.length}</strong> emission limits matched based on fuel type
          {fuelTypes.length > 0 && ` (${fuelTypes.join(', ')})`}
        </div>
      </div>
    </div>
  )
}

/**
 * Enhanced emission limits with MCP data matching
 */
function EnhancedEmissionLimitsSection({
  fuelTypes,
  pollutants,
}: {
  fuelTypes: string[]
  pollutants?: string[] | undefined
}): React.ReactElement {
  // Only pass pollutants if defined
  const limits =
    pollutants !== undefined
      ? getApplicableLimits({ fuelTypes, pollutants })
      : getApplicableLimits({ fuelTypes })

  if (limits.length === 0) {
    return <p className="text-gray-500 italic">No matching emission limits for this fuel type</p>
  }

  // Group by regulation
  const byRegulation = limits.reduce(
    (acc, limit) => {
      const reg = limit.regulation
      if (acc[reg] === undefined) {
        acc[reg] = []
      }
      acc[reg].push(limit)
      return acc
    },
    {} as Record<string, EmissionLimit[]>
  )

  return (
    <div className="space-y-4">
      {Object.entries(byRegulation).map(([regulation, regLimits]) => (
        <div key={regulation} className="rounded-lg border border-gray-200 p-4">
          <h4 className="mb-2 font-semibold text-gray-900">{regulation}</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Pollutant
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Limit
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Averaging
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Unit Type
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Citation
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {regLimits.map((limit) => (
                  <tr key={limit.id}>
                    <td className="whitespace-nowrap px-3 py-2 font-medium">{limit.pollutant}</td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-blue-700">
                      {limit.limitValue} {limit.units}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{limit.averagingPeriod ?? '-'}</td>
                    <td className="px-3 py-2 text-gray-600">{limit.unitType}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">{limit.citation ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Compliance Gaps Section - Shows issues identified by MCP analysis
 */
function ComplianceGapsSection({ gaps }: { gaps: ComplianceGap[] }): React.ReactElement {
  if (gaps.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="text-green-800">✓ No compliance gaps identified</p>
      </div>
    )
  }

  const byCategory = gaps.reduce(
    (acc, gap) => {
      const category = gap.category
      if (acc[category] === undefined) {
        acc[category] = []
      }
      acc[category]!.push(gap)
      return acc
    },
    {} as Record<string, ComplianceGap[]>
  )

  return (
    <div className="space-y-4">
      {Object.entries(byCategory).map(([category, categoryGaps]) => (
        <div key={category} className="rounded-lg border border-gray-200 p-4">
          <h4 className="mb-3 font-semibold text-gray-900">{category}</h4>
          <div className="space-y-3">
            {categoryGaps.map((gap) => {
              const colors = getSeverityColor(gap.severity)
              return (
                <div
                  key={gap.gapId}
                  className={`rounded-lg border p-3 ${colors.bg} ${colors.border}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className={`font-medium ${colors.text}`}>{gap.issue}</div>
                      <div className="mt-1 text-sm text-gray-700">{gap.recommendation}</div>
                    </div>
                    <span
                      className={`ml-2 rounded px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
                    >
                      {gap.severity}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <span>Citation: {gap.citation}</span>
                    {gap.affectedPrograms.length > 0 && (
                      <>
                        <span>•</span>
                        <span>Programs: {gap.affectedPrograms.join(', ')}</span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Method Recommendations Section - Shows recommended monitoring methods from MCP
 */
function MethodRecommendationsSection({
  methods,
}: {
  methods: MethodRecommendation[]
}): React.ReactElement {
  if (methods.length === 0) {
    return <p className="text-gray-500 italic">No method recommendations available</p>
  }

  return (
    <div className="space-y-4">
      {methods.map((rec) => (
        <div key={rec.pollutant} className="rounded-lg border border-gray-200 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded bg-blue-100 px-2 py-1 font-mono text-sm font-bold text-blue-800">
              {rec.pollutant}
            </span>
            <span className="text-xs text-gray-500">{rec.citation}</span>
          </div>
          <div className="space-y-3">
            {rec.methods.map((method, i) => (
              <div
                key={i}
                className={`rounded-lg border p-3 ${method.recommended ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{method.method}</span>
                  {method.recommended && (
                    <span className="rounded bg-green-200 px-2 py-0.5 text-xs font-medium text-green-800">
                      Recommended
                    </span>
                  )}
                </div>
                {method.formulas.length > 0 && (
                  <div className="mt-1 text-sm text-gray-600">
                    Formulas: {method.formulas.join(', ')}
                  </div>
                )}
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-green-700">Pros:</span>
                    <ul className="ml-4 list-disc text-gray-600">
                      {method.pros.map((pro, j) => (
                        <li key={j}>{pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-medium text-red-700">Cons:</span>
                    <ul className="ml-4 list-disc text-gray-600">
                      {method.cons.map((con, j) => (
                        <li key={j}>{con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * MCP QA Requirements Section
 */
function MCPQARequirementsSection({
  requirements,
}: {
  requirements: MCPQARequirement[]
}): React.ReactElement {
  if (requirements.length === 0) {
    return <p className="text-gray-500 italic">No QA requirements identified</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
              Test
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
              Frequency
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
              Monitors
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
              Citation
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {requirements.map((req, i) => (
            <tr key={i}>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">{req.test}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{req.frequency}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {req.applicableMonitors.map((m, j) => (
                    <span key={j} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                      {m}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">{req.citation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Suggested Formulas Section - Shows formula recommendations from MCP
 */
function SuggestedFormulasSection({
  formulas,
}: {
  formulas: SuggestedFormula[]
}): React.ReactElement {
  if (formulas.length === 0) {
    return <p className="text-gray-500 italic">No formula suggestions available</p>
  }

  return (
    <div className="space-y-3">
      {formulas.map((formula) => (
        <div key={formula.formulaCode} className="rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-purple-100 px-2 py-1 font-mono text-sm font-bold text-purple-800">
              {formula.formulaCode}
            </span>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              Appendix {formula.appendix}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-700">{formula.description}</p>
          <div className="mt-2 text-xs text-gray-600">
            <span className="font-medium">Parameters:</span> {formula.parameters.join(', ')}
          </div>
          <div className="mt-1 text-xs text-gray-500 italic">{formula.reason}</div>
        </div>
      ))}
    </div>
  )
}

/**
 * Full MCP Analysis Section - Runs analyzeMonitoringPlan and displays results
 */
function MCPAnalysisSection({
  stateCode,
  fuelTypes,
  pollutants,
}: {
  stateCode: string
  fuelTypes: string[]
  pollutants: Pollutant[]
}): React.ReactElement {
  // Run the MCP analysis
  const analysis: MonitoringPlanAnalysisOutput = analyzeMonitoringPlan({
    stateCode,
    unitType: 'EGU',
    fuelTypes: fuelTypes as import('@/types/mcp').FuelType[],
    pollutants,
  })

  return (
    <div className="space-y-6">
      {/* Compliance Gaps */}
      <div>
        <h4 className="mb-2 text-lg font-semibold text-gray-800">Compliance Gaps</h4>
        <ComplianceGapsSection gaps={analysis.gaps} />
      </div>

      {/* Method Recommendations */}
      <div>
        <h4 className="mb-2 text-lg font-semibold text-gray-800">Method Recommendations</h4>
        <MethodRecommendationsSection methods={analysis.recommendedMethods} />
      </div>

      {/* QA Requirements */}
      <div>
        <h4 className="mb-2 text-lg font-semibold text-gray-800">QA Requirements</h4>
        <MCPQARequirementsSection requirements={analysis.qaRequirements} />
      </div>

      {/* Suggested Formulas */}
      <div>
        <h4 className="mb-2 text-lg font-semibold text-gray-800">Suggested Formulas</h4>
        <SuggestedFormulasSection formulas={analysis.suggestedFormulas} />
      </div>
    </div>
  )
}

function ApplicableRegulationsSection({
  regulations,
}: {
  regulations: ApplicableRegulationItem[]
}): React.ReactElement {
  if (regulations.length === 0) {
    return <p className={styles.emptyState}>No applicable regulations</p>
  }

  return (
    <div className={styles.sectionList}>
      {regulations.map((reg) => (
        <div key={reg.id} className={styles.sectionCard}>
          <div className={styles.sectionCardHeader}>
            <div className={styles.inlineItems}>
              <span
                className={`${styles.mono} ${styles.textLg} ${styles.fontSemibold} ${styles.textBlue600}`}
              >
                {reg.cfr}
              </span>
              <span className={styles.textGray700}>{reg.title}</span>
            </div>
            <ProgramBadge program={reg.program} />
          </div>
          <p className={styles.description}>{reg.applicabilityReason}</p>
          {reg.keyRequirements.length > 0 && (
            <ul className={styles.bulletList}>
              {reg.keyRequirements.map((req, i) => (
                <li key={i}>{req}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

function MonitoringSection({
  parameters,
}: {
  parameters: MonitoringParameterGroup[]
}): React.ReactElement {
  if (parameters.length === 0) {
    return <p className={styles.emptyState}>No monitoring requirements</p>
  }

  return (
    <div className={styles.sectionList}>
      {parameters.map((param) => (
        <div key={param.parameter} className={styles.sectionCard}>
          <div className={styles.inlineItems}>
            <span className={styles.paramBadge}>{param.parameter}</span>
            <span className={styles.textGray700}>{param.displayName}</span>
          </div>
          <div className={styles.sectionList}>
            {param.methods.map((method, i) => (
              <div key={i} className={styles.methodItem}>
                <div className={styles.methodHeader}>
                  <span className={styles.methodBadge}>{method.methodCode}</span>
                  <span className={`${styles.textSm} ${styles.textGray700}`}>
                    {method.description}
                  </span>
                </div>
                <div className={styles.methodMeta}>
                  <span>Frequency: {method.frequency}</span>
                  <span>•</span>
                  <span>{method.dataQualityRequirements}</span>
                </div>
                <div className={styles.regulatoryBasis}>{method.regulatoryBasis}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function QATestMatrixSection({ tests }: { tests: QATestMatrixItem[] }): React.ReactElement {
  if (tests.length === 0) {
    return <p className={styles.emptyState}>No QA tests required</p>
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead className={styles.tableHead}>
          <tr>
            <th scope="col">Test</th>
            <th scope="col">Parameters</th>
            <th scope="col">Frequency</th>
            <th scope="col">Pass Criteria</th>
            <th scope="col">If Failed</th>
          </tr>
        </thead>
        <tbody className={styles.tableBody}>
          {tests.map((test) => (
            <tr key={test.testCode}>
              <td>
                <div className={styles.cellPrimary}>{test.testType}</div>
                <div className={styles.cellSecondary}>{test.testCode}</div>
                {test.performanceSpec && (
                  <div className={styles.cellBlue}>{test.performanceSpec}</div>
                )}
              </td>
              <td>
                <div className={styles.tagList}>
                  {test.applicableParameters.map((p) => (
                    <span key={p} className={styles.tag}>
                      {p}
                    </span>
                  ))}
                </div>
              </td>
              <td>{test.frequency}</td>
              <td>{test.passCriteria}</td>
              <td>
                <span className={styles.cellRed}>{test.failureConsequence}</span>
                {test.gracePeroid !== undefined && test.gracePeroid !== '' && (
                  <div className={styles.cellSecondary}>Grace period: {test.gracePeroid}</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CalculationsSection({
  calculations,
}: {
  calculations: CalculationItem[]
}): React.ReactElement {
  if (calculations.length === 0) {
    return <p className={styles.emptyState}>No calculations required</p>
  }

  return (
    <div className={styles.sectionList}>
      {calculations.map((calc, i) => (
        <div key={i} className={styles.sectionCard}>
          <div className={styles.sectionCardHeader}>
            <div className={`${styles.fontMedium} ${styles.textGray900}`}>{calc.name}</div>
            {calc.formulaCode !== undefined && calc.formulaCode !== '' && (
              <span className={styles.formulaBadge}>{calc.formulaCode}</span>
            )}
          </div>
          {/* Equation display - prominent with math styling */}
          {calc.formula !== undefined && calc.formula !== '' && (
            <div className={styles.equationBox}>
              <div className={styles.equationLabel}>Equation</div>
              <div className={styles.equationText}>{calc.formula}</div>
            </div>
          )}
          <p className={styles.description}>{calc.description}</p>
          <div className={styles.twoColGrid}>
            <div>
              <span className={styles.fontMedium}>Inputs:</span> {calc.inputParameters.join(', ')}
            </div>
            <div>
              <span className={styles.fontMedium}>Output:</span> {calc.outputParameter} (
              {calc.outputUnits})
            </div>
            <div>
              <span className={styles.fontMedium}>Frequency:</span> {calc.frequency}
            </div>
            {calc.appendix !== undefined && calc.appendix !== '' && (
              <div>
                <span className={styles.fontMedium}>Reference:</span> {calc.appendix}
              </div>
            )}
          </div>
          <div className={styles.regulatoryBasis}>{calc.regulatoryBasis}</div>
        </div>
      ))}
    </div>
  )
}

function ReportingScheduleSection({
  schedule,
}: {
  schedule: ReportingScheduleItem[]
}): React.ReactElement {
  if (schedule.length === 0) {
    return <p className={styles.emptyState}>No reporting requirements</p>
  }

  return (
    <div className={styles.sectionList}>
      {schedule.map((report, i) => (
        <div key={i} className={styles.sectionCard}>
          <div className={styles.sectionCardHeader}>
            <div className={`${styles.fontMedium} ${styles.textGray900}`}>{report.reportType}</div>
            <span className={`${styles.badge} ${styles.badgeBlue}`}>{report.frequency}</span>
          </div>
          <p className={styles.description}>{report.description}</p>
          <div className={styles.twoColGrid}>
            <div>
              <span className={styles.fontMedium}>Deadline:</span> <span>{report.deadline}</span>
            </div>
            <div>
              <span className={styles.fontMedium}>Submit via:</span>{' '}
              <span className={styles.textBlue600}>{report.submissionMethod}</span>
            </div>
          </div>
          <div>
            <span className={`${styles.textXs} ${styles.fontMedium} ${styles.textGray500}`}>
              Data elements:
            </span>
            <div className={styles.tagList}>
              {report.dataElements.map((elem, j) => (
                <span key={j} className={styles.tag}>
                  {elem}
                </span>
              ))}
            </div>
          </div>
          <div className={styles.regulatoryBasis}>{report.regulatoryBasis}</div>
        </div>
      ))}
    </div>
  )
}

function EmissionLimitsSection({ limits }: { limits: EmissionLimitItem[] }): React.ReactElement {
  if (limits.length === 0) {
    return <p className={styles.emptyState}>No emission limits specified</p>
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead className={styles.tableHead}>
          <tr>
            <th scope="col">Parameter</th>
            <th scope="col">Limit</th>
            <th scope="col">Averaging</th>
            <th scope="col">Program</th>
            <th scope="col">Exceedance</th>
          </tr>
        </thead>
        <tbody className={styles.tableBody}>
          {limits.map((limit, i) => (
            <tr key={i}>
              <td className={styles.cellPrimary}>{limit.parameter}</td>
              <td>
                <span className={`${styles.mono} ${styles.textBlue600}`}>{limit.limitValue}</span>
              </td>
              <td>{limit.averagingPeriod}</td>
              <td>
                <ProgramBadge program={limit.program} />
              </td>
              <td className={styles.cellRed}>{limit.exceedanceConsequence}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MissingDataSection({ procedures }: { procedures: MissingDataItem[] }): React.ReactElement {
  if (procedures.length === 0) {
    return <p className={styles.emptyState}>No missing data procedures defined</p>
  }

  return (
    <div className={styles.sectionList}>
      {procedures.map((proc, i) => (
        <div key={i} className={styles.sectionCard}>
          <div className={styles.inlineItems}>
            <span className={styles.paramBadge}>{proc.parameter}</span>
            <span className={`${styles.textSm} ${styles.textGray700}`}>{proc.scenario}</span>
          </div>
          <div className={styles.twoColGrid}>
            <div>
              <span className={styles.fontMedium}>Method:</span>{' '}
              <span>{proc.substitutionMethod}</span>
            </div>
            <div>
              <span className={styles.fontMedium}>Value:</span>{' '}
              <span>{proc.substitutionValue}</span>
            </div>
          </div>
          <div className={styles.regulatoryBasis}>{proc.regulatoryBasis}</div>
        </div>
      ))}
    </div>
  )
}

function RecordkeepingSection({ records }: { records: RecordkeepingItem[] }): React.ReactElement {
  if (records.length === 0) {
    return <p className={styles.emptyState}>No recordkeeping requirements</p>
  }

  return (
    <div className={styles.sectionList}>
      {records.map((record, i) => (
        <div key={i} className={styles.sectionCard}>
          <div className={styles.sectionCardHeader}>
            <div className={`${styles.fontMedium} ${styles.textGray900}`}>{record.category}</div>
            <span className={`${styles.badge} ${styles.badgeGray}`}>
              Retain: {record.retentionPeriod}
            </span>
          </div>
          <ul className={styles.bulletList}>
            {record.requirements.map((req, j) => (
              <li key={j}>{req}</li>
            ))}
          </ul>
          {record.format !== undefined && record.format !== '' && (
            <div className={`${styles.textXs} ${styles.textGray500}`}>Format: {record.format}</div>
          )}
          <div className={styles.regulatoryBasis}>{record.regulatoryBasis}</div>
        </div>
      ))}
    </div>
  )
}

export function ComplianceReportDisplay({
  report,
  stateCode,
  fuelTypes,
  onQuestionClick,
  onSendToRequirementsBot,
}: ComplianceReportDisplayProps): React.ReactElement {
  // Determine if we have facility context for enhanced display
  const hasEnhancedContext = stateCode !== undefined && stateCode !== ''
  const effectiveFuelTypes = fuelTypes ?? []

  return (
    <div className={styles.reportContainer}>
      {/* Header */}
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div>
            <h2 className={styles.facilityName}>{report.facilityName}</h2>
            <div className={styles.headerMeta}>
              <span>ORIS Code: {report.orisCode}</span>
              {stateCode !== undefined && stateCode !== '' && (
                <>
                  <span>•</span>
                  <span>State: {stateCode}</span>
                </>
              )}
              <span>•</span>
              <span>Generated: {formatDate(report.generatedAt)}</span>
            </div>
          </div>
          {onSendToRequirementsBot !== undefined && (
            <button onClick={onSendToRequirementsBot} className={styles.sendButton}>
              Send to RequirementsBot →
            </button>
          )}
        </div>

        {/* Programs */}
        <div className={styles.programBadges}>
          {report.summary.programs.map((program) => (
            <ProgramBadge key={program} program={program} />
          ))}
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <StatCard value={report.summary.totalRegulations} label="Regulations" />
          <StatCard value={report.summary.totalMonitoringParameters} label="Parameters" />
          <StatCard value={report.summary.totalQATests} label="QA Tests" />
          <StatCard value={report.summary.totalCalculations} label="Calculations" />
          <StatCard value={report.summary.totalReports} label="Reports" />
          <StatCard value={report.summary.totalLimits} label="Limits" />
        </div>

        {/* Highlights */}
        {report.summary.highlights.length > 0 && (
          <div className={styles.highlights}>
            <h3 className={styles.highlightsTitle}>Key Highlights</h3>
            <ul className={styles.highlightsList}>
              {report.summary.highlights.map((highlight, i) => (
                <li key={i} className={styles.highlightItem}>
                  <span className={styles.highlightBullet}>•</span>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Collapsible Sections */}
      <CollapsibleSection title="Applicable Regulations">
        <ApplicableRegulationsSection regulations={report.applicableRegulations} />
      </CollapsibleSection>

      <CollapsibleSection title="Monitoring Requirements">
        <MonitoringSection parameters={report.monitoringByParameter} />
      </CollapsibleSection>

      <CollapsibleSection title="QA Test Requirements">
        <QATestMatrixSection tests={report.qaTestMatrix} />
      </CollapsibleSection>

      <CollapsibleSection title="Calculations">
        <CalculationsSection calculations={report.calculations} />
      </CollapsibleSection>

      <CollapsibleSection title="Reporting Schedule">
        <ReportingScheduleSection schedule={report.reportingSchedule} />
      </CollapsibleSection>

      <CollapsibleSection title="Emission Limits">
        <EmissionLimitsSection limits={report.limits} />
      </CollapsibleSection>

      {/* MCP Analysis - Gaps, Methods, QA, Formulas - only if we have enhanced context */}
      {hasEnhancedContext && (
        <CollapsibleSection title="📊 Gap Analysis & Recommendations" defaultExpanded={false}>
          <MCPAnalysisSection
            stateCode={stateCode}
            fuelTypes={effectiveFuelTypes}
            pollutants={extractPollutantsFromReport(report)}
          />
        </CollapsibleSection>
      )}

      <CollapsibleSection title="Missing Data Procedures">
        <MissingDataSection procedures={report.missingDataProcedures} />
      </CollapsibleSection>

      <CollapsibleSection title="Recordkeeping">
        <RecordkeepingSection records={report.recordkeeping} />
      </CollapsibleSection>

      {/* Suggested Questions - contextual follow-ups based on the report */}
      {report.suggestedQuestions.length > 0 && (
        <div className={styles.suggestedQuestions}>
          <h3 className={styles.suggestedQuestionsTitle}>Questions You Might Ask</h3>
          <div className={styles.questionButtons}>
            {report.suggestedQuestions.map((question, i) => (
              <button
                key={i}
                onClick={() => {
                  onQuestionClick?.(question)
                }}
                className={styles.questionButton}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
