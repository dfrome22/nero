# NERO - Multi-Agent AI Orchestration Platform

> EPA Regulatory Compliance through Intelligent Agent Collaboration

## Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Start development server
npm run dev

# Run tests
npm test              # Unit tests (watch mode)
npm run test:run      # Unit tests (single run)
npm run test:e2e      # E2E tests with Playwright
npm run validate      # TypeCheck + Lint + Tests
```

## Project Structure

```
nero/
├── src/
│   ├── agents/          # Agent logic modules (future)
│   ├── components/      # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   ├── layouts/         # Page layout components
│   ├── pages/           # Route page components
│   │   └── agents/      # Individual agent pages
│   ├── test/            # Test setup and utilities
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── e2e/                 # Playwright E2E tests
├── docs/                # Feature documentation
│   └── features/        # Feature-specific docs
└── public/              # Static assets
```

## NPM Scripts

| Script                  | Description                              |
| ----------------------- | ---------------------------------------- |
| `npm run dev`           | Start Vite dev server                    |
| `npm run build`         | TypeScript build + Vite production build |
| `npm run preview`       | Preview production build                 |
| `npm test`              | Run Vitest in watch mode                 |
| `npm run test:run`      | Run Vitest once                          |
| `npm run test:coverage` | Run tests with coverage report           |
| `npm run test:e2e`      | Run Playwright E2E tests                 |
| `npm run test:e2e:ui`   | Run Playwright with UI                   |
| `npm run test:all`      | Lint + TypeCheck + Unit + E2E tests      |
| `npm run lint`          | Run ESLint                               |
| `npm run typecheck`     | Run TypeScript type checking             |
| `npm run validate`      | TypeCheck + Lint + Unit tests            |

## Documentation

- [VISION.md](./docs/VISION.md) - Project vision and architecture
- [CHANGELOG.md](./docs/CHANGELOG.md) - Version history
- [TODO.md](./docs/TODO.md) - Current tasks and roadmap

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build**: Vite
- **Testing**: Vitest + React Testing Library + Playwright
- **Linting**: ESLint with strict TypeScript rules
- **Styling**: CSS Modules

## License

MIT
