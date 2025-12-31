/**
 * MCP Client Service
 *
 * Handles communication with MCP servers, including connection management,
 * retry logic, error handling, and metric collection.
 */

import type {
  MCPServerConfig,
  MCPToolRequest,
  MCPToolResponse,
  MCPError,
  MCPMetrics,
} from '@/types/mcp-collaboration'

/**
 * MCP Client for communicating with Model Context Protocol servers
 */
export class MCPClient {
  private config: MCPServerConfig
  private metrics: MCPMetrics
  private errors: MCPError[] = []

  constructor(config: MCPServerConfig) {
    this.config = config
    this.metrics = this.initializeMetrics()
  }

  /**
   * Call an MCP tool with retry logic
   */
  async callTool(request: MCPToolRequest): Promise<MCPToolResponse> {
    const startTime = Date.now()
    let lastError: Error | undefined
    let retryCount = 0

    // Retry logic
    while (retryCount <= this.config.retryAttempts) {
      try {
        const result = await this.executeToolCall(request)
        const duration = Date.now() - startTime

        // Update metrics on success
        this.updateMetrics({
          success: true,
          duration,
          toolName: request.toolName,
        })

        return {
          success: true,
          data: result,
          metadata: {
            serverId: request.serverId,
            toolName: request.toolName,
            duration,
            timestamp: new Date().toISOString(),
            retryCount,
          },
        }
      } catch (error) {
        lastError = error as Error
        retryCount++

        // If not the last attempt, wait before retrying
        if (retryCount <= this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * retryCount) // Exponential backoff
        }
      }
    }

    // All retries failed
    const duration = Date.now() - startTime
    const mcpError: MCPError = {
      type: this.classifyError(lastError),
      serverId: request.serverId,
      message: lastError?.message ?? 'Unknown error',
      details: lastError,
      timestamp: new Date().toISOString(),
      retryable: retryCount < this.config.retryAttempts,
      retryCount,
    }

    this.errors.push(mcpError)
    this.updateMetrics({
      success: false,
      duration,
      toolName: request.toolName,
    })

    return {
      success: false,
      error: {
        code: mcpError.type,
        message: mcpError.message,
        details: mcpError.details,
      },
      metadata: {
        serverId: request.serverId,
        toolName: request.toolName,
        duration,
        timestamp: new Date().toISOString(),
        retryCount,
      },
    }
  }

  /**
   * Execute the actual tool call (to be implemented with real MCP SDK)
   */
  private async executeToolCall(request: MCPToolRequest): Promise<unknown> {
    // TODO: Implement real MCP SDK integration
    // For now, this is a placeholder that simulates MCP calls
    
    // Simulate network delay
    await this.delay(100 + Math.random() * 200)

    // Simulate occasional failures (but not in tests)
    // In tests, never fail; in production, fail 5% of the time
    const failureRate = 0 // Disabled for now to avoid test flakiness
    if (Math.random() < failureRate) {
      throw new Error('Simulated MCP server error')
    }

    // Return mock data
    return {
      tool: request.toolName,
      arguments: request.arguments,
      result: 'Mock result from MCP server',
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Get current metrics for this server
   */
  getMetrics(): MCPMetrics {
    return { ...this.metrics }
  }

  /**
   * Get recent errors
   */
  getErrors(limit = 10): MCPError[] {
    return this.errors.slice(-limit)
  }

  /**
   * Clear error history
   */
  clearErrors(): void {
    this.errors = []
  }

  /**
   * Check if server is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.callTool({
        serverId: this.config.name,
        toolName: 'ping',
        arguments: {},
        timeout: 5000,
      })
      return response.success
    } catch {
      return false
    }
  }

  // =============================================================================
  // PRIVATE HELPERS
  // =============================================================================

  private initializeMetrics(): MCPMetrics {
    const now = new Date().toISOString()
    return {
      serverId: this.config.name,
      timeWindow: {
        start: now,
        end: now,
      },
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      errorRate: 0,
      averageLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      toolUsage: {},
    }
  }

  private updateMetrics(result: {
    success: boolean
    duration: number
    toolName: string
  }): void {
    this.metrics.totalRequests++
    
    if (result.success) {
      this.metrics.successfulRequests++
    } else {
      this.metrics.failedRequests++
    }

    this.metrics.errorRate = this.metrics.failedRequests / this.metrics.totalRequests

    // Update tool usage
    const currentUsage = this.metrics.toolUsage[result.toolName] ?? 0
    this.metrics.toolUsage[result.toolName] = currentUsage + 1

    // Update latency (simplified - real implementation would track all values)
    const currentAvg = this.metrics.averageLatency
    const newCount = this.metrics.totalRequests
    this.metrics.averageLatency = 
      (currentAvg * (newCount - 1) + result.duration) / newCount

    // Update time window
    this.metrics.timeWindow.end = new Date().toISOString()
  }

  private classifyError(error: Error | undefined): MCPError['type'] {
    if (!error) return 'server-error'
    
    const message = error.message.toLowerCase()
    
    if (message.includes('timeout')) return 'timeout'
    if (message.includes('connection')) return 'connection'
    if (message.includes('auth')) return 'authentication'
    if (message.includes('conflict')) return 'conflict'
    if (message.includes('tool')) return 'tool-error'
    
    return 'server-error'
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

/**
 * MCP Client Manager - manages multiple MCP server connections
 */
export class MCPClientManager {
  private clients = new Map<string, MCPClient>()

  /**
   * Register an MCP server
   */
  registerServer(config: MCPServerConfig): void {
    const client = new MCPClient(config)
    this.clients.set(config.name, client)
  }

  /**
   * Get a client for a specific server
   */
  getClient(serverId: string): MCPClient | undefined {
    return this.clients.get(serverId)
  }

  /**
   * Call a tool on a specific server
   */
  async callTool(request: MCPToolRequest): Promise<MCPToolResponse> {
    const client = this.clients.get(request.serverId)
    
    if (!client) {
      return {
        success: false,
        error: {
          code: 'server-not-found',
          message: `MCP server '${request.serverId}' not registered`,
        },
        metadata: {
          serverId: request.serverId,
          toolName: request.toolName,
          duration: 0,
          timestamp: new Date().toISOString(),
          retryCount: 0,
        },
      }
    }

    return client.callTool(request)
  }

  /**
   * Get metrics for all servers
   */
  getAllMetrics(): Record<string, MCPMetrics> {
    const metrics: Record<string, MCPMetrics> = {}
    
    for (const [serverId, client] of this.clients.entries()) {
      metrics[serverId] = client.getMetrics()
    }
    
    return metrics
  }

  /**
   * Health check all servers
   */
  async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}
    
    const checks = Array.from(this.clients.entries()).map(async ([serverId, client]) => {
      results[serverId] = await client.healthCheck()
    })
    
    await Promise.all(checks)
    return results
  }

  /**
   * Get all clients
   */
  getAllClients(): Map<string, MCPClient> {
    return new Map(this.clients)
  }
}

// Singleton instance
export const mcpClientManager = new MCPClientManager()

// Initialize default MCP servers (can be overridden)
export function initializeDefaultMCPServers(): void {
  // EPA Compliance MCP Server
  mcpClientManager.registerServer({
    name: 'epa-compliance',
    type: 'stdio',
    command: 'node',
    args: ['packages/epa-compliance-mcp/dist/index.js'],
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  })

  // Placeholder for future servers
  // These would be registered when their implementations are ready
  
  // DAHS Product MCP Server (TODO)
  mcpClientManager.registerServer({
    name: 'dahs-product',
    type: 'http',
    url: 'http://localhost:3001/mcp',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  })

  // Testing Automation MCP Server (TODO)
  mcpClientManager.registerServer({
    name: 'testing-automation',
    type: 'stdio',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  })

  // Requirements Engine MCP Server (TODO)
  mcpClientManager.registerServer({
    name: 'requirements-engine',
    type: 'stdio',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  })
}
