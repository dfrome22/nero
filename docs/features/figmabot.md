# FigmaBot

> The Designer - Scaffolding compliant UI/UX experiences

## Overview

FigmaBot transforms requirements and workflows into visual design artifacts that can be implemented by development teams or exported to Figma.

## Capabilities

### Screen Inventory

- Identify required screens from requirements
- Map screens to workflow steps
- Define screen hierarchy and navigation

### Wireframe Generation

- Create low-fidelity wireframes
- Include requirement IDs in annotations
- Apply accessibility guidelines

### Component Mapping

- Identify reusable components
- Map to design system
- Generate component specifications

### Figma Integration

- Create/update Figma frames
- Link frames to requirement IDs
- Export design tokens

## Outputs

### WireframeSpec Artifact

```typescript
interface WireframeSpecData {
  screens: Screen[]
  components: ComponentSpec[]
  navigation: NavigationMap
  accessibilityNotes: string[]
}

interface Screen {
  id: string
  name: string
  description: string
  wireframeUrl?: string
  requirementLinks: string[]
  workflowStepLinks: string[]
  components: string[]
}

interface ComponentSpec {
  id: string
  name: string
  type: string
  props: Record<string, unknown>
  accessibility: AccessibilitySpec
}
```

### Trace Links

Every screen traces to requirements and/or workflow steps:

```typescript
interface TraceLink {
  id: string
  type: 'screen-requirement' | 'screen-workflow'
  sourceId: string // Screen ID
  targetId: string // Requirement or Workflow ID
  createdAt: string
}
```

## Workflow Role

FigmaBot typically receives input from RequirementsBot:

```
RequirementsBot → ApprovalGate → FigmaBot → ApprovalGate → Publish
```

## Review Interface

For each WireframeSpec, BA/Designer can:

- View screen inventory
- Preview wireframes
- Check requirement coverage
- Review accessibility notes

## Acceptance Criteria

- [ ] Generates screen inventory from requirements
- [ ] Creates wireframe specifications
- [ ] Links screens to requirements
- [ ] Links screens to workflow steps
- [ ] Identifies reusable components
- [ ] Includes accessibility guidelines
- [ ] Can export to Figma (P1)
- [ ] Produces versioned WireframeSpec artifact
