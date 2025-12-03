# NERO Development Guidelines

## TDD Workflow

This project follows strict Test-Driven Development:

1. **Write tests first** - Before implementing any feature
2. **Run tests to see them fail** - Confirm the test is valid
3. **Implement minimum code** - Just enough to pass
4. **Refactor** - Clean up while tests pass
5. **Repeat**

## Testing Commands

```bash
npm test              # Watch mode for development
npm run test:run      # Single run (CI)
npm run test:coverage # With coverage report
npm run test:e2e      # Playwright E2E tests
npm run test:all      # Full test suite + lint + typecheck
npm run validate      # Quick validation (no E2E)
```

## Code Quality

### TypeScript

- Strict mode enabled with all null checks
- No implicit any
- Explicit return types on functions
- Run `npm run typecheck` before commits

### ESLint

- Strict type-checked rules
- No console.log (use console.warn/error)
- Prefer const, no var
- Run `npm run lint` before commits

### Prettier

- Auto-formats on save
- Single quotes, no semicolons
- Run `npx prettier --write .` to format all

### Pre-commit Hooks

- Husky runs lint-staged on commit
- All staged files are linted and formatted
- Commits will fail if there are lint errors

### Validation

```bash
npm run validate  # TypeCheck + Lint + Tests
```

## Documentation Structure

```
docs/
├── VISION.md      # Project vision and architecture
├── CHANGELOG.md   # Version history
├── TODO.md        # Current tasks (references feature docs)
└── features/      # Feature-specific documentation
    ├── regsbot.md
    ├── requirementsbot.md
    ├── figmabot.md
    └── testingbot.md
```

### Feature Documentation Pattern

When implementing a feature:

1. Create `docs/features/[feature].md`
2. Document purpose, API, and usage
3. Reference from TODO.md
4. Update CHANGELOG.md when complete

## Path Aliases

Use path aliases for clean imports:

```typescript
import Component from '@/components/Component'
import { useHook } from '@/hooks/useHook'
import type { MyType } from '@/types/types'
```

Available aliases:

- `@/*` → `src/*`
- `@components/*` → `src/components/*`
- `@pages/*` → `src/pages/*`
- `@layouts/*` → `src/layouts/*`
- `@agents/*` → `src/agents/*`
- `@hooks/*` → `src/hooks/*`
- `@utils/*` → `src/utils/*`
- `@types/*` → `src/types/*`

## Agent Development Guidelines

### Multi-Agent Architecture

NERO uses a multi-agent system where each agent has specific responsibilities:

- **RegsBot**: EPA regulatory knowledge (eCFR, permits, citations)
- **RequirementsBot**: Requirements engineering (personas, workflows, specs)
- **FigmaBot**: UI/UX design automation (wireframes, components)
- **TestingBot**: TDD infrastructure (test specs, acceptance criteria)

### Agent Implementation Pattern

When working on an agent:

1. Check `docs/features/[agent].md` for specifications
2. Agent code goes in `src/agents/[agent]/`
3. Agent page in `src/pages/agents/[Agent].tsx`
4. Write unit tests alongside implementation
5. Update TODO.md progress

### Context Sharing

Agents communicate through structured protocols. When implementing agent interactions:

1. Define input/output types in `src/types/`
2. Use clear interfaces for agent communication
3. Maintain traceability to source requirements
4. Include human-approval gates at critical points

## Git Workflow

1. Create feature branch from `develop`
2. Make changes with passing tests
3. Commit with descriptive messages
4. Pre-commit hooks will validate
5. Push and create PR to `develop`
6. CI will run full validation
