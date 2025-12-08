/**
 * MCP Collaboration Orchestrator Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MCPCollaborationOrchestrator } from './mcp-orchestrator'
import { agentRegistry } from './agent-registry'
import { createAgentRouter } from './agent-router'
import type { CollaborationWorkflow } from '@/types/agent-collaboration'

describe('MCPCollaborationOrchestrator', () => {
  let orchestrator: MCPCollaborationOrchestrator

  beforeEach(() => {
    orchestrator = new MCPCollaborationOrchestrator(
      agentRegistry,
      createAgentRouter(agentRegistry)
    )
  })

  describe('createSession', () => {
    it('should create a new MCP session', () => {
      const session = orchestrator.createSession('workflow-1', {})

      expect(session).toHaveProperty('sessionId')
      expect(session).toHaveProperty('workflowId', 'workflow-1')
      expect(session).toHaveProperty('status', 'active')
      expect(session).toHaveProperty('sharedContext')
      expect(session).toHaveProperty('artifacts')
      expect(session).toHaveProperty('discussions')
      expect(session).toHaveProperty('participants')
    })

    it('should include metadata in session', () => {
      const metadata = {
        userId: 'user-123',
        projectId: 'project-456',
        tags: ['compliance', 'dahs'],
      }

      const session = orchestrator.createSession('workflow-1', {}, metadata)

      expect(session.metadata).toEqual(metadata)
    })
  })

  describe('getSession', () => {
    it('should retrieve an existing session', () => {
      const created = orchestrator.createSession('workflow-1', {})
      const retrieved = orchestrator.getSession(created.sessionId)

      expect(retrieved).toBeDefined()
      expect(retrieved?.sessionId).toBe(created.sessionId)
    })

    it('should return undefined for nonexistent session', () => {
      const retrieved = orchestrator.getSession('nonexistent')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('updateSessionContext', () => {
    it('should update session context', () => {
      const session = orchestrator.createSession('workflow-1', {})
      
      orchestrator.updateSessionContext(session.sessionId, {
        currentPhase: 'analysis',
      })

      const updated = orchestrator.getSession(session.sessionId)
      expect(updated?.sharedContext.currentPhase).toBe('analysis')
    })

    it('should throw error for nonexistent session', () => {
      expect(() => {
        orchestrator.updateSessionContext('nonexistent', {})
      }).toThrow('Session nonexistent not found')
    })
  })

  describe('storeArtifact', () => {
    it('should store an artifact in the session', () => {
      const session = orchestrator.createSession('workflow-1', {})

      const artifact = orchestrator.storeArtifact(session.sessionId, {
        type: 'compliance-report',
        name: 'Test Report',
        content: { data: 'test' },
        producedBy: 'RegsBot',
      })

      expect(artifact).toHaveProperty('id')
      expect(artifact).toHaveProperty('producedAt')
      expect(artifact).toHaveProperty('version', 1)
      expect(artifact.type).toBe('compliance-report')
    })

    it('should throw error for nonexistent session', () => {
      expect(() => {
        orchestrator.storeArtifact('nonexistent', {
          type: 'test',
          name: 'Test',
          content: {},
          producedBy: 'RegsBot',
        })
      }).toThrow('Session nonexistent not found')
    })
  })

  describe('getArtifact', () => {
    it('should retrieve a stored artifact', () => {
      const session = orchestrator.createSession('workflow-1', {})
      const stored = orchestrator.storeArtifact(session.sessionId, {
        type: 'test',
        name: 'Test Artifact',
        content: { value: 123 },
        producedBy: 'RegsBot',
      })

      const retrieved = orchestrator.getArtifact(session.sessionId, stored.id)

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe(stored.id)
      expect(retrieved?.type).toBe('test')
    })
  })

  describe('getSessionArtifacts', () => {
    it('should return all artifacts from a session', () => {
      const session = orchestrator.createSession('workflow-1', {})

      orchestrator.storeArtifact(session.sessionId, {
        type: 'report',
        name: 'Report 1',
        content: {},
        producedBy: 'RegsBot',
      })

      orchestrator.storeArtifact(session.sessionId, {
        type: 'proposal',
        name: 'Proposal 1',
        content: {},
        producedBy: 'RequirementsBot',
      })

      const artifacts = orchestrator.getSessionArtifacts(session.sessionId)

      expect(artifacts).toHaveLength(2)
      expect(artifacts[0]?.type).toBe('report')
      expect(artifacts[1]?.type).toBe('proposal')
    })

    it('should return empty array for nonexistent session', () => {
      const artifacts = orchestrator.getSessionArtifacts('nonexistent')
      expect(artifacts).toEqual([])
    })
  })

  describe('startDiscussion', () => {
    it('should start a new discussion', () => {
      const session = orchestrator.createSession('workflow-1', {})
      const discussion = orchestrator.startDiscussion(
        session.sessionId,
        'Test Discussion',
        ['RegsBot', 'RequirementsBot']
      )

      expect(discussion).toHaveProperty('id')
      expect(discussion).toHaveProperty('topic', 'Test Discussion')
      expect(discussion).toHaveProperty('status', 'active')
      expect(discussion.participants).toEqual(['RegsBot', 'RequirementsBot'])
      expect(discussion.messages).toEqual([])
    })

    it('should add participants to session', () => {
      const session = orchestrator.createSession('workflow-1', {})
      orchestrator.startDiscussion(
        session.sessionId,
        'Test Discussion',
        ['RegsBot', 'RequirementsBot']
      )

      const updated = orchestrator.getSession(session.sessionId)
      expect(updated?.participants).toContain('RegsBot')
      expect(updated?.participants).toContain('RequirementsBot')
    })
  })

  describe('addDiscussionMessage', () => {
    it('should add a message to a discussion', async () => {
      const session = orchestrator.createSession('workflow-1', {})
      const discussion = orchestrator.startDiscussion(
        session.sessionId,
        'Test Discussion',
        ['RegsBot', 'RequirementsBot']
      )

      const message = await orchestrator.addDiscussionMessage(
        session.sessionId,
        discussion.id,
        'RegsBot',
        'statement',
        'Test message content',
        { confidence: 0.95 }
      )

      expect(message).toHaveProperty('id')
      expect(message.speaker).toBe('RegsBot')
      expect(message.messageType).toBe('statement')
      expect(message.content).toBe('Test message content')
      expect(message.confidence).toBe(0.95)
    })

    it('should support message responses', async () => {
      const session = orchestrator.createSession('workflow-1', {})
      const discussion = orchestrator.startDiscussion(
        session.sessionId,
        'Test',
        ['RegsBot', 'RequirementsBot']
      )

      const msg1 = await orchestrator.addDiscussionMessage(
        session.sessionId,
        discussion.id,
        'RegsBot',
        'statement',
        'Initial statement'
      )

      const msg2 = await orchestrator.addDiscussionMessage(
        session.sessionId,
        discussion.id,
        'RequirementsBot',
        'response',
        'Response to statement',
        { inResponseTo: msg1.id }
      )

      expect(msg2.inResponseTo).toBe(msg1.id)
    })
  })

  describe('resolveDiscussion', () => {
    it('should resolve a discussion', () => {
      const session = orchestrator.createSession('workflow-1', {})
      const discussion = orchestrator.startDiscussion(
        session.sessionId,
        'Test',
        ['RegsBot', 'RequirementsBot']
      )

      orchestrator.resolveDiscussion(session.sessionId, discussion.id, {
        type: 'consensus',
        summary: 'Agreement reached',
        agreedBy: ['RegsBot', 'RequirementsBot'],
        finalDecision: 'Proceed with proposal',
        reasoning: 'All requirements satisfied',
      })

      const updated = orchestrator.getSession(session.sessionId)
      const updatedDiscussion = updated?.discussions.find((d) => d.id === discussion.id)

      expect(updatedDiscussion?.status).toBe('resolved')
      expect(updatedDiscussion?.resolution?.type).toBe('consensus')
      expect(updatedDiscussion?.completedAt).toBeDefined()
    })
  })

  describe('mergeContexts', () => {
    it('should merge contexts using union strategy', () => {
      const baseContext = orchestrator.createSession('workflow-1', {
        artifacts: { artifact1: 'data1' },
      }).sharedContext

      const merged = orchestrator.mergeContexts(
        baseContext,
        [
          {
            agentId: 'RegsBot',
            context: { artifacts: { artifact2: 'data2' } },
          },
          {
            agentId: 'RequirementsBot',
            context: { artifacts: { artifact3: 'data3' } },
          },
        ],
        'union'
      )

      expect(merged.baseContext.artifacts).toHaveProperty('artifact1')
      expect(merged.baseContext.artifacts).toHaveProperty('artifact2')
      expect(merged.baseContext.artifacts).toHaveProperty('artifact3')
      expect(merged.strategy).toBe('union')
    })

    it('should include source information', () => {
      const baseContext = orchestrator.createSession('workflow-1', {}).sharedContext

      const merged = orchestrator.mergeContexts(
        baseContext,
        [
          { agentId: 'RegsBot', context: {} },
          { agentId: 'RequirementsBot', context: {} },
        ],
        'union'
      )

      expect(merged.sources).toHaveLength(2)
      expect(merged.sources[0]?.agentId).toBe('RegsBot')
      expect(merged.sources[1]?.agentId).toBe('RequirementsBot')
    })
  })

  describe('startWorkflowWithSession', () => {
    it('should start a workflow with MCP session', () => {
      const workflow: CollaborationWorkflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        description: 'Test',
        pattern: 'sequential',
        steps: [],
        approvalGates: [],
      }

      const { execution, session } = orchestrator.startWorkflowWithSession(workflow)

      expect(session).toBeDefined()
      expect(execution).toBeDefined()
      expect(execution.context.sessionId).toBe(session.sessionId)
      expect(session.workflowId).toBe(workflow.id)
    })
  })

  describe('getDiscussionLogs', () => {
    it('should return discussion logs', async () => {
      const session = orchestrator.createSession('workflow-1', {})
      const discussion = orchestrator.startDiscussion(
        session.sessionId,
        'Test',
        ['RegsBot']
      )

      await orchestrator.addDiscussionMessage(
        session.sessionId,
        discussion.id,
        'RegsBot',
        'statement',
        'Test'
      )

      const logs = orchestrator.getDiscussionLogs()
      expect(logs.length).toBeGreaterThan(0)
    })

    it('should filter logs by session', () => {
      const session1 = orchestrator.createSession('workflow-1', {})
      const session2 = orchestrator.createSession('workflow-2', {})

      orchestrator.startDiscussion(session1.sessionId, 'Test 1', ['RegsBot'])
      orchestrator.startDiscussion(session2.sessionId, 'Test 2', ['RequirementsBot'])

      const logs = orchestrator.getDiscussionLogs(session1.sessionId)
      expect(logs.every((l) => l.sessionId === session1.sessionId)).toBe(true)
    })
  })

  describe('getMCPMetrics', () => {
    it('should return MCP metrics', () => {
      const metrics = orchestrator.getMCPMetrics()
      expect(metrics).toBeDefined()
    })
  })
})
