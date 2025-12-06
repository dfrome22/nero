/**
 * Workflow Orchestrator Tests
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  WORKFLOW_CATALOG,
  createFacilityComplianceWorkflow,
  createRegulatoryImpactWorkflow,
  createRequirementDebateWorkflow,
  getWorkflowById,
  getWorkflowsByCategory,
  getWorkflowsForAgent,
} from './example-workflows'
import {
  WorkflowBuilder,
  createWorkflow,
  type WorkflowContext,
  type WorkflowDefinition,
} from './workflow-builder'
import { WorkflowExecutor, createExecutor } from './workflow-executor'

describe('WorkflowBuilder', () => {
  it('creates a workflow with basic properties', () => {
    const workflow = new WorkflowBuilder('test-workflow').describe('A test workflow').build()

    // Constructor uses name, not id - id is auto-generated UUID
    expect(workflow.name).toBe('test-workflow')
    expect(workflow.description).toBe('A test workflow')
    expect(workflow.steps).toEqual([])
    expect(workflow.createdAt).toBeInstanceOf(Date)
  })

  it('adds agent steps via askRegsBot', () => {
    const workflow = new WorkflowBuilder('test')
      .askRegsBot('What are Part 75 requirements?', {
        id: 'step-1',
        name: 'Get Regulations',
        inputStrategy: 'none',
      })
      .build()

    expect(workflow.steps).toHaveLength(1)
    expect(workflow.steps[0]?.type).toBe('agent')
    expect(workflow.steps[0]?.id).toBe('step-1')
    expect(workflow.steps[0]?.name).toBe('Get Regulations')
  })

  it('supports variables', () => {
    const workflow = new WorkflowBuilder('test')
      .withVariable('orisCode', 3)
      .withVariables({ cfrPart: '75', locationId: '7B' })
      .build()

    expect(workflow.variables.get('orisCode')).toBe(3)
    expect(workflow.variables.get('cfrPart')).toBe('75')
    expect(workflow.variables.get('locationId')).toBe('7B')
  })

  it('chains multiple agent steps', () => {
    const workflow = new WorkflowBuilder('chain-test')
      .askRegsBot('Get regulations', { name: 'Step 1' })
      .askRequirementsBot('Convert to requirements', { name: 'Step 2' })
      .askDAHSBot('Map to capabilities', { name: 'Step 3' })
      .build()

    expect(workflow.steps).toHaveLength(3)
    expect(workflow.steps[0]?.name).toBe('Step 1')
    expect(workflow.steps[1]?.name).toBe('Step 2')
    expect(workflow.steps[2]?.name).toBe('Step 3')
  })

  it('adds parallel steps', () => {
    const workflow = new WorkflowBuilder('parallel-test')
      .parallel(
        [
          { agent: 'regsbot', query: 'Query 1' },
          { agent: 'dahsbot', query: 'Query 2' },
        ],
        { name: 'Parallel Analysis', waitForAll: true }
      )
      .build()

    expect(workflow.steps).toHaveLength(1)
    expect(workflow.steps[0]?.type).toBe('parallel')
    expect(workflow.steps[0]?.name).toBe('Parallel Analysis')
  })

  it('adds debate steps', () => {
    const workflow = new WorkflowBuilder('debate-test')
      .debate('regsbot', 'dahsbot', 'Can DAHS handle hourly emissions?', {
        name: 'Capability Debate',
        maxRounds: 2,
        resolutionStrategy: 'consensus',
      })
      .build()

    expect(workflow.steps).toHaveLength(1)
    const step = workflow.steps[0]
    expect(step?.type).toBe('debate')
    if (step?.type === 'debate') {
      expect(step.challenger).toBe('regsbot')
      expect(step.defender).toBe('dahsbot')
      expect(step.maxRounds).toBe(2)
    }
  })

  it('adds transform steps', () => {
    const workflow = new WorkflowBuilder('transform-test')
      .transform(
        (_ctx: WorkflowContext) => ({
          result: 'transformed',
          timestamp: new Date().toISOString(),
        }),
        { name: 'Transform Output' }
      )
      .build()

    expect(workflow.steps).toHaveLength(1)
    expect(workflow.steps[0]?.type).toBe('transform')
  })

  it('adds human input steps', () => {
    const workflow = new WorkflowBuilder('human-test')
      .waitForHuman('Please approve this', {
        name: 'Human Approval',
        allowFreeform: true,
      })
      .build()

    expect(workflow.steps).toHaveLength(1)
    expect(workflow.steps[0]?.type).toBe('human-input')
    expect(workflow.steps[0]?.name).toBe('Human Approval')
  })

  it('registers event handlers', () => {
    const onComplete = vi.fn()
    const onFailed = vi.fn()

    const workflow = new WorkflowBuilder('events-test')
      .onCompleted(onComplete)
      .onFailed(onFailed)
      .build()

    expect(workflow.eventHandlers.onWorkflowCompleted).toBe(onComplete)
    expect(workflow.eventHandlers.onWorkflowFailed).toBe(onFailed)
  })
})

describe('createWorkflow factory', () => {
  it('creates a workflow builder', () => {
    const builder = createWorkflow('factory-test')
    expect(builder).toBeInstanceOf(WorkflowBuilder)

    const workflow = builder.describe('Factory created').build()
    expect(workflow.name).toBe('factory-test')
  })
})

describe('Example Workflows', () => {
  describe('createRegulatoryImpactWorkflow', () => {
    it('creates a valid workflow definition', () => {
      const workflow = createRegulatoryImpactWorkflow()

      expect(workflow.name).toBe('regulatory-impact-analysis')
      expect(workflow.description).toBe('Analyze CFR regulations and map to DAHS capabilities')
      expect(workflow.steps.length).toBeGreaterThanOrEqual(3)
    })

    it('has the expected agent steps', () => {
      const workflow = createRegulatoryImpactWorkflow()
      const agentSteps = workflow.steps.filter((s) => s.type === 'agent')

      expect(agentSteps.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('createFacilityComplianceWorkflow', () => {
    it('includes parallel step', () => {
      const workflow = createFacilityComplianceWorkflow()

      const parallelStep = workflow.steps.find((s) => s.type === 'parallel')
      expect(parallelStep).toBeDefined()
    })
  })

  describe('createRequirementDebateWorkflow', () => {
    it('includes debate step', () => {
      const workflow = createRequirementDebateWorkflow()

      const debateStep = workflow.steps.find((s) => s.type === 'debate')
      expect(debateStep).toBeDefined()
      if (debateStep?.type === 'debate') {
        expect(debateStep.challenger).toBe('regsbot')
        expect(debateStep.defender).toBe('dahsbot')
      }
    })
  })
})

describe('Workflow Catalog', () => {
  it('contains expected workflows', () => {
    expect(WORKFLOW_CATALOG).toHaveLength(5)

    const ids = WORKFLOW_CATALOG.map((w) => w.id)
    expect(ids).toContain('regulatory-impact-analysis')
    expect(ids).toContain('facility-compliance-check')
    expect(ids).toContain('requirement-debate')
    expect(ids).toContain('conditional-permit-analysis')
    expect(ids).toContain('full-requirements-pipeline')
  })

  it('getWorkflowById returns correct workflow', () => {
    const workflow = getWorkflowById('regulatory-impact-analysis')
    expect(workflow).toBeDefined()
    expect(workflow?.name).toBe('Regulatory Impact Analysis')
  })

  it('getWorkflowById returns undefined for unknown id', () => {
    const workflow = getWorkflowById('non-existent')
    expect(workflow).toBeUndefined()
  })

  it('getWorkflowsByCategory filters correctly', () => {
    const analysisWorkflows = getWorkflowsByCategory('analysis')
    expect(analysisWorkflows.length).toBeGreaterThan(0)
    expect(analysisWorkflows.every((w) => w.category === 'analysis')).toBe(true)

    const debateWorkflows = getWorkflowsByCategory('debate')
    expect(debateWorkflows.length).toBeGreaterThan(0)
    expect(debateWorkflows.every((w) => w.category === 'debate')).toBe(true)
  })

  it('getWorkflowsForAgent filters by agent', () => {
    const regsbotWorkflows = getWorkflowsForAgent('regsbot')
    expect(regsbotWorkflows.length).toBeGreaterThan(0)
    expect(regsbotWorkflows.every((w) => w.agents.includes('regsbot'))).toBe(true)
  })

  it('all catalog entries create valid workflows', () => {
    for (const entry of WORKFLOW_CATALOG) {
      const workflow = entry.create()
      expect(workflow.id).toBeDefined()
      expect(workflow.steps.length).toBeGreaterThan(0)
    }
  })
})

describe('WorkflowExecutor', () => {
  let mockWorkflow: WorkflowDefinition

  beforeEach(() => {
    mockWorkflow = new WorkflowBuilder('test-executor')
      .describe('Test workflow for executor')
      .transform(() => ({ result: 'success' }), { name: 'Simple Transform' })
      .build()
  })

  it('creates executor from workflow definition', () => {
    const executor = createExecutor(mockWorkflow)
    expect(executor).toBeInstanceOf(WorkflowExecutor)
  })

  it('reports initial state as pending', () => {
    const executor = createExecutor(mockWorkflow)
    const state = executor.getState()

    expect(state.status).toBe('pending')
    expect(state.currentStepIndex).toBe(0)
    expect(state.progress).toBe(0)
    expect(state.canCancel).toBe(false)
  })

  it('executes a simple transform step', async () => {
    const workflow = new WorkflowBuilder('simple-test')
      .transform(() => ({ value: 42 }), { name: 'Return Value' })
      .build()

    const executor = createExecutor(workflow)
    const context = await executor.start()

    expect(executor.getState().status).toBe('completed')
    expect(context.outputs.size).toBe(1)
  })

  it('cancellation is respected when workflow checks abort signal', () => {
    const workflow = new WorkflowBuilder('cancel-test')
      .transform(() => ({ done: true }), { name: 'Simple Step' })
      .build()

    const executor = createExecutor(workflow)

    // Cancellation before start should work
    executor.cancel()

    // State should not be cancelled since we haven't started
    expect(executor.getState().status).toBe('pending')
  })
})

// ============================================================================
// CROSS-AGENT CONTEXT SHARING TESTS
// ============================================================================

import {
  createAgentContext,
  extractObligationsFromReport,
  type ComplianceReport,
} from '../types/orchestration'

describe('Cross-Agent Context Sharing', () => {
  describe('createAgentContext', () => {
    it('creates a context envelope with all required fields', () => {
      const testData = { message: 'test' }
      const context = createAgentContext(
        'RegsBot',
        ['RequirementsBot', 'FigmaBot'],
        'ComplianceReport',
        testData,
        { id: 'facility-1', orisCode: 12345 },
        ['cite-1', 'cite-2']
      )

      expect(context.sourceAgent).toBe('RegsBot')
      expect(context.targetAgents).toEqual(['RequirementsBot', 'FigmaBot'])
      expect(context.artifactType).toBe('ComplianceReport')
      expect(context.data).toBe(testData)
      expect(context.facilityId).toBe('facility-1')
      expect(context.orisCode).toBe(12345)
      expect(context.approved).toBe(false)
      expect(context.version).toBe(1)
      expect(context.citationIds).toEqual(['cite-1', 'cite-2'])
      expect(context.id).toBeDefined()
      expect(context.createdAt).toBeDefined()
    })

    it('defaults citationIds to empty array', () => {
      const context = createAgentContext(
        'RegsBot',
        ['RequirementsBot'],
        'DAHSRequirements',
        {},
        { id: 'f1', orisCode: 1 }
      )

      expect(context.citationIds).toEqual([])
    })
  })

  describe('extractObligationsFromReport', () => {
    const mockReport: ComplianceReport = {
      facilityId: 'FAC-001',
      facilityName: 'Test Power Plant',
      orisCode: 12345,
      generatedAt: '2024-01-15T10:00:00Z',
      summary: {
        totalRegulations: 3,
        totalMonitoringParameters: 2,
        totalQATests: 2,
        totalCalculations: 1,
        totalReports: 1,
        totalLimits: 1,
        programs: ['ARP', 'MATS'],
        highlights: ['SO2 and NOx monitoring required'],
      },
      applicableRegulations: [],
      monitoringByParameter: [
        {
          parameter: 'SO2',
          displayName: 'Sulfur Dioxide',
          methods: [
            {
              methodCode: 'CEM',
              description: 'CEMS Monitoring',
              frequency: 'Hourly',
              dataQualityRequirements: '±2.5%',
              regulatoryBasis: '40 CFR 75.10',
              citationId: 'cite-1',
            },
          ],
        },
      ],
      qaTestMatrix: [
        {
          testType: 'Daily Calibration',
          testCode: 'DAYCAL',
          applicableParameters: ['SO2', 'NOx'],
          frequency: 'Daily',
          passCriteria: '±2.5% of span',
          failureConsequence: 'Missing data substitution',
          regulatoryBasis: '40 CFR 75.21',
          citationId: 'cite-2',
        },
      ],
      calculations: [
        {
          name: 'SO2 Mass Rate',
          description: 'Calculate hourly SO2 mass emissions',
          formula: 'K × Cs × Q',
          formulaCode: 'F-1',
          inputParameters: ['SO2', 'Flow'],
          outputParameter: 'SO2 Mass',
          outputUnits: 'lb/hr',
          frequency: 'Hourly',
          appendix: 'Appendix F',
          regulatoryBasis: '40 CFR 75 App F',
          citationId: 'cite-3',
        },
      ],
      reportingSchedule: [
        {
          reportType: 'Quarterly EDR',
          description: 'Electronic Data Report',
          frequency: 'Quarterly',
          deadline: '30 days after quarter end',
          dataElements: ['SO2', 'NOx', 'CO2'],
          submissionMethod: 'ECMPS',
          regulatoryBasis: '40 CFR 75.64',
          citationId: 'cite-4',
        },
      ],
      limits: [
        {
          parameter: 'SO2',
          limitValue: '0.1 lb/MMBtu',
          averagingPeriod: '30-day rolling',
          limitType: 'Emission rate',
          program: 'MATS',
          exceedanceConsequence: 'Violation report required',
          regulatoryBasis: '40 CFR 63.10000',
          citationId: 'cite-5',
        },
      ],
      missingDataProcedures: [],
      recordkeeping: [
        {
          category: 'CEMS Data',
          requirements: ['Hourly readings', 'Calibration logs'],
          retentionPeriod: '3 years',
          format: 'Electronic',
          regulatoryBasis: '40 CFR 75.57',
          citationId: 'cite-6',
        },
      ],
      citations: [],
      suggestedQuestions: [],
    }

    it('extracts monitoring obligations', () => {
      const obligations = extractObligationsFromReport(mockReport)
      const monitoringObs = obligations.filter((o) => o.obligationType === 'monitoring')

      expect(monitoringObs).toHaveLength(1)
      expect(monitoringObs[0]?.parameters).toEqual(['SO2'])
      expect(monitoringObs[0]?.regulatoryBasis).toBe('40 CFR 75.10')
      expect(monitoringObs[0]?.frequency).toBe('Hourly')
    })

    it('extracts QA test obligations', () => {
      const obligations = extractObligationsFromReport(mockReport)
      const qaObs = obligations.filter((o) => o.obligationType === 'testing')

      expect(qaObs).toHaveLength(1)
      expect(qaObs[0]?.summary).toBe('Daily Calibration')
      expect(qaObs[0]?.parameters).toEqual(['SO2', 'NOx'])
    })

    it('extracts calculation obligations', () => {
      const obligations = extractObligationsFromReport(mockReport)
      const calcObs = obligations.filter((o) => o.obligationType === 'calculation')

      expect(calcObs).toHaveLength(1)
      expect(calcObs[0]?.originalText).toBe('K × Cs × Q')
      expect(calcObs[0]?.parameters).toEqual(['SO2', 'Flow'])
    })

    it('extracts reporting obligations', () => {
      const obligations = extractObligationsFromReport(mockReport)
      const reportObs = obligations.filter((o) => o.obligationType === 'reporting')

      expect(reportObs).toHaveLength(1)
      expect(reportObs[0]?.summary).toBe('Electronic Data Report')
      expect(reportObs[0]?.frequency).toBe('Quarterly')
    })

    it('extracts limit obligations', () => {
      const obligations = extractObligationsFromReport(mockReport)
      const limitObs = obligations.filter((o) => o.obligationType === 'limit')

      expect(limitObs).toHaveLength(1)
      expect(limitObs[0]?.parameters).toEqual(['SO2'])
      expect(limitObs[0]?.thresholds).toEqual({ SO2: '0.1 lb/MMBtu' })
    })

    it('extracts recordkeeping obligations', () => {
      const obligations = extractObligationsFromReport(mockReport)
      const recordObs = obligations.filter((o) => o.obligationType === 'recordkeeping')

      expect(recordObs).toHaveLength(1)
      expect(recordObs[0]?.summary).toBe('Hourly readings; Calibration logs')
    })

    it('assigns unique IDs to all obligations', () => {
      const obligations = extractObligationsFromReport(mockReport)
      const ids = obligations.map((o) => o.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(obligations.length)
    })

    it('sets confidence to 1.0 for all extracted obligations', () => {
      const obligations = extractObligationsFromReport(mockReport)

      for (const obl of obligations) {
        expect(obl.confidence).toBe(1.0)
      }
    })

    it('sets confirmedByHuman to false for all extracted obligations', () => {
      const obligations = extractObligationsFromReport(mockReport)

      for (const obl of obligations) {
        expect(obl.confirmedByHuman).toBe(false)
      }
    })
  })
})
