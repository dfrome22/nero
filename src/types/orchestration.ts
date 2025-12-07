/**
 * Core types for NERO Orchestration Layer
 *
 * These types define the workflow builder, run engine, and artifact registry.
 */

// ============================================================================
// ARTIFACTS
// ============================================================================

/** Unique identifier for artifacts */
export type ArtifactId = string

/** Artifact types produced by nodes */
export type ArtifactType =
  | 'EvidenceLibrary'
  | 'RequirementSet'
  | 'TestPlan'
  | 'WireframeSpec'
  | 'DAHSProposal'
  | 'PublishBundle'

/** Base artifact with versioning and metadata */
export interface Artifact<T = unknown> {
  id: ArtifactId
  type: ArtifactType
  version: number
  data: T
  createdAt: string
  createdBy: string
  approved: boolean
  approvedAt?: string
  approvedBy?: string
  approvalComment?: string
}

// ============================================================================
// EVIDENCE
// ============================================================================

/** Source types for evidence */
export type EvidenceSourceType =
  | 'eCFR'
  | 'EPA_Guidance'
  | 'Permit'
  | 'DAHS_Spec'
  | 'SourceCode'
  | 'Manual'

/** Citation location anchor */
export interface CitationAnchor {
  sourceType: EvidenceSourceType
  sourceId: string
  location: string // URL, section, page reference
  excerpt: string
  confidence?: number // For OCR, 0-1
}

/** Evidence item in the library */
export interface EvidenceItem {
  id: string
  sourceType: EvidenceSourceType
  title: string
  content: string
  citations: CitationAnchor[]
  confirmedByHuman: boolean
  createdAt: string
}

/** Evidence Library artifact data */
export interface EvidenceLibraryData {
  items: EvidenceItem[]
  scope: 'project' | 'node'
}

// ============================================================================
// PERMIT PROCESSING
// ============================================================================

/** Permit document metadata */
export interface PermitDocument {
  id: string
  filename: string
  uploadedAt: string
  uploadedBy: string
  pageCount: number
  ocrStatus: 'pending' | 'processing' | 'completed' | 'failed'
  ocrConfidence: number // Overall confidence 0-1
  facilityName?: string
  permitNumber?: string
  effectiveDate?: string
  expirationDate?: string
}

/** OCR result for a single page */
export interface OCRPageResult {
  pageNumber: number
  text: string
  confidence: number
  lowConfidenceRegions: OCRRegion[]
}

/** Region with low OCR confidence requiring human review */
export interface OCRRegion {
  id: string
  pageNumber: number
  boundingBox: { x: number; y: number; width: number; height: number }
  extractedText: string
  confidence: number
  humanCorrectedText?: string
  confirmedBy?: string
  confirmedAt?: string
}

/** Regulatory obligation extracted from permit */
export interface PermitObligation {
  id: string
  permitId: string
  pageReference: string // e.g., "Page 3, Section 2.1"
  originalText: string
  obligationType: ObligationType
  summary: string
  regulatoryBasis?: string // e.g., "40 CFR 60.4"
  frequency?: string // e.g., "hourly", "daily", "quarterly"
  parameters?: string[] // e.g., ["SO2", "NOx", "CO"]
  thresholds?: Record<string, string> // e.g., { "SO2": "< 50 ppm" }
  confidence: number
  confirmedByHuman: boolean
}

/** Types of regulatory obligations */
export type ObligationType =
  | 'monitoring' // Must monitor X parameter
  | 'reporting' // Must report X to agency
  | 'recordkeeping' // Must maintain records of X
  | 'limit' // Must not exceed X threshold
  | 'calculation' // Must calculate X using method Y
  | 'calibration' // Must calibrate equipment per schedule
  | 'notification' // Must notify agency of X event
  | 'testing' // Must perform X test per schedule
  | 'other'

// ============================================================================
// MONITORING PLAN QUERIES - RegsBot Query Interface
// ============================================================================

/** Query types for monitoring plan questions */
export type MonitoringPlanQuestionType =
  | 'subparts' // What regulatory subparts apply?
  | 'parameters' // What parameters are monitored?
  | 'methods' // What monitoring methods are used?
  | 'qa-tests' // What QA tests are required?
  | 'systems' // What monitoring systems are installed?
  | 'qualifications' // What unit qualifications apply?
  | 'summary' // Get a summary of everything

/** Query for asking questions about a monitoring plan */
export interface MonitoringPlanQuery {
  /** Provide JSON monitoring plan directly */
  plan?: import('./ecmps-api').MonitoringPlan
  /** Or fetch by ORIS code */
  orisCode?: number
  /** Filter to specific location (e.g., "7B", "CS001") */
  locationId?: string
  /** Filter to specific unit */
  unitId?: string
  /** What do you want to know? */
  question: MonitoringPlanQuestionType
}

/** Result from a monitoring plan query */
export interface MonitoringPlanQueryResult {
  question: MonitoringPlanQuestionType
  locationId?: string
  unitId?: string
  answer: unknown
  summary: string
}

/** Information about a monitoring location */
export interface LocationInfo {
  locationId: string
  locationType: 'unit' | 'stack' | 'pipe' | 'common'
  unitId?: string
  stackPipeId?: string
  isActive: boolean
  parameters: string[]
  systems: string[]
}

/** Applicable regulatory subpart */
export interface ApplicableSubpart {
  part: number // e.g., 75, 63
  subpart: string // e.g., "A", "UUUUU", "Appendix B"
  title: string
  description: string
  applicableParameters: string[]
  regulatoryBasis: string
}

/** QA Test information */
export interface QATestInfo {
  testType: string
  systemId: string
  parameterCode: string
  frequency: string
  tolerance: string
  regulatoryBasis: string
}

// ============================================================================
// REGSBOT Q&A INTERFACE - Regulatory Knowledge Queries
// ============================================================================

/**
 * Input to RegsBot - can be natural language, structured query, or context
 */
export interface RegsBotInput {
  /** Natural language question (e.g., "What QA tests do I need for SO2?") */
  question?: string

  /** Structured query type */
  queryType?: RegsBotQueryType

  /** Context to help answer the question */
  context?: RegsBotContext

  /** Which sources to search (defaults to all) */
  sources?: RegulatorySource[]

  /** Limit response to specific topics */
  topics?: DAHSTopic[]
}

/** Types of structured queries RegsBot can answer */
export type RegsBotQueryType =
  | 'what-to-monitor' // What parameters must be monitored?
  | 'what-to-calculate' // What calculations are required?
  | 'what-to-record' // What data must be recorded/stored?
  | 'qa-requirements' // What QA/QC tests are required?
  | 'reporting-requirements' // What reports must be submitted?
  | 'applicable-regulations' // What regulations apply?
  | 'emission-limits' // What are the emission limits?
  | 'missing-data' // What are the missing data procedures?
  | 'general' // General regulatory question

/** Regulatory sources RegsBot can search */
export type RegulatorySource =
  | 'ecfr' // Electronic Code of Federal Regulations
  | 'ecmps' // EPA ECMPS/CAMD APIs
  | 'state-permits' // State Title V / Part 70 permits
  | 'epa-guidance' // EPA guidance documents
  | 'monitoring-plan' // Facility monitoring plan (JSON or from API)
  | 'permit-text' // Uploaded permit text/PDF

/** Topics related to DAHS functionality */
export type DAHSTopic =
  | 'monitoring' // Data acquisition, parameters
  | 'calculations' // Hourly averages, heat input, mass emissions
  | 'qa-qc' // Calibration, RATA, CGA, linearity
  | 'reporting' // EDR, quarterly reports, compliance certs
  | 'limits' // Emission limits, exceedance tracking
  | 'substitution' // Missing data procedures
  | 'recordkeeping' // Data retention, audit trails

/** Context provided to help answer the question */
export interface RegsBotContext {
  /** Facility ORIS code (for ECMPS lookup) */
  orisCode?: number

  /** Facility name */
  facilityName?: string

  /** Specific location within facility */
  locationId?: string

  /** Location type: unit or stack/pipe */
  locationType?: 'unit' | 'stack' | 'pipe' | 'common'

  /** Specific unit */
  unitId?: string

  /** Stack or pipe ID */
  stackPipeId?: string

  /** Monitoring plan JSON (if already have it) */
  monitoringPlan?: import('./ecmps-api').MonitoringPlan

  /** Permit text (extracted from PDF or pasted) */
  permitText?: string

  /** Known regulatory programs */
  programs?: string[]

  /** Parameters of interest */
  parameters?: string[]

  /** State (for state-specific regulations) */
  stateCode?: string
}

/** RegsBot's response */
export interface RegsBotResponse {
  /** The original question/query */
  input: RegsBotInput

  /** Natural language answer */
  answer: string

  /** Structured data supporting the answer */
  data: RegsBotResponseData

  /** Sources cited */
  citations: RegulatoryCitation[]

  /** Related questions the user might want to ask */
  relatedQuestions?: string[]

  /** Confidence level */
  confidence: 'high' | 'medium' | 'low'

  /** Warnings or caveats */
  warnings?: string[]
}

/** Structured data in RegsBot response */
export interface RegsBotResponseData {
  /** Applicable regulations */
  regulations?: ApplicableRegulation[]

  /** Monitoring requirements */
  monitoringRequirements?: MonitoringRequirement[]

  /** Calculation requirements */
  calculationRequirements?: CalculationRequirement[]

  /** QA/QC requirements */
  qaRequirements?: QARequirement[]

  /** Reporting requirements */
  reportingRequirements?: ReportingRequirement[]

  /** Emission limits */
  emissionLimits?: EmissionLimit[]

  /** Substitution procedures */
  substitutionRequirements?: SubstitutionRequirement[]

  /** Recordkeeping requirements */
  recordkeepingRequirements?: RecordkeepingRequirement[]
}

/** A specific regulation that applies */
export interface ApplicableRegulation {
  cfr: string // e.g., "40 CFR 75"
  part: number
  subpart?: string
  section?: string
  title: string
  description: string
  url?: string
  applicability: string // Why it applies
}

/** Citation to a regulatory source */
export interface RegulatoryCitation {
  source: RegulatorySource
  reference: string // e.g., "40 CFR 75.10(a)(1)"
  title: string
  excerpt: string
  url?: string
}

// ============================================================================
// DAHS CAPABILITY & GAP ANALYSIS
// ============================================================================

/** DAHS baseline capability profile */
export interface DAHSProfile {
  id: string
  name: string
  version: string
  capabilities: DAHSCapability[]
  supportedParameters: string[]
  supportedCalculations: CalculationType[]
  supportedReports: ReportType[]
}

/** A specific DAHS capability */
export interface DAHSCapability {
  id: string
  category: 'monitoring' | 'calculation' | 'reporting' | 'alarm' | 'qa'
  name: string
  description: string
  parameters?: string[]
  configurable: boolean
}

/** Calculation types DAHS can perform */
export type CalculationType =
  | 'hourly_average'
  | 'daily_average'
  | 'rolling_average'
  | 'block_average'
  | 'substitution'
  | 'heat_input'
  | 'emission_rate'
  | 'mass_emission'
  | 'f_factor'
  | 'custom'

/** Report types DAHS can generate */
export type ReportType =
  | 'quarterly_excess'
  | 'annual_compliance'
  | 'deviation_report'
  | 'emissions_summary'
  | 'calibration_log'
  | 'qa_summary'
  | 'custom'

/** Gap analysis result */
export interface GapAnalysis {
  obligationId: string
  obligation: PermitObligation
  dahsCapabilityId?: string // If capability exists
  status: GapStatus
  gapDescription?: string
  recommendedSolution?: string
  developmentEffort?: 'none' | 'configuration' | 'minor' | 'moderate' | 'major'
  notes: string[]
}

/** Gap status between obligation and DAHS capability */
export type GapStatus =
  | 'fully-supported' // DAHS can do this out of the box
  | 'config-required' // DAHS can do this with configuration
  | 'partial-support' // DAHS partially supports, needs enhancement
  | 'not-supported' // DAHS cannot do this, needs development
  | 'manual-process' // Will remain a manual process
  | 'needs-review' // Requires human analysis

/** DAHS Solution Proposal artifact data */
export interface DAHSProposalData {
  permitId: string
  dahsProfileId: string
  obligations: PermitObligation[]
  gapAnalysis: GapAnalysis[]
  proposedConfiguration: DAHSConfiguration
  developmentItems: DevelopmentItem[]
  summary: {
    fullySupported: number
    configRequired: number
    partialSupport: number
    notSupported: number
    manualProcess: number
    needsReview: number
  }
}

/** Proposed DAHS configuration */
export interface DAHSConfiguration {
  tags: TagConfiguration[]
  calculations: CalculationConfiguration[]
  alarms: AlarmConfiguration[]
  reports: ReportConfiguration[]
  qaWorkflows: QAWorkflowConfiguration[]
}

/** Tag/parameter configuration */
export interface TagConfiguration {
  tagName: string
  parameter: string
  unit: string
  source: string
  frequency: string
  obligationLinks: string[]
}

/** Calculation configuration */
export interface CalculationConfiguration {
  name: string
  type: CalculationType
  inputs: string[]
  formula?: string
  schedule: string
  obligationLinks: string[]
}

/** Alarm configuration */
export interface AlarmConfiguration {
  name: string
  condition: string
  threshold: string
  action: string
  obligationLinks: string[]
}

/** Report configuration */
export interface ReportConfiguration {
  name: string
  type: ReportType
  schedule: string
  parameters: string[]
  obligationLinks: string[]
}

/** QA workflow configuration */
export interface QAWorkflowConfiguration {
  name: string
  type: 'calibration' | 'rata' | 'cga' | 'linearity' | 'custom'
  schedule: string
  requirements: string[]
  obligationLinks: string[]
}

// ============================================================================
// DAHS CONFIGURATION REQUIREMENTS (from RegsBot Analysis)
// ============================================================================

/**
 * Complete analysis of what a DAHS needs based on regulatory requirements.
 * This is produced by RegsBot analyzing a monitoring plan + regulations.
 */
export interface DAHSRequirements {
  facilityId: string
  facilityName: string
  orisCode: number
  programs: string[] // e.g., ["ARP", "CSAPR", "MATS"]
  analyzedAt: string

  // What the DAHS must monitor
  monitoringRequirements: MonitoringRequirement[]

  // Calculations DAHS must perform
  calculationRequirements: CalculationRequirement[]

  // QA/QC tests DAHS must track
  qaRequirements: QARequirement[]

  // Reports DAHS must generate
  reportingRequirements: ReportingRequirement[]

  // Limits DAHS must track for exceedances
  emissionLimits: EmissionLimit[]

  // Missing data substitution requirements
  substitutionRequirements: SubstitutionRequirement[]

  // Recordkeeping requirements
  recordkeepingRequirements: RecordkeepingRequirement[]
}

/** Monitoring requirement derived from regulations */
export interface MonitoringRequirement {
  id: string
  parameter: string // SO2, NOx, CO2, Flow, etc.
  methodCode: string // CEM, CALC, AD, LME
  systemType: string // SO2, NOXP, FLOW, etc.
  frequency: 'continuous' | 'hourly' | 'daily'
  regulatoryBasis: string // "40 CFR 75.10(a)(1)"
  applicablePrograms: string[]
  notes: string[]
}

/** Calculation requirement derived from regulations */
export interface CalculationRequirement {
  id: string
  name: string
  calculationType: CalculationType
  inputParameters: string[]
  outputParameter: string
  outputUnits: string
  frequency: 'hourly' | 'daily' | 'quarterly' | 'annual'
  formula?: string
  regulatoryBasis: string
  notes: string[]
}

/** QA/QC test requirement */
export interface QARequirement {
  id: string
  testType:
    | 'daily_calibration'
    | 'linearity'
    | 'rata'
    | 'cga'
    | 'leak_check'
    | 'beam_intensity'
    | 'flow_to_load'
    | 'quarterly_gas_audit'
  parameterCode: string
  frequency: string // "daily", "quarterly", "semi-annual", "annual"
  toleranceCriteria: string // e.g., "±2.5% of span"
  regulatoryBasis: string
  consequenceOfFailure: string
  notes: string[]
}

/** Reporting requirement */
export interface ReportingRequirement {
  id: string
  reportType: string // "Quarterly EDR", "Annual Compliance", etc.
  frequency: 'quarterly' | 'semi-annual' | 'annual' | 'event-driven'
  submissionDeadline: string // e.g., "30 days after quarter end"
  dataElements: string[]
  regulatoryBasis: string
  notes: string[]
}

/** Emission limit to track */
export interface EmissionLimit {
  id: string
  parameter: string
  limitValue: number
  units: string
  averagingPeriod: string // "hourly", "30-day rolling", "annual"
  limitType: 'emission_rate' | 'mass' | 'concentration' | 'opacity' | 'data_quality'
  regulatoryBasis: string
  applicablePrograms: string[]
  notes: string[]
}

/** Missing data substitution requirement */
export interface SubstitutionRequirement {
  id: string
  parameter: string
  substituteDataCode: string // SUBS75, MHHI, etc.
  method: string
  regulatoryBasis: string
  notes: string[]
}

/** Recordkeeping requirement */
export interface RecordkeepingRequirement {
  id: string
  category: string
  description: string
  retentionPeriod: string // "3 years", "5 years", etc.
  regulatoryBasis: string
  notes: string[]
}

// ============================================================================
// COMPLIANCE REPORT (RegsBot Output for User Review)
// ============================================================================

/**
 * Comprehensive compliance report generated by RegsBot.
 * This is designed for user review and Q&A follow-up.
 * Each section includes citations so users can verify and drill down.
 */
export interface ComplianceReport {
  // Facility identification
  facilityId: string
  facilityName: string
  orisCode: number
  generatedAt: string

  // Executive summary for quick review
  summary: ComplianceReportSummary

  // Applicable regulations with citations
  applicableRegulations: ApplicableRegulationItem[]

  // Monitoring requirements grouped by parameter
  monitoringByParameter: MonitoringParameterGroup[]

  // QA/QC test requirements with schedules
  qaTestMatrix: QATestMatrixItem[]

  // Calculation requirements with formulas
  calculations: CalculationItem[]

  // Reporting deadlines and requirements
  reportingSchedule: ReportingScheduleItem[]

  // Emission limits with consequences
  limits: EmissionLimitItem[]

  // Missing data procedures by parameter
  missingDataProcedures: MissingDataItem[]

  // Recordkeeping requirements
  recordkeeping: RecordkeepingItem[]

  // All citations used in this report
  citations: ComplianceCitation[]

  // Related questions user might want to ask
  suggestedQuestions: string[]
}

/** Executive summary statistics */
export interface ComplianceReportSummary {
  totalRegulations: number
  totalMonitoringParameters: number
  totalQATests: number
  totalCalculations: number
  totalReports: number
  totalLimits: number
  programs: string[]
  // Key highlights for review
  highlights: string[]
}

/** Applicable regulation with full context */
export interface ApplicableRegulationItem {
  id: string
  cfr: string // "40 CFR 75"
  title: string
  program: string // "ARP", "CSAPR", etc.
  applicabilityReason: string // Why this regulation applies
  keyRequirements: string[] // Summary bullets
  citationId: string // Links to citations array
}

/** Monitoring requirements grouped by parameter */
export interface MonitoringParameterGroup {
  parameter: string // "SO2", "NOx", etc.
  displayName: string // "Sulfur Dioxide"
  methods: MonitoringMethodItem[]
}

/** Individual monitoring method with regulatory basis */
export interface MonitoringMethodItem {
  methodCode: string // "CEM", "AD", etc.
  description: string
  frequency: string
  dataQualityRequirements: string
  regulatoryBasis: string
  citationId: string
}

/** QA test matrix item */
export interface QATestMatrixItem {
  testType: string // "Daily Calibration", "RATA", etc.
  testCode: string // "DAYCAL", "RATA", etc.
  applicableParameters: string[]
  frequency: string // "Daily", "Semi-annual", etc.
  passCriteria: string // "±2.5% of span"
  failureConsequence: string // What happens if test fails
  gracePeroid?: string // How long to complete corrective action
  performanceSpec?: string // "PS-2", "PS-18", etc.
  regulatoryBasis: string
  citationId: string
}

/** Calculation requirement item */
export interface CalculationItem {
  name: string
  description: string
  formula?: string
  formulaCode?: string // "F-1", "D-5", etc.
  inputParameters: string[]
  outputParameter: string
  outputUnits: string
  frequency: string
  appendix?: string // "Appendix D", "Appendix F"
  regulatoryBasis: string
  citationId: string
}

/** Reporting schedule item */
export interface ReportingScheduleItem {
  reportType: string // "Quarterly EDR"
  description: string
  frequency: string
  deadline: string // "30 days after quarter end"
  dataElements: string[]
  submissionMethod: string // "ECMPS", "CDX", etc.
  regulatoryBasis: string
  citationId: string
}

/** Emission limit item with context */
export interface EmissionLimitItem {
  parameter: string
  limitValue: string // Formatted with units
  averagingPeriod: string
  limitType: string
  program: string
  exceedanceConsequence: string
  regulatoryBasis: string
  citationId: string
}

/** Missing data substitution procedure */
export interface MissingDataItem {
  parameter: string
  scenario: string // "< 24 hours missing", "monitor bias", etc.
  substitutionMethod: string
  substitutionValue: string // "90th percentile", "maximum hourly", etc.
  regulatoryBasis: string
  citationId: string
}

/** Recordkeeping requirement item */
export interface RecordkeepingItem {
  category: string
  requirements: string[]
  retentionPeriod: string
  format?: string // "Electronic", "Paper", etc.
  regulatoryBasis: string
  citationId: string
}

/** Citation for regulatory reference */
export interface ComplianceCitation {
  id: string
  cfr: string // "40 CFR 75.10(a)(1)"
  title: string
  description: string
  effectiveDate?: string
  source: 'eCFR' | 'EPA-Guidance' | 'State-Permit' | 'Monitoring-Plan'
  url?: string // Link to eCFR or EPA source
}

/** Development item for unsupported obligations */
export interface DevelopmentItem {
  id: string
  title: string
  description: string
  obligationLinks: string[]
  effort: 'minor' | 'moderate' | 'major'
  priority: 'critical' | 'high' | 'medium' | 'low'
  estimatedHours?: number
  notes: string[]
}

// ============================================================================
// REQUIREMENTS
// ============================================================================

/** Requirement with trace links */
export interface Requirement {
  id: string
  title: string
  description: string
  type: 'functional' | 'non-functional' | 'constraint'
  priority: 'must' | 'should' | 'could' | 'wont'
  evidenceLinks: string[] // Evidence item IDs
  openQuestions: string[]
  assumptions: string[]
}

/** Requirement Set artifact data */
export interface RequirementSetData {
  requirements: Requirement[]
  personas: Persona[]
  workflows: WorkflowDiagram[]
  traceMatrix: TraceLink[]
}

/** User persona */
export interface Persona {
  id: string
  name: string
  role: string
  goals: string[]
  painPoints: string[]
}

/** Workflow diagram reference */
export interface WorkflowDiagram {
  id: string
  name: string
  description: string
  steps: string[] // Simplified for now
}

// ============================================================================
// TRACE LINKS
// ============================================================================

/** Link types for traceability */
export type TraceLinkType =
  | 'requirement-evidence'
  | 'test-requirement'
  | 'screen-requirement'
  | 'screen-workflow'

/** Explicit trace link between artifacts */
export interface TraceLink {
  id: string
  type: TraceLinkType
  sourceId: string
  targetId: string
  createdAt: string
}

// ============================================================================
// NODES
// ============================================================================

/** Node types in the workflow */
export type NodeType =
  // Agent nodes
  | 'RegsBot'
  | 'RequirementsBot'
  | 'FigmaBot'
  | 'TestingBot'
  // Control nodes
  | 'Start'
  | 'End'
  | 'ApprovalGate'
  | 'Router'
  | 'Transform'
  | 'Publish'

/** Node status during a run */
export type NodeStatus =
  | 'pending'
  | 'running'
  | 'waiting-approval'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'failed'
  | 'skipped'

/** Context scope for a node */
export type ContextScope = 'project' | 'node' | 'restricted'

/** Node configuration */
export interface NodeConfig {
  id: string
  type: NodeType
  name: string
  position: { x: number; y: number }

  // Inputs
  inputArtifacts: ArtifactId[] // References from earlier nodes
  inputDocuments: string[] // Document references
  baNotes?: string

  // Context
  contextScope: ContextScope
  selectedDocuments?: string[] // For node scope

  // Output contract
  outputType?: ArtifactType
  requiredSchema?: string // JSON schema reference
  minCitationDensity?: number // e.g., >= 1 evidence per requirement

  // Policies
  toolPermissions?: string[]
  requiresApproval?: boolean
  redactionRules?: string[]
}

/** Edge connecting two nodes */
export interface WorkflowEdge {
  id: string
  sourceNodeId: string
  targetNodeId: string
  condition?: string // For router nodes
}

// ============================================================================
// WORKFLOW
// ============================================================================

/** Saved workflow definition */
export interface Workflow {
  id: string
  name: string
  description: string
  version: number
  nodes: NodeConfig[]
  edges: WorkflowEdge[]
  createdAt: string
  updatedAt: string
  createdBy: string
}

// ============================================================================
// RUN
// ============================================================================

/** Run status */
export type RunStatus =
  | 'pending'
  | 'running'
  | 'paused' // At approval gate
  | 'completed'
  | 'failed'
  | 'cancelled'

/** Single step in a run timeline */
export interface RunStep {
  nodeId: string
  status: NodeStatus
  startedAt?: string
  completedAt?: string
  outputArtifactId?: ArtifactId
  error?: string
  logs: string[]
}

/** A single execution of a workflow */
export interface Run {
  id: string
  workflowId: string
  workflowVersion: number
  status: RunStatus
  steps: RunStep[]
  inputContext: {
    evidenceLibraryVersion?: number
    projectDocuments: string[]
  }
  artifacts: ArtifactId[]
  createdAt: string
  completedAt?: string
  createdBy: string
}

// ============================================================================
// APPROVAL
// ============================================================================

/** Approval action */
export type ApprovalAction = 'approve' | 'request-changes'

/** Approval record */
export interface Approval {
  id: string
  runId: string
  nodeId: string
  action: ApprovalAction
  comment: string
  approvedBy: string
  approvedAt: string
  artifactVersion: number
}

// ============================================================================
// CROSS-AGENT CONTEXT SHARING
// ============================================================================

/** Available agents in NERO */
export type AgentType = 'RegsBot' | 'RequirementsBot' | 'FigmaBot' | 'TestingBot' | 'DAHSBot'

/** Artifact types that can be shared between agents */
export type SharedArtifactType =
  | 'ComplianceReport'
  | 'DAHSRequirements'
  | 'DAHSProposal'
  | 'RequirementSet'
  | 'TestPlan'
  | 'WireframeSpec'

/**
 * Context envelope for agent-to-agent communication.
 * Contains the artifact data plus metadata about origin and traceability.
 */
export interface AgentContext<T = unknown> {
  /** Unique ID for this context envelope */
  id: string
  /** Agent that created this context */
  sourceAgent: AgentType
  /** Agent(s) that should receive this context */
  targetAgents: AgentType[]
  /** Type of artifact being shared */
  artifactType: SharedArtifactType
  /** The actual artifact data */
  data: T
  /** Facility this context relates to */
  facilityId: string
  orisCode: number
  /** Timestamps */
  createdAt: string
  /** Whether this context has been human-approved */
  approved: boolean
  approvedBy?: string
  approvedAt?: string
  /** Version for tracking updates */
  version: number
  /** Citation IDs for traceability */
  citationIds: string[]
  /** Optional notes from source agent */
  notes?: string[]
}

/**
 * Context handoff from RegsBot to RequirementsBot.
 * Contains the ComplianceReport plus extracted obligations for gap analysis.
 */
export interface RegsBotToRequirementsBotContext {
  complianceReport: ComplianceReport
  /**
   * Obligations extracted from the monitoring plan.
   * These are derived from the ComplianceReport but formatted
   * for RequirementsBot's gap analysis input.
   */
  extractedObligations: PermitObligation[]
  /** DAHS profile ID to use for gap analysis (optional) */
  dahsProfileId?: string
}

/**
 * Context handoff from RegsBot to FigmaBot.
 * Contains summarized requirements for UI design.
 */
export interface RegsBotToFigmaBotContext {
  complianceReport: ComplianceReport
  /** Key screens/workflows that need UI design */
  uiRequirements: UIRequirement[]
  /** Branding/style preferences */
  styleGuidelines?: StyleGuideline[]
}

/** UI requirement for FigmaBot */
export interface UIRequirement {
  id: string
  name: string
  description: string
  type: 'dashboard' | 'form' | 'report' | 'workflow' | 'alert' | 'data-entry'
  relatedParameters: string[]
  relatedRegulations: string[]
  priority: 'critical' | 'high' | 'medium' | 'low'
}

/** Style guideline for FigmaBot */
export interface StyleGuideline {
  category: 'color' | 'typography' | 'spacing' | 'iconography'
  name: string
  value: string
  notes?: string
}

/**
 * Context handoff from RequirementsBot to TestingBot.
 * Contains requirements that need test coverage.
 */
export interface RequirementsBotToTestingBotContext {
  dahsProposal: DAHSProposalData
  /** Requirements that need test cases */
  requirements: TestableRequirement[]
  /** Configuration items to test */
  configurationItems: DAHSConfiguration
}

/** Requirement that can be tested */
export interface TestableRequirement {
  id: string
  title: string
  description: string
  acceptanceCriteria: string[]
  type: 'functional' | 'compliance' | 'integration' | 'performance'
  regulatoryBasis?: string
  priority: 'critical' | 'high' | 'medium' | 'low'
}

/**
 * Helper to create a context envelope for agent communication.
 */
export function createAgentContext<T>(
  sourceAgent: AgentType,
  targetAgents: AgentType[],
  artifactType: SharedArtifactType,
  data: T,
  facility: { id: string; orisCode: number },
  citationIds: string[] = []
): AgentContext<T> {
  return {
    id: crypto.randomUUID(),
    sourceAgent,
    targetAgents,
    artifactType,
    data,
    facilityId: facility.id,
    orisCode: facility.orisCode,
    createdAt: new Date().toISOString(),
    approved: false,
    version: 1,
    citationIds,
  }
}

/**
 * Extract PermitObligations from a ComplianceReport for RequirementsBot.
 * This bridges the gap between RegsBot's output and RequirementsBot's input.
 */
export function extractObligationsFromReport(report: ComplianceReport): PermitObligation[] {
  const obligations: PermitObligation[] = []
  let obligationIndex = 0

  // Extract monitoring obligations from monitoringByParameter
  for (const paramGroup of report.monitoringByParameter) {
    for (const method of paramGroup.methods) {
      obligations.push({
        id: `obl-mon-${obligationIndex++}`,
        permitId: report.facilityId,
        pageReference: 'Monitoring Plan',
        originalText: `Monitor ${paramGroup.parameter} using ${method.methodCode}`,
        obligationType: 'monitoring',
        summary: `${paramGroup.parameter} monitoring using ${method.description}`,
        regulatoryBasis: method.regulatoryBasis,
        frequency: method.frequency,
        parameters: [paramGroup.parameter],
        confidence: 1.0,
        confirmedByHuman: false,
      })
    }
  }

  // Extract QA test obligations from qaTestMatrix
  for (const qaTest of report.qaTestMatrix) {
    obligations.push({
      id: `obl-qa-${obligationIndex++}`,
      permitId: report.facilityId,
      pageReference: 'QA/QC Plan',
      originalText: `Perform ${qaTest.testType} per ${qaTest.regulatoryBasis}`,
      obligationType: 'testing',
      summary: qaTest.testType,
      regulatoryBasis: qaTest.regulatoryBasis,
      frequency: qaTest.frequency,
      parameters: qaTest.applicableParameters,
      confidence: 1.0,
      confirmedByHuman: false,
    })
  }

  // Extract calculation obligations
  for (const calc of report.calculations) {
    obligations.push({
      id: `obl-calc-${obligationIndex++}`,
      permitId: report.facilityId,
      pageReference: 'Calculation Requirements',
      originalText: calc.formula ?? `Calculate ${calc.name}`,
      obligationType: 'calculation',
      summary: calc.description,
      regulatoryBasis: calc.regulatoryBasis,
      parameters: calc.inputParameters,
      confidence: 1.0,
      confirmedByHuman: false,
    })
  }

  // Extract reporting obligations
  for (const schedule of report.reportingSchedule) {
    obligations.push({
      id: `obl-rpt-${obligationIndex++}`,
      permitId: report.facilityId,
      pageReference: 'Reporting Schedule',
      originalText: `Submit ${schedule.reportType} ${schedule.frequency}`,
      obligationType: 'reporting',
      summary: schedule.description,
      regulatoryBasis: schedule.regulatoryBasis,
      frequency: schedule.frequency,
      confidence: 1.0,
      confirmedByHuman: false,
    })
  }

  // Extract limit obligations
  for (const limit of report.limits) {
    obligations.push({
      id: `obl-lim-${obligationIndex++}`,
      permitId: report.facilityId,
      pageReference: 'Emission Limits',
      originalText: `${limit.parameter}: ${limit.limitValue}`,
      obligationType: 'limit',
      summary: `${limit.parameter} limit of ${limit.limitValue}`,
      regulatoryBasis: limit.regulatoryBasis,
      parameters: [limit.parameter],
      thresholds: { [limit.parameter]: limit.limitValue },
      confidence: 1.0,
      confirmedByHuman: false,
    })
  }

  // Extract recordkeeping obligations
  for (const record of report.recordkeeping) {
    obligations.push({
      id: `obl-rec-${obligationIndex++}`,
      permitId: report.facilityId,
      pageReference: 'Recordkeeping Requirements',
      originalText: `Maintain ${record.category} for ${record.retentionPeriod}`,
      obligationType: 'recordkeeping',
      summary: record.requirements.join('; '),
      regulatoryBasis: record.regulatoryBasis,
      frequency: 'ongoing',
      confidence: 1.0,
      confirmedByHuman: false,
    })
  }

  return obligations
}
