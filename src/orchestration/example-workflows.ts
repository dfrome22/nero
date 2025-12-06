/**
 * NERO Example Workflows
 *
 * Pre-built workflow templates demonstrating different orchestration patterns.
 * These can be used directly or as starting points for custom workflows.
 */

import type { WorkflowContext, WorkflowDefinition } from './workflow-builder'
import { WorkflowBuilder } from './workflow-builder'

// ============================================================================
// WORKFLOW: REGULATORY IMPACT ANALYSIS
// ============================================================================

/**
 * Analyzes regulatory requirements and maps them to DAHS capabilities.
 *
 * Flow:
 * 1. RegsBot extracts regulations for a given CFR part
 * 2. RequirementsBot converts regulations into requirements
 * 3. DAHSBot maps requirements to existing capabilities
 *
 * Use case: Understanding regulatory compliance gaps
 */
export function createRegulatoryImpactWorkflow(): WorkflowDefinition {
  return (
    new WorkflowBuilder('regulatory-impact-analysis')
      .describe('Analyze CFR regulations and map to DAHS capabilities')

      // Step 1: Extract regulations
      .askRegsBot(
        (ctx: WorkflowContext) => {
          const cfrPartVar = ctx.variables.get('cfrPart')
          const cfrPart = typeof cfrPartVar === 'string' ? cfrPartVar : '75'
          return `What are the key monitoring requirements in 40 CFR Part ${cfrPart}?`
        },
        { id: 'extract-regulations', name: 'Extract Regulations', inputStrategy: 'none' }
      )

      // Step 2: Convert to requirements
      .askRequirementsBot(
        (ctx: WorkflowContext) => {
          const regs = ctx.getOutput('extract-regulations')
          return `Convert these regulations into testable requirements: ${JSON.stringify(regs)}`
        },
        { id: 'convert-requirements', name: 'Convert to Requirements', inputStrategy: 'previous' }
      )

      // Step 3: Map to DAHS capabilities
      .askDAHSBot(
        (ctx: WorkflowContext) => {
          const requirements = ctx.getOutput('convert-requirements')
          return `Which DAHS modules can satisfy these requirements? ${JSON.stringify(requirements)}`
        },
        { id: 'map-capabilities', name: 'Map to DAHS Capabilities', inputStrategy: 'previous' }
      )

      // Transform final output
      .transform(
        (ctx: WorkflowContext) => ({
          regulations: ctx.getOutput('extract-regulations'),
          requirements: ctx.getOutput('convert-requirements'),
          dahsMapping: ctx.getOutput('map-capabilities'),
          generatedAt: new Date().toISOString(),
        }),
        { id: 'final-report', name: 'Generate Report' }
      )

      .build()
  )
}

// ============================================================================
// WORKFLOW: FACILITY COMPLIANCE CHECK
// ============================================================================

/**
 * Performs parallel compliance checks for a facility.
 *
 * Flow:
 * 1. Parallel: RegsBot checks regulations, DAHSBot checks current config
 * 2. RequirementsBot compares and identifies gaps
 *
 * Use case: Quick compliance validation for a specific facility
 */
export function createFacilityComplianceWorkflow(): WorkflowDefinition {
  return (
    new WorkflowBuilder('facility-compliance-check')
      .describe('Verify facility configuration against regulatory requirements')

      // Parallel analysis
      .parallel(
        [
          {
            agent: 'regsbot',
            query: (ctx: WorkflowContext): string => {
              const oris = ctx.variables.get('orisCode')
              return `What are the monitoring requirements for ORIS ${String(oris)}?`
            },
            name: 'Check Regulations',
          },
          {
            agent: 'dahsbot',
            query: (ctx: WorkflowContext): string => {
              const oris = ctx.variables.get('orisCode')
              return `What monitoring capabilities are configured for a typical Part 75 facility like ORIS ${String(oris)}?`
            },
            name: 'Check DAHS Configuration',
          },
        ],
        { name: 'Parallel Regulatory & System Analysis', waitForAll: true }
      )

      // Gap analysis
      .askRequirementsBot(
        (ctx: WorkflowContext) => {
          const parallelResults = ctx.getPreviousOutput() as [unknown, unknown] | undefined
          const [regulations, dahsConfig] = parallelResults ?? [null, null]
          return `Compare regulatory requirements to current capabilities and identify gaps:\n\nRegulations: ${JSON.stringify(regulations)}\n\nCurrent Config: ${JSON.stringify(dahsConfig)}`
        },
        { id: 'gap-analysis', name: 'Identify Compliance Gaps', inputStrategy: 'previous' }
      )

      .build()
  )
}

// ============================================================================
// WORKFLOW: REGSBOT VS DAHSBOT DEBATE
// ============================================================================

/**
 * RegsBot challenges whether DAHS can meet a specific requirement.
 * DAHSBot defends DAHS capabilities.
 *
 * Use case: Validate requirement implementation approaches
 */
export function createRequirementDebateWorkflow(): WorkflowDefinition {
  return (
    new WorkflowBuilder('requirement-debate')
      .describe('RegsBot challenges DAHS capability claims, DAHSBot defends')

      .debate(
        'regsbot',
        'dahsbot',
        (ctx: WorkflowContext) => {
          const reqVar = ctx.variables.get('requirement')
          const requirement = typeof reqVar === 'string' ? reqVar : 'hourly emissions calculation'
          return `Can DAHS properly implement: ${requirement}`
        },
        {
          name: 'Capability Validation Debate',
          maxRounds: 3,
          resolutionStrategy: 'consensus',
        }
      )

      // Summarize debate outcome
      .askRequirementsBot(
        (ctx: WorkflowContext) => {
          const debateResult = ctx.getPreviousOutput()
          return `Based on this debate, provide a final assessment and any requirements that should be documented: ${JSON.stringify(debateResult)}`
        },
        { id: 'summarize', name: 'Summarize Debate', inputStrategy: 'previous' }
      )

      .build()
  )
}

// ============================================================================
// WORKFLOW: CONDITIONAL PERMIT ANALYSIS
// ============================================================================

/**
 * Analyzes permit requirements with conditional routing based on facility type.
 *
 * Flow:
 * 1. RegsBot determines facility classification
 * 2. If Title V: Deep regulatory analysis
 *    If State permit: Basic requirements
 * 3. DAHSBot maps to capabilities
 */
export function createConditionalPermitWorkflow(): WorkflowDefinition {
  return (
    new WorkflowBuilder('conditional-permit-analysis')
      .describe('Route analysis based on permit type')

      // Determine permit type
      .askRegsBot(
        (ctx: WorkflowContext) => {
          const oris = ctx.variables.get('orisCode')
          return `Is ORIS ${String(oris)} a Title V major source or a minor source under state permit?`
        },
        { id: 'classify-permit', name: 'Classify Permit Type', inputStrategy: 'none' }
      )

      // Conditional routing based on permit type
      .ifThen(
        (ctx: WorkflowContext) => {
          const classification = ctx.getOutput('classify-permit') as { answer?: string } | undefined
          const answer = classification?.answer ?? ''
          return answer.toLowerCase().includes('title v') || answer.toLowerCase().includes('major')
        },
        (builder) =>
          builder.askRegsBot(
            'Provide detailed Title V monitoring requirements including MACT, NSPS, and Part 75 applicability.',
            { name: 'Title V Deep Analysis' }
          ),
        (builder) =>
          builder.askRegsBot('Provide basic state permit monitoring requirements.', {
            name: 'State Permit Analysis',
          }),
        { name: 'Permit-Specific Analysis' }
      )

      // Map to DAHS
      .askDAHSBot(
        (ctx: WorkflowContext) => {
          const requirements = ctx.getPreviousOutput()
          return `Map these permit requirements to DAHS modules: ${JSON.stringify(requirements)}`
        },
        { id: 'dahs-mapping', name: 'Map to DAHS Modules', inputStrategy: 'previous' }
      )

      .build()
  )
}

// ============================================================================
// WORKFLOW: FULL REQUIREMENTS PIPELINE
// ============================================================================

/**
 * Complete requirements engineering pipeline with human approval gates.
 *
 * Flow:
 * 1. RegsBot extracts regulations
 * 2. RequirementsBot creates formal requirements
 * 3. Human approves requirements
 * 4. DAHSBot creates implementation spec
 * 5. Human approves implementation
 * 6. TestingBot creates test cases
 */
export function createFullRequirementsPipelineWorkflow(): WorkflowDefinition {
  return (
    new WorkflowBuilder('full-requirements-pipeline')
      .describe('End-to-end requirements engineering with approval gates')

      // Extract regulations
      .askRegsBot(
        (ctx: WorkflowContext) => {
          const queryVar = ctx.variables.get('regulatoryQuery')
          return typeof queryVar === 'string' ? queryVar : 'What are Part 75 CEMS requirements?'
        },
        { id: 'extract-regs', name: 'Extract Regulations', inputStrategy: 'none' }
      )

      // Create requirements
      .askRequirementsBot(
        (ctx: WorkflowContext) =>
          `Create formal requirements from: ${JSON.stringify(ctx.getOutput('extract-regs'))}`,
        { id: 'create-requirements', name: 'Create Formal Requirements', inputStrategy: 'previous' }
      )

      // Human approval for requirements
      .waitForHuman(
        (ctx: WorkflowContext) =>
          `Please review and approve these requirements:\n\n${JSON.stringify(ctx.getOutput('create-requirements'), null, 2)}\n\nType APPROVED to continue, or provide feedback.`,
        { name: 'Approve Requirements' }
      )

      // DAHS implementation spec
      .askDAHSBot(
        (ctx: WorkflowContext) => {
          const requirements = ctx.getOutput('create-requirements')
          return `Create implementation specification for: ${JSON.stringify(requirements)}`
        },
        {
          id: 'implementation-spec',
          name: 'Create Implementation Spec',
          inputStrategy: 'specific',
          inputFromSteps: ['create-requirements'],
        }
      )

      // Human approval for implementation
      .waitForHuman(
        (ctx: WorkflowContext) =>
          `Review implementation specification:\n\n${JSON.stringify(ctx.getOutput('implementation-spec'), null, 2)}\n\nType APPROVED to continue.`,
        { name: 'Approve Implementation' }
      )

      // Final report
      .transform(
        (ctx: WorkflowContext) => ({
          regulations: ctx.getOutput('extract-regs'),
          requirements: ctx.getOutput('create-requirements'),
          implementation: ctx.getOutput('implementation-spec'),
          completedAt: new Date().toISOString(),
          status: 'approved',
        }),
        { id: 'final-report', name: 'Generate Final Report' }
      )

      .build()
  )
}

// ============================================================================
// WORKFLOW CATALOG
// ============================================================================

export interface WorkflowCatalogEntry {
  id: string
  name: string
  description: string
  category: 'analysis' | 'compliance' | 'requirements' | 'debate'
  agents: string[]
  hasHumanInputs: boolean
  estimatedDuration: string
  create: () => WorkflowDefinition
}

export const WORKFLOW_CATALOG: WorkflowCatalogEntry[] = [
  {
    id: 'regulatory-impact-analysis',
    name: 'Regulatory Impact Analysis',
    description: 'Analyze CFR regulations and map to DAHS capabilities',
    category: 'analysis',
    agents: ['regsbot', 'requirementsbot', 'dahsbot'],
    hasHumanInputs: false,
    estimatedDuration: '2-3 minutes',
    create: createRegulatoryImpactWorkflow,
  },
  {
    id: 'facility-compliance-check',
    name: 'Facility Compliance Check',
    description: 'Parallel regulatory and system analysis for compliance gaps',
    category: 'compliance',
    agents: ['regsbot', 'dahsbot', 'requirementsbot'],
    hasHumanInputs: false,
    estimatedDuration: '1-2 minutes',
    create: createFacilityComplianceWorkflow,
  },
  {
    id: 'requirement-debate',
    name: 'Requirement Implementation Debate',
    description: 'RegsBot vs DAHSBot debate on capability claims',
    category: 'debate',
    agents: ['regsbot', 'dahsbot', 'requirementsbot'],
    hasHumanInputs: false,
    estimatedDuration: '3-5 minutes',
    create: createRequirementDebateWorkflow,
  },
  {
    id: 'conditional-permit-analysis',
    name: 'Conditional Permit Analysis',
    description: 'Route analysis based on permit type (Title V vs State)',
    category: 'compliance',
    agents: ['regsbot', 'dahsbot'],
    hasHumanInputs: false,
    estimatedDuration: '2-3 minutes',
    create: createConditionalPermitWorkflow,
  },
  {
    id: 'full-requirements-pipeline',
    name: 'Full Requirements Pipeline',
    description: 'End-to-end requirements engineering with approval gates',
    category: 'requirements',
    agents: ['regsbot', 'requirementsbot', 'dahsbot'],
    hasHumanInputs: true,
    estimatedDuration: '10-15 minutes',
    create: createFullRequirementsPipelineWorkflow,
  },
]

/** Get workflow by ID */
export function getWorkflowById(id: string): WorkflowCatalogEntry | undefined {
  return WORKFLOW_CATALOG.find((w) => w.id === id)
}

/** Get workflows by category */
export function getWorkflowsByCategory(
  category: WorkflowCatalogEntry['category']
): WorkflowCatalogEntry[] {
  return WORKFLOW_CATALOG.filter((w) => w.category === category)
}

/** Get workflows involving specific agent */
export function getWorkflowsForAgent(agent: string): WorkflowCatalogEntry[] {
  return WORKFLOW_CATALOG.filter((w) => w.agents.includes(agent))
}
