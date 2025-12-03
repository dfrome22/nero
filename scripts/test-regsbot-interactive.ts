/**
 * Interactive RegsBot Test Script
 *
 * Run with: npx tsx scripts/test-regsbot-interactive.ts
 *
 * This script demonstrates RegsBot's capabilities:
 * 1. Natural language questions
 * 2. Structured queries
 * 3. Monitoring plan analysis (with mock data)
 */

/* eslint-disable no-console */

import { RegsBotService } from '../src/agents/regsbot/index'
import type { MonitoringPlan } from '../src/types/ecmps-api'

// Mock monitoring plan (simulates what we'd get from ECMPS API)
const mockMonitoringPlan: MonitoringPlan = {
  monitorPlanId: 'MP-TEST-001',
  facilityId: 1234,
  facilityName: 'Test Power Plant',
  orisCode: 5678,
  stateCode: 'PA',
  unitStackConfigurations: [{ unitId: 'U1', stackPipeId: 'CS1', beginDate: '2020-01-01' }],
  locations: [{ locationId: 'LOC1', locationType: 'stack', stackPipeId: 'CS1' }],
  methods: [
    {
      methodId: 'MTH-SO2',
      locationId: 'LOC1',
      parameterCode: 'SO2',
      methodCode: 'CEM',
      substituteDataCode: 'SUBS75',
      beginDate: '2020-01-01',
    },
    {
      methodId: 'MTH-NOX',
      locationId: 'LOC1',
      parameterCode: 'NOX',
      methodCode: 'CEM',
      beginDate: '2020-01-01',
    },
    {
      methodId: 'MTH-FLOW',
      locationId: 'LOC1',
      parameterCode: 'FLOW',
      methodCode: 'CEM',
      beginDate: '2020-01-01',
    },
    {
      methodId: 'MTH-O2',
      locationId: 'LOC1',
      parameterCode: 'O2',
      methodCode: 'CEM',
      beginDate: '2020-01-01',
    },
  ],
  systems: [
    {
      systemId: 'SYS-SO2',
      locationId: 'LOC1',
      systemTypeCode: 'SO2',
      beginDate: '2020-01-01',
    },
    {
      systemId: 'SYS-NOX',
      locationId: 'LOC1',
      systemTypeCode: 'NOX',
      beginDate: '2020-01-01',
    },
    {
      systemId: 'SYS-FLOW',
      locationId: 'LOC1',
      systemTypeCode: 'FLOW',
      beginDate: '2020-01-01',
    },
    {
      systemId: 'SYS-O2',
      locationId: 'LOC1',
      systemTypeCode: 'O2',
      beginDate: '2020-01-01',
    },
  ],
  spans: [],
  qualifications: [],
}

function printDivider(title: string): void {
  console.log('\n' + '='.repeat(70))
  console.log(`  ${title}`)
  console.log('='.repeat(70))
}

function printSection(title: string): void {
  console.log(`\n--- ${title} ---`)
}

async function main(): Promise<void> {
  const regsBot = new RegsBotService()

  console.log('\n🤖 REGSBOT INTERACTIVE TEST')
  console.log('EPA Regulatory Knowledge Oracle\n')

  // =========================================================================
  // TEST 1: Natural Language Question
  // =========================================================================
  printDivider('TEST 1: Natural Language Question')
  console.log('Question: "What QA tests are required for SO2 CEMS?"')

  const answer1 = await regsBot.ask({
    question: 'What QA tests are required for SO2 CEMS?',
  })

  printSection('Answer')
  console.log(answer1.answer)

  printSection('Confidence')
  console.log(answer1.confidence)

  printSection('QA Requirements Found')
  if (answer1.data.qaRequirements) {
    for (const qa of answer1.data.qaRequirements.slice(0, 5)) {
      console.log(`  • ${qa.testType} - ${qa.frequency}`)
      console.log(`    Tolerance: ${qa.toleranceCriteria}`)
      console.log(`    Basis: ${qa.regulatoryBasis}`)
    }
  }

  printSection('Warnings')
  for (const warning of answer1.warnings ?? []) {
    console.log(`  ⚠️  ${warning}`)
  }

  printSection('Related Questions')
  for (const q of answer1.relatedQuestions ?? []) {
    console.log(`  • ${q}`)
  }

  // =========================================================================
  // TEST 2: Structured Query - What to Calculate
  // =========================================================================
  printDivider('TEST 2: Structured Query - Calculations')
  console.log('Query: { queryType: "what-to-calculate", context: { programs: ["ARP"] } }')

  const answer2 = await regsBot.ask({
    queryType: 'what-to-calculate',
    context: { programs: ['ARP'] },
  })

  printSection('Answer')
  console.log(answer2.answer)

  printSection('Calculation Requirements')
  if (answer2.data.calculationRequirements) {
    for (const calc of answer2.data.calculationRequirements) {
      console.log(`  • ${calc.name}`)
      console.log(`    Type: ${calc.calculationType}`)
      console.log(`    Output: ${calc.outputParameter} (${calc.outputUnits})`)
      console.log(`    Frequency: ${calc.frequency}`)
      console.log(`    Basis: ${calc.regulatoryBasis}`)
    }
  }

  // =========================================================================
  // TEST 3: With Monitoring Plan Context
  // =========================================================================
  printDivider('TEST 3: Query with Monitoring Plan')
  console.log('Query: { queryType: "qa-requirements", context: { monitoringPlan: {...} } }')
  console.log('Monitoring Plan: 4 parameters (SO2, NOX, FLOW, O2)')

  const answer3 = await regsBot.ask({
    queryType: 'qa-requirements',
    context: { monitoringPlan: mockMonitoringPlan },
  })

  printSection('Answer')
  console.log(answer3.answer)

  printSection('Confidence (should be HIGH with plan)')
  console.log(answer3.confidence)

  printSection('QA Requirements Derived from Plan')
  if (answer3.data.qaRequirements) {
    const byType = new Map<string, number>()
    for (const qa of answer3.data.qaRequirements) {
      byType.set(qa.testType, (byType.get(qa.testType) ?? 0) + 1)
    }
    for (const [type, count] of byType) {
      console.log(`  • ${type}: ${count} tests`)
    }
    console.log(`\n  Total: ${answer3.data.qaRequirements.length} QA requirements`)
  }

  // =========================================================================
  // TEST 4: Applicable Regulations
  // =========================================================================
  printDivider('TEST 4: Applicable Regulations')
  console.log('Query: { queryType: "applicable-regulations" }')

  const answer4 = await regsBot.ask({
    queryType: 'applicable-regulations',
  })

  printSection('Answer')
  console.log(answer4.answer)

  printSection('Regulations')
  if (answer4.data.regulations) {
    for (const reg of answer4.data.regulations) {
      console.log(`  • ${reg.cfr}`)
      console.log(`    ${reg.title}`)
      console.log(`    ${reg.description}`)
    }
  }

  printSection('Citations')
  for (const citation of answer4.citations.slice(0, 5)) {
    console.log(`  [${citation.source}] ${citation.reference}`)
    console.log(`    ${citation.title}`)
  }

  // =========================================================================
  // TEST 5: Missing Data Procedures
  // =========================================================================
  printDivider('TEST 5: Missing Data Substitution')
  console.log('Query: { queryType: "missing-data" }')

  const answer5 = await regsBot.ask({
    queryType: 'missing-data',
  })

  printSection('Answer')
  console.log(answer5.answer)

  printSection('Substitution Requirements')
  if (answer5.data.substitutionRequirements) {
    for (const sub of answer5.data.substitutionRequirements) {
      console.log(`  • ${sub.parameter}`)
      console.log(`    Method: ${sub.method}`)
      console.log(`    Basis: ${sub.regulatoryBasis}`)
    }
  }

  // =========================================================================
  // TEST 6: Comprehensive Query with Monitoring Plan
  // =========================================================================
  printDivider('TEST 6: Comprehensive Monitoring Plan Analysis')
  console.log('Using ask() with monitoring plan context to derive all requirements')
  console.log('Monitoring Plan: 4 systems (SO2, NOX, FLOW, O2)\n')

  // Get all requirement types with the monitoring plan context
  const monitoringAnswer = await regsBot.ask({
    queryType: 'what-to-monitor',
    context: { monitoringPlan: mockMonitoringPlan },
  })

  const qaAnswer = await regsBot.ask({
    queryType: 'qa-requirements',
    context: { monitoringPlan: mockMonitoringPlan },
  })

  const calcAnswer = await regsBot.ask({
    queryType: 'what-to-calculate',
    context: { monitoringPlan: mockMonitoringPlan },
  })

  const reportAnswer = await regsBot.ask({
    queryType: 'reporting-requirements',
    context: { monitoringPlan: mockMonitoringPlan },
  })

  printSection('DAHS Requirements Derived from Monitoring Plan')

  console.log(
    `\n  📊 Monitoring Requirements: ${monitoringAnswer.data.monitoringRequirements?.length ?? 0}`
  )
  for (const m of monitoringAnswer.data.monitoringRequirements?.slice(0, 4) ?? []) {
    console.log(`     • ${m.parameter} (${m.systemType}) - ${m.frequency}`)
  }

  console.log(`\n  🧪 QA Requirements: ${qaAnswer.data.qaRequirements?.length ?? 0}`)
  const qaByType = new Map<string, number>()
  for (const qa of qaAnswer.data.qaRequirements ?? []) {
    qaByType.set(qa.testType, (qaByType.get(qa.testType) ?? 0) + 1)
  }
  for (const [type, count] of qaByType) {
    console.log(`     • ${type}: ${count}`)
  }

  console.log(
    `\n  🔢 Calculation Requirements: ${calcAnswer.data.calculationRequirements?.length ?? 0}`
  )
  for (const c of calcAnswer.data.calculationRequirements?.slice(0, 3) ?? []) {
    console.log(`     • ${c.name} → ${c.outputParameter}`)
  }

  console.log(
    `\n  📄 Reporting Requirements: ${reportAnswer.data.reportingRequirements?.length ?? 0}`
  )
  for (const r of reportAnswer.data.reportingRequirements ?? []) {
    console.log(`     • ${r.reportType} - ${r.frequency}`)
  }

  console.log(`\n  ✅ Confidence Level: ${qaAnswer.confidence} (high = monitoring plan provided)`)

  // =========================================================================
  // SUMMARY
  // =========================================================================
  printDivider('TEST SUMMARY')
  console.log('✅ All tests completed successfully!\n')
  console.log('RegsBot can:')
  console.log('  • Answer natural language regulatory questions')
  console.log('  • Process structured queries with context')
  console.log('  • Analyze monitoring plans to derive DAHS requirements')
  console.log('  • Provide citations to regulatory sources')
  console.log('  • Suggest related follow-up questions')
  console.log('  • Assess confidence based on available context')
  console.log('')
}

main().catch(console.error)
