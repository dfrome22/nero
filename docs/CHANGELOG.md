# Changelog

All notable changes to NERO will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial project scaffolding with React 19 + TypeScript
- Vite build configuration with path aliases
- Left-hand navigation sidebar with agent links
- Dashboard with agent cards module layout
- Placeholder pages for all four agents (RegsBot, RequirementsBot, FigmaBot, TestingBot)
- TDD infrastructure:
  - Vitest for unit testing with React Testing Library
  - Playwright for E2E testing
  - Strict ESLint configuration
  - Strict TypeScript configuration
- CSS Modules styling system
- Core documentation structure (VISION, CHANGELOG, TODO)

### Technical Decisions

- Chose Vitest over Jest for better Vite integration
- Chose Playwright over Cypress for better cross-browser support
- Strict TypeScript with all null checks enabled
- ESLint strict type-checked configuration
- CSS Modules over Tailwind for explicit styling

## [0.1.0] - 2024-12-03

### Added

- Project initialization
- Basic project structure
