# TODO

Current development tasks and roadmap for NERO.

## Current Sprint

### In Progress

- [ ] Initial project setup and scaffolding

### Up Next

- [ ] Implement agent type definitions
- [ ] Create shared agent interface
- [ ] Set up agent context/state management

## Backlog

### RegsBot

- [ ] Define regulatory document types
- [ ] Create document ingestion interface
- [ ] Design RAG pipeline architecture
- [ ] Implement vector database integration
- [ ] Build citation extraction system
- [ ] Create regulatory query interface
- **Feature Doc**: `docs/features/regsbot.md` (to be created)

### RequirementsBot

- [ ] Define requirements output schemas
- [ ] Create persona template system
- [ ] Build workflow diagram generator
- [ ] Implement user journey mapper
- [ ] Design traceability matrix
- [ ] Create requirements export formats
- **Feature Doc**: `docs/features/requirementsbot.md` (to be created)

### FigmaBot

- [ ] Research Figma API integration
- [ ] Define component library structure
- [ ] Create wireframe generation system
- [ ] Implement accessibility checker
- [ ] Build design-to-code pipeline
- **Feature Doc**: `docs/features/figmabot.md` (to be created)

### TestingBot

- [ ] Define test specification format
- [ ] Create acceptance criteria generator
- [ ] Build test scaffold generator
- [ ] Implement coverage requirement system
- [ ] Design TDD workflow automation
- **Feature Doc**: `docs/features/testingbot.md` (to be created)

### Orchestration Layer

- [ ] Define agent communication protocol
- [ ] Create task routing system
- [ ] Implement context sharing mechanism
- [ ] Build human-approval gates
- [ ] Design feedback loop system

### Infrastructure

- [ ] Set up CI/CD pipeline
- [ ] Configure environment variables
- [ ] Add authentication system
- [ ] Implement logging and monitoring
- [ ] Create deployment configuration

## Completed

- [x] Project scaffolding (React + TypeScript + Vite)
- [x] TDD infrastructure (Vitest + Playwright)
- [x] Left-nav layout with sidebar
- [x] Dashboard with agent cards
- [x] Agent placeholder pages
- [x] Strict linting configuration
- [x] Core documentation structure

---

## Notes

When starting a new feature:

1. Create feature doc in `docs/features/[feature-name].md`
2. Reference it from this TODO
3. Write tests first (TDD)
4. Update CHANGELOG when complete
