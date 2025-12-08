/**
 * MCP Client Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MCPClient, MCPClientManager } from './mcp-client'
import type { MCPServerConfig, MCPToolRequest } from '@/types/mcp-collaboration'

describe('MCPClient', () => {
  let client: MCPClient
  let config: MCPServerConfig

  beforeEach(() => {
    config = {
      name: 'test-server',
      type: 'stdio',
      timeout: 5000,
      retryAttempts: 2,
      retryDelay: 100,
    }
    client = new MCPClient(config)
  })

  describe('callTool', () => {
    it('should successfully call a tool', async () => {
      const request: MCPToolRequest = {
        serverId: 'test-server',
        toolName: 'test-tool',
        arguments: { param: 'value' },
      }

      const response = await client.callTool(request)

      expect(response.success).toBe(true)
      expect(response.metadata.serverId).toBe('test-server')
      expect(response.metadata.toolName).toBe('test-tool')
      expect(response.metadata.retryCount).toBe(0)
    })

    it('should include metadata in response', async () => {
      const request: MCPToolRequest = {
        serverId: 'test-server',
        toolName: 'test-tool',
        arguments: {},
      }

      const response = await client.callTool(request)

      expect(response.metadata).toHaveProperty('serverId')
      expect(response.metadata).toHaveProperty('toolName')
      expect(response.metadata).toHaveProperty('duration')
      expect(response.metadata).toHaveProperty('timestamp')
      expect(response.metadata).toHaveProperty('retryCount')
    })
  })

  describe('getMetrics', () => {
    it('should return metrics', () => {
      const metrics = client.getMetrics()

      expect(metrics).toHaveProperty('serverId')
      expect(metrics).toHaveProperty('totalRequests')
      expect(metrics).toHaveProperty('successfulRequests')
      expect(metrics).toHaveProperty('failedRequests')
      expect(metrics).toHaveProperty('errorRate')
      expect(metrics).toHaveProperty('averageLatency')
    })

    it('should update metrics after tool calls', async () => {
      const request: MCPToolRequest = {
        serverId: 'test-server',
        toolName: 'test-tool',
        arguments: {},
      }

      await client.callTool(request)
      const metrics = client.getMetrics()

      expect(metrics.totalRequests).toBe(1)
      expect(metrics.successfulRequests).toBe(1)
      expect(metrics.toolUsage['test-tool']).toBe(1)
    })
  })

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const isHealthy = await client.healthCheck()
      expect(typeof isHealthy).toBe('boolean')
    })
  })
})

describe('MCPClientManager', () => {
  let manager: MCPClientManager

  beforeEach(() => {
    manager = new MCPClientManager()
  })

  describe('registerServer', () => {
    it('should register a server', () => {
      const config: MCPServerConfig = {
        name: 'test-server',
        type: 'stdio',
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
      }

      manager.registerServer(config)
      const client = manager.getClient('test-server')

      expect(client).toBeDefined()
    })
  })

  describe('getClient', () => {
    it('should return client for registered server', () => {
      const config: MCPServerConfig = {
        name: 'test-server',
        type: 'stdio',
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
      }

      manager.registerServer(config)
      const client = manager.getClient('test-server')

      expect(client).toBeInstanceOf(MCPClient)
    })

    it('should return undefined for unregistered server', () => {
      const client = manager.getClient('nonexistent')
      expect(client).toBeUndefined()
    })
  })

  describe('callTool', () => {
    it('should call tool on registered server', async () => {
      const config: MCPServerConfig = {
        name: 'test-server',
        type: 'stdio',
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
      }

      manager.registerServer(config)

      const request: MCPToolRequest = {
        serverId: 'test-server',
        toolName: 'test-tool',
        arguments: {},
      }

      const response = await manager.callTool(request)
      expect(response.success).toBe(true)
    })

    it('should return error for unregistered server', async () => {
      const request: MCPToolRequest = {
        serverId: 'nonexistent',
        toolName: 'test-tool',
        arguments: {},
      }

      const response = await manager.callTool(request)

      expect(response.success).toBe(false)
      expect(response.error?.code).toBe('server-not-found')
    })
  })

  describe('getAllMetrics', () => {
    it('should return metrics for all servers', () => {
      const config1: MCPServerConfig = {
        name: 'server-1',
        type: 'stdio',
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
      }

      const config2: MCPServerConfig = {
        name: 'server-2',
        type: 'http',
        url: 'http://localhost:3000',
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
      }

      manager.registerServer(config1)
      manager.registerServer(config2)

      const metrics = manager.getAllMetrics()

      expect(metrics).toHaveProperty('server-1')
      expect(metrics).toHaveProperty('server-2')
    })
  })

  describe('healthCheckAll', () => {
    it('should check health of all servers', async () => {
      const config: MCPServerConfig = {
        name: 'test-server',
        type: 'stdio',
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
      }

      manager.registerServer(config)
      const results = await manager.healthCheckAll()

      expect(results).toHaveProperty('test-server')
      expect(typeof results['test-server']).toBe('boolean')
    })
  })
})
