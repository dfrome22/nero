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
  limitType: 'emission_rate' | 'mass' | 'concentration' | 'opacity'
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
