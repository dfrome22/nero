/**
 * Dependency Tracker
 *
 * Tracks calculation dependencies and builds dependency graphs for
 * upstream/downstream analysis and impact assessment.
 */

import type {
  CalculationConfig,
  CalculationDependency,
  DependencyGraph,
  DependencyNode,
} from '../../types/calculation-engine'

/**
 * Build a dependency graph from calculation configurations
 */
export function buildDependencyGraph(configs: CalculationConfig[]): DependencyGraph {
  const nodes: DependencyNode[] = []
  const edges: CalculationDependency[] = []

  // Create nodes for each configuration
  for (const config of configs) {
    nodes.push({
      id: config.id,
      name: config.name,
      formulaId: config.formulaId,
      level: 0, // Will be calculated later
      upstreamDependencies: [],
      downstreamDependents: [],
      metadata: {
        frequency: config.frequency,
        status: config.status,
        programs: config.programs,
      },
    })
  }

  // Build edges based on parameter mappings
  for (const config of configs) {
    const targetNode = nodes.find((n) => n.id === config.id)
    if (!targetNode) continue

    // Check each parameter mapping to find dependencies
    for (const [paramName, dataSource] of Object.entries(config.parameterMappings)) {
      // Check if data source references another calculation's output
      const sourceConfig = configs.find((c) => {
        // Data source format: "calc:<calcId>:output" or just "calcId"
        const calcId = dataSource.startsWith('calc:') ? dataSource.split(':')[1] : dataSource
        return c.id === calcId
      })

      if (sourceConfig) {
        const sourceNode = nodes.find((n) => n.id === sourceConfig.id)
        if (sourceNode) {
          // Create dependency edge
          edges.push({
            sourceId: sourceConfig.id,
            sourceName: sourceConfig.name,
            targetId: config.id,
            targetName: config.name,
            type: 'output',
            dataFlow: paramName,
            required: true,
            description: `${config.name} depends on ${sourceConfig.name} for parameter ${paramName}`,
          })

          // Update node dependencies
          targetNode.upstreamDependencies.push(sourceConfig.id)
          sourceNode.downstreamDependents.push(config.id)
        }
      }
    }
  }

  // Calculate execution levels
  calculateExecutionLevels(nodes, edges)

  // Perform topological sort
  const executionOrder = topologicalSort(nodes, edges)

  // Find root and leaf nodes
  const rootNodes = nodes.filter((n) => n.upstreamDependencies.length === 0).map((n) => n.id)
  const leafNodes = nodes.filter((n) => n.downstreamDependents.length === 0).map((n) => n.id)

  // Detect cycles
  const cycles = detectCycles(nodes, edges)

  return {
    nodes,
    edges,
    executionOrder,
    rootNodes,
    leafNodes,
    cycles,
  }
}

/**
 * Calculate execution level for each node (0 = root, higher = more dependencies)
 */
function calculateExecutionLevels(nodes: DependencyNode[], edges: CalculationDependency[]): void {
  // edges parameter used to maintain consistency with other functions
  const visited = new Set<string>()
  const levels = new Map<string, number>()

  // Initialize all nodes to level 0
  for (const node of nodes) {
    levels.set(node.id, 0)
  }

  // Calculate levels using BFS
  const queue: string[] = nodes.filter((n) => n.upstreamDependencies.length === 0).map((n) => n.id)

  while (queue.length > 0) {
    const nodeId = queue.shift()
    if (nodeId === undefined || visited.has(nodeId)) continue

    visited.add(nodeId)
    const currentLevel = levels.get(nodeId) ?? 0

    // Find all downstream nodes
    const downstreamEdges = edges.filter((e) => e.sourceId === nodeId)
    for (const edge of downstreamEdges) {
      const downstreamLevel = levels.get(edge.targetId) ?? 0
      const newLevel = Math.max(downstreamLevel, currentLevel + 1)
      levels.set(edge.targetId, newLevel)

      if (!visited.has(edge.targetId)) {
        queue.push(edge.targetId)
      }
    }
  }

  // Update node levels
  for (const node of nodes) {
    node.level = levels.get(node.id) ?? 0
  }
}

/**
 * Topological sort to determine execution order
 * Note: Uses node.upstreamDependencies rather than edges parameter for traversal
 */
function topologicalSort(nodes: DependencyNode[], _edges: CalculationDependency[]): string[] {
  const sorted: string[] = []
  const visited = new Set<string>()
  const visiting = new Set<string>()

  function visit(nodeId: string): void {
    if (visited.has(nodeId)) return
    if (visiting.has(nodeId)) {
      // Cycle detected - skip for now
      return
    }

    visiting.add(nodeId)

    // Visit all upstream dependencies first
    const node = nodes.find((n) => n.id === nodeId)
    if (node) {
      for (const depId of node.upstreamDependencies) {
        visit(depId)
      }
    }

    visiting.delete(nodeId)
    visited.add(nodeId)
    sorted.push(nodeId)
  }

  // Visit all nodes
  for (const node of nodes) {
    visit(node.id)
  }

  return sorted
}

/**
 * Detect circular dependencies
 * Note: Uses node.upstreamDependencies rather than edges parameter for traversal
 */
function detectCycles(nodes: DependencyNode[], _edges: CalculationDependency[]): string[][] {
  const cycles: string[][] = []
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function dfs(nodeId: string, path: string[]): void {
    visited.add(nodeId)
    recursionStack.add(nodeId)
    path.push(nodeId)

    // Find all nodes this one depends on
    const node = nodes.find((n) => n.id === nodeId)
    if (node) {
      for (const depId of node.upstreamDependencies) {
        if (!visited.has(depId)) {
          dfs(depId, [...path])
        } else if (recursionStack.has(depId)) {
          // Cycle detected
          const cycleStartIndex = path.indexOf(depId)
          if (cycleStartIndex !== -1) {
            cycles.push([...path.slice(cycleStartIndex), depId])
          }
        }
      }
    }

    recursionStack.delete(nodeId)
  }

  // Check each node
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, [])
    }
  }

  return cycles
}

/**
 * Get all upstream dependencies for a calculation (recursive)
 */
export function getUpstreamDependencies(
  calculationId: string,
  graph: DependencyGraph
): DependencyNode[] {
  const result: DependencyNode[] = []
  const visited = new Set<string>()

  function traverse(nodeId: string): void {
    if (visited.has(nodeId)) return
    visited.add(nodeId)

    const node = graph.nodes.find((n) => n.id === nodeId)
    if (!node) return

    for (const depId of node.upstreamDependencies) {
      const depNode = graph.nodes.find((n) => n.id === depId)
      if (depNode) {
        result.push(depNode)
        traverse(depId)
      }
    }
  }

  traverse(calculationId)
  return result
}

/**
 * Get all downstream dependents for a calculation (recursive)
 */
export function getDownstreamDependents(
  calculationId: string,
  graph: DependencyGraph
): DependencyNode[] {
  const result: DependencyNode[] = []
  const visited = new Set<string>()

  function traverse(nodeId: string): void {
    if (visited.has(nodeId)) return
    visited.add(nodeId)

    const node = graph.nodes.find((n) => n.id === nodeId)
    if (!node) return

    for (const depId of node.downstreamDependents) {
      const depNode = graph.nodes.find((n) => n.id === depId)
      if (depNode) {
        result.push(depNode)
        traverse(depId)
      }
    }
  }

  traverse(calculationId)
  return result
}

/**
 * Find the path between two calculations
 */
export function findDependencyPath(
  fromId: string,
  toId: string,
  graph: DependencyGraph
): string[] | null {
  const visited = new Set<string>()

  function dfs(currentId: string, path: string[]): string[] | null {
    if (currentId === toId) {
      return [...path, currentId]
    }

    if (visited.has(currentId)) return null
    visited.add(currentId)

    const node = graph.nodes.find((n) => n.id === currentId)
    if (!node) return null

    // Try each downstream dependent
    for (const nextId of node.downstreamDependents) {
      const result = dfs(nextId, [...path, currentId])
      if (result) return result
    }

    return null
  }

  return dfs(fromId, [])
}

/**
 * Calculate the critical path (longest path through the graph)
 */
export function calculateCriticalPath(graph: DependencyGraph): string[] {
  const distances = new Map<string, number>()
  const predecessors = new Map<string, string>()

  // Initialize distances
  for (const node of graph.nodes) {
    distances.set(node.id, 0)
  }

  // Process nodes in topological order
  for (const nodeId of graph.executionOrder) {
    const currentDist = distances.get(nodeId) ?? 0

    const node = graph.nodes.find((n) => n.id === nodeId)
    if (!node) continue

    // Update distances to downstream nodes
    for (const nextId of node.downstreamDependents) {
      const nextDist = distances.get(nextId) ?? 0
      const newDist = currentDist + 1

      if (newDist > nextDist) {
        distances.set(nextId, newDist)
        predecessors.set(nextId, nodeId)
      }
    }
  }

  // Find node with maximum distance (end of critical path)
  let maxDist = 0
  let endNode = ''
  for (const [nodeId, dist] of distances.entries()) {
    if (dist > maxDist) {
      maxDist = dist
      endNode = nodeId
    }
  }

  // Reconstruct path
  const path: string[] = []
  let current = endNode
  while (current) {
    path.unshift(current)
    current = predecessors.get(current) ?? ''
  }

  return path
}

/**
 * Validate dependency graph (check for issues)
 */
export function validateDependencyGraph(graph: DependencyGraph): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for cycles
  if (graph.cycles.length > 0) {
    errors.push(`Circular dependencies detected: ${graph.cycles.length} cycle(s)`)
    for (const cycle of graph.cycles) {
      errors.push(`  Cycle: ${cycle.join(' -> ')}`)
    }
  }

  // Check for disconnected subgraphs
  const reachableFromRoots = new Set<string>()
  for (const rootId of graph.rootNodes) {
    reachableFromRoots.add(rootId)
    const downstream = getDownstreamDependents(rootId, graph)
    for (const node of downstream) {
      reachableFromRoots.add(node.id)
    }
  }

  const unreachableNodes = graph.nodes.filter((n) => !reachableFromRoots.has(n.id))
  if (unreachableNodes.length > 0) {
    warnings.push(`${unreachableNodes.length} node(s) not reachable from root nodes`)
  }

  // Check for missing dependencies
  for (const edge of graph.edges) {
    const sourceExists = graph.nodes.some((n) => n.id === edge.sourceId)
    const targetExists = graph.nodes.some((n) => n.id === edge.targetId)

    if (!sourceExists) {
      errors.push(`Edge references non-existent source node: ${edge.sourceId}`)
    }
    if (!targetExists) {
      errors.push(`Edge references non-existent target node: ${edge.targetId}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
