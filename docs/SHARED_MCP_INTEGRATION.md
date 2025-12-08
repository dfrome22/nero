# Shared MCP Integration

**Status**: In Progress  
**Last Updated**: December 8, 2024  
**Author**: NERO Development Team

## Overview

This document outlines the integration with Model Context Protocol (MCP) for NERO's multi-agent system. MCP provides a standardized way for AI agents to communicate with external data sources and services.

**Recent Progress** (December 8, 2024):
- ✅ Implemented MCP client infrastructure with retry logic and error handling
- ✅ Created MCP-enhanced collaboration orchestrator
- ✅ Added multi-turn discussion support between agents
- ✅ Implemented shared session management and artifact storage
- ✅ Added context merging capabilities across agents
- ✅ Built monitoring and metrics collection
- ✅ All tests passing (34 new tests)

## What is MCP?

Model Context Protocol (MCP) is an open protocol that enables AI applications to:

- Access external data sources (databases, APIs, file systems)
- Integrate with tools and services
- Share context between multiple AI agents
- Provide standardized interfaces for data retrieval

## Current State

**Status**: Core Infrastructure Implemented

NERO now has:

- ✅ **MCP Client Service**: Connection management, retry logic, error handling, metrics
- ✅ **MCP-Enhanced Orchestrator**: Multi-turn discussions, shared sessions, artifact management
- ✅ **Agent MCP Registry**: Defines which MCP servers each agent uses
- ✅ **Session Management**: Persistent sessions with shared context across agents
- ✅ **Discussion Framework**: Multi-agent conversations with resolution tracking
- ⚠️ **MCP Servers**: epa-compliance-mcp exists, others are placeholders

NERO uses direct API integrations for:

- eCFR (Electronic Code of Federal Regulations)
- ECMPS (EPA's Emissions Collection and Monitoring Plan System)
- CAMD API (Clean Air Markets Division)

## Planned MCP Integration

### Phase 1: MCP Server Setup

**Goal**: Create MCP servers for NERO's external data sources

**Components**:

1. **eCFR MCP Server**
   - Expose eCFR API through MCP protocol
   - Provide citation lookup capabilities
   - Support regulatory text search

2. **ECMPS MCP Server**
   - Expose ECMPS/CAMD API through MCP
   - Monitoring plan retrieval
   - Emissions data queries

3. **DAHS Configuration MCP Server**
   - Query DAHS capabilities
   - Validate configurations
   - Gap analysis support

### Phase 2: Agent Integration

**Goal**: Update NERO agents to use MCP servers

**Changes**:

1. **RegsBot**
   - Replace direct eCFR API calls with MCP client
   - Use MCP for ECMPS data retrieval
   - Maintain backward compatibility

2. **RequirementsBot**
   - Access DAHS capabilities via MCP
   - Share context across agents through MCP

3. **Collaboration System**
   - Use MCP for inter-agent communication
   - Standardize artifact sharing

### Phase 3: Shared Context

**Goal**: Implement shared context management via MCP

**Features**:

- **Session Management**: Persistent sessions across agent interactions
- **Artifact Storage**: Centralized artifact registry accessible via MCP
- **Evidence Library**: Shared regulatory evidence across workflows
- **Audit Trail**: Complete traceability through MCP logs

## Benefits

### For NERO System

1. **Standardization**: Consistent interface for all external data sources
2. **Modularity**: Easier to add/remove data sources
3. **Testability**: Mock MCP servers for testing
4. **Monitoring**: Centralized logging and observability
5. **Security**: Standardized authentication and authorization

### For Team DAHS

1. **Integration**: DAHS can provide its own MCP server for NERO
2. **Real-time Updates**: NERO can query live DAHS capabilities
3. **Validation**: DAHS can validate NERO proposals through MCP
4. **Bi-directional**: DAHS can also query NERO's evidence library

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NERO Multi-Agent System                   │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ RegsBot  │  │  Reqs    │  │ FigmaBot │  │ Testing  │  │
│  │          │  │  Bot     │  │          │  │  Bot     │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │             │             │         │
│       └─────────────┴─────────────┴─────────────┘         │
│                       │                                    │
│                       ▼                                    │
│              ┌────────────────┐                           │
│              │  MCP Client    │                           │
│              │  Integration   │                           │
│              └────────┬───────┘                           │
└───────────────────────┼───────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌───────────────┐ ┌───────────┐ ┌──────────────┐
│ eCFR MCP      │ │ ECMPS MCP │ │  DAHS MCP    │
│ Server        │ │ Server    │ │  Server      │
│               │ │           │ │              │
│ - Regulations │ │ - Mon.    │ │ - Capability │
│ - Citations   │ │   Plans   │ │   Query      │
│ - Search      │ │ - Emissions│ │ - Validation │
└───────────────┘ └───────────┘ └──────────────┘
```

## Implementation Plan

### Milestone 1: Research & Design (Current)

- [ ] Review MCP specification
- [ ] Design NERO MCP architecture
- [ ] Identify integration points
- [ ] Document this plan

### Milestone 2: Proof of Concept

- [ ] Create simple MCP server for eCFR
- [ ] Update RegsBot to use MCP client
- [ ] Test with existing workflows
- [ ] Validate performance and reliability

### Milestone 3: Full Implementation

- [ ] Implement all MCP servers
- [ ] Update all agents to use MCP
- [ ] Add shared context management
- [ ] Comprehensive testing

### Milestone 4: DAHS Integration

- [ ] Coordinate with DAHS team
- [ ] Define DAHS MCP server interface
- [ ] Implement DAHS MCP client in NERO
- [ ] End-to-end testing

## Technical Considerations

### MCP Server Technologies

- **Language**: TypeScript/Node.js (to match NERO)
- **Protocol**: JSON-RPC over stdio, HTTP, or WebSocket
- **Authentication**: OAuth 2.0 or API keys
- **Caching**: Redis for performance

### Client Implementation

- **Library**: Official MCP SDK
- **Error Handling**: Retry logic with exponential backoff
- **Timeout**: Configurable per server
- **Fallback**: Direct API calls if MCP unavailable

### Testing Strategy

1. **Unit Tests**: Mock MCP servers
2. **Integration Tests**: Real MCP server instances
3. **E2E Tests**: Full workflows with MCP
4. **Performance Tests**: Load testing MCP servers

## Security

### Authentication

- MCP servers require API key authentication
- Keys stored in environment variables
- Rotation policy every 90 days

### Authorization

- Role-based access control
- NERO agents have read-only access
- DAHS MCP server controls write operations

### Data Privacy

- No PII transmitted through MCP
- All data encrypted in transit (TLS)
- Audit logs for compliance

## Monitoring & Observability

### Metrics

- Request/response latency
- Error rates by server
- Cache hit rates
- Concurrent connections

### Logging

- Structured JSON logs
- Request/response payloads (sanitized)
- Error stack traces
- Performance traces

### Alerting

- MCP server unavailability
- High error rates (>5%)
- Slow responses (>5s)
- Authentication failures

## Next Steps

### For NERO Team

1. **Complete Design Review**: Get feedback on this document
2. **Prototype**: Build eCFR MCP server POC
3. **Test**: Validate with existing RegsBot workflows
4. **Document**: Update agent documentation with MCP usage

### For DAHS Team

1. **Review Integration Plan**: Provide feedback on DAHS MCP requirements
2. **Define Interface**: Specify DAHS MCP server capabilities
3. **Coordinate Timeline**: Align DAHS MCP server development with NERO
4. **Testing**: Plan joint integration testing

## Implemented Features (December 8, 2024)

### MCP Client Infrastructure

**Location**: `src/services/mcp-client.ts`

- **MCPClient**: Connection to individual MCP servers
  - Configurable retry logic with exponential backoff
  - Request/response timeout handling
  - Error classification and logging
  - Performance metrics collection (latency, error rate, tool usage)
  - Health check capabilities

- **MCPClientManager**: Central manager for all MCP connections
  - Server registration and retrieval
  - Unified tool invocation interface
  - Aggregate metrics across all servers
  - Health monitoring for all connections

**Tests**: 12 tests covering client behavior, metrics, health checks

### MCP-Enhanced Collaboration

**Location**: `src/agents/collaboration/mcp-orchestrator.ts`

- **MCPCollaborationOrchestrator**: Extends base orchestrator with MCP features
  - **Session Management**: Create, retrieve, update persistent sessions
  - **Artifact Storage**: Store and version artifacts produced by agents
  - **Multi-Turn Discussions**: Start discussions, add messages, resolve with consensus
  - **Context Merging**: Merge contexts from multiple agents with conflict resolution
  - **MCP Integration**: Automatic MCP tool invocation for agent queries
  - **Logging & Monitoring**: Discussion event logs and MCP metrics

**Discussion Features**:
- Message types: statement, question, challenge, response, proposal, agreement, disagreement
- Confidence scores and reasoning for agent responses
- Citation tracking from MCP servers
- Resolution types: consensus, majority, expert-decision, human-override
- Action item generation from discussions

**Tests**: 22 tests covering sessions, artifacts, discussions, context merging

### Agent MCP Registry

**Location**: `src/types/mcp-collaboration.ts`

Defines which MCP servers and tools each agent uses:

| Agent | Primary Server | Common Tools | Enhanced Capabilities |
|-------|---------------|--------------|---------------------|
| RegsBot | epa-compliance | getRegulation, getFormulaMapping, matchEmissionLimits | regulatory-lookup, permit-analysis |
| RequirementsBot | requirements-engine | analyzeGaps, queryCapabilities | gap-analysis, dahs-proposal |
| FigmaBot | requirements-engine | generateWireframes | wireframe-generation |
| TestingBot | testing-automation | generateTestPlan, generateAcceptanceCriteria | test-plan-generation |
| DAHS | dahs-product | queryCapabilities, validateConfiguration | capability-query, feasibility-check |

### Usage Example

```typescript
import { mcpOrchestrator } from '@/agents/collaboration'

// Create a session for agent collaboration
const session = mcpOrchestrator.createSession('permit-analysis-workflow', {
  artifacts: { 'permit-document': permitData }
}, { userId: 'user-123', projectId: 'project-456' })

// Start a discussion between agents
const discussion = mcpOrchestrator.startDiscussion(
  session.sessionId,
  'Analyze permit requirements',
  ['RegsBot', 'RequirementsBot']
)

// Add messages (automatically enhanced with MCP calls)
await mcpOrchestrator.addDiscussionMessage(
  session.sessionId,
  discussion.id,
  'RegsBot',
  'statement',
  'I found 15 regulatory obligations requiring CEMS',
  { 
    citations: ['40 CFR 75.10', '40 CFR 75.11'],
    confidence: 0.95,
    useMCP: true  // Enhances response with MCP server data
  }
)

await mcpOrchestrator.addDiscussionMessage(
  session.sessionId,
  discussion.id,
  'RequirementsBot',
  'response',
  'Gap analysis shows DAHS supports 12 of 15 obligations',
  { confidence: 0.88, useMCP: true }
)

// Resolve the discussion
mcpOrchestrator.resolveDiscussion(session.sessionId, discussion.id, {
  type: 'consensus',
  summary: 'Agreement on gaps requiring development',
  agreedBy: ['RegsBot', 'RequirementsBot'],
  finalDecision: 'Create development backlog for 3 unsupported obligations',
  reasoning: 'Both agents concur on capability analysis',
  actionItems: [
    {
      id: 'action-1',
      title: 'Implement substitute data handling',
      description: 'Add 40 CFR 75.33 substitute data logic',
      assignedTo: 'human',
      priority: 'high',
      status: 'pending'
    }
  ]
})

// Store artifacts from the discussion
mcpOrchestrator.storeArtifact(session.sessionId, {
  type: 'gap-analysis',
  name: 'CEMS Gap Analysis',
  content: gapAnalysisResults,
  producedBy: 'RequirementsBot',
  citations: ['40 CFR 75.10', '40 CFR 75.33']
})

// Get all artifacts from the session
const artifacts = mcpOrchestrator.getSessionArtifacts(session.sessionId)

// Monitor MCP performance
const metrics = mcpOrchestrator.getMCPMetrics()
console.log('EPA Compliance MCP latency:', metrics['epa-compliance'].averageLatency)
```

## Resources

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol)
- NERO Architecture: `docs/VISION.md`
- Agent Documentation: `docs/features/`
- **NEW**: MCP Types: `src/types/mcp-collaboration.ts`
- **NEW**: MCP Client: `src/services/mcp-client.ts`
- **NEW**: MCP Orchestrator: `src/agents/collaboration/mcp-orchestrator.ts`

## Questions & Discussion

### Open Questions

1. Should DAHS provide its own MCP server or should NERO wrap DAHS APIs?
2. What authentication mechanism does DAHS prefer?
3. What is the expected latency for DAHS queries?
4. How should we handle DAHS configuration changes in real-time?

### Team DAHS Input Needed

- [ ] Review and approve MCP integration approach
- [ ] Confirm DAHS MCP server development timeline
- [ ] Specify required DAHS capabilities for MCP
- [ ] Identify DAHS team POC for MCP integration

---

**Document Status**: Draft - Awaiting team DAHS review  
**Next Review**: After Phase 1 POC completion
