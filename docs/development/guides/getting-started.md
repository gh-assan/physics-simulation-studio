# Getting Started with Physics Simulation Studio

**Status**: Active  
**Created**: 2025-08-11  
**Last Updated**: 2025-08-11  
**Author(s)**: AI Assistant  
**Related**: [Architecture Overview](../architecture/ARCHITECTURE.md), [Development Protocols](../protocols/)

## Overview

This guide will help you get started with developing the Physics Simulation Studio project. Follow these steps to set up your development environment and understand the project structure.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)  
- **Git**
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Code editor (VS Code recommended)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/gh-assan/physics-simulation-studio.git
cd physics-simulation-studio
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

This will start the Vite development server. Open your browser to `http://localhost:5173` to see the application.

### 4. Run Tests

```bash
npm test
```

### 5. Build for Production

```bash
npm run build
```

## Project Structure

```
physics-simulation-studio/
├── src/                          # Source code
│   ├── core/                     # Core ECS framework
│   ├── plugins/                  # Simulation plugins
│   ├── studio/                   # Studio UI components
│   ├── renderer/                 # Rendering systems
│   └── utils/                    # Utility functions
├── docs/                         # Documentation
├── tests/                        # Test files
├── public/                       # Static assets
├── build/                        # Build artifacts
└── scripts/                      # Build and utility scripts
```

## Development Workflow

### 1. Follow TDD Protocol

The project follows a strict Test-Driven Development approach. See [TDD Protocol](../protocols/tdd-protocol.md) for details.

**Basic TDD Cycle:**
1. Write a failing test
2. Write minimal code to make it pass
3. Refactor while keeping tests green
4. Repeat

### 2. Safety Checks

Before making any changes, run the safety check:

```bash
npm run pre-change
```

This verifies:
- All tests are passing
- Code builds successfully
- No lint errors exist

### 3. Architecture Guidelines

- Follow the ECS (Entity-Component-System) pattern
- Keep plugins self-contained and modular
- Separate simulation logic from rendering
- Maintain clean separation of concerns

See [Architecture Overview](../architecture/ARCHITECTURE.md) for detailed patterns.

### 4. Creating New Simulations

To create a new simulation:

1. Create a new plugin in `src/plugins/`
2. Implement required interfaces
3. Add necessary components and systems
4. Write comprehensive tests
5. Update documentation

See [Create Simulation Guide](create-simulation.md) for detailed steps.

## Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Testing  
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint errors automatically
npm run format          # Run Prettier formatting
npm run type-check      # Run TypeScript type checking

# Safety Checks
npm run pre-change      # Run before making changes
npm run tdd-check       # Verify TDD compliance
npm run safety-check    # Full safety validation
npm run safe-commit     # Commit with safety checks
```

## Development Tools

### VS Code Extensions

Recommended extensions for optimal development experience:
- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- Jest Runner
- GitLens
- Vite

### Browser Development Tools

For debugging simulations:
- Chrome DevTools for performance profiling
- Browser physics inspector extensions
- Three.js DevTools for 3D debugging

## Common Development Tasks

### Adding a New Component

```typescript
// 1. Define the component interface
export interface MyComponent {
  property1: number;
  property2: string;
}

// 2. Create component factory
export function createMyComponent(params: Partial<MyComponent>): MyComponent {
  return {
    property1: params.property1 ?? 0,
    property2: params.property2 ?? 'default',
  };
}

// 3. Write tests first (TDD)
// 4. Integrate with systems
```

### Adding a New System

```typescript
// 1. Implement System interface
export class MySystem implements System {
  update(entities: Entity[], deltaTime: number): void {
    // System logic here
  }
}

// 2. Register with plugin
// 3. Write comprehensive tests
```

### Debugging Tips

1. **Use the Debug Panel**: Enable debug mode to see entity information
2. **Console Logging**: Use structured logging with context
3. **Browser DevTools**: Profile rendering performance
4. **Test Isolation**: Run specific tests to isolate issues
5. **State Inspection**: Use debug utilities to inspect entity state

## Troubleshooting

### Common Issues

**Build Errors:**
- Check TypeScript configuration
- Verify all imports are correct
- Ensure all dependencies are installed

**Test Failures:**
- Run tests individually to isolate issues
- Check test setup and teardown
- Verify mock configurations

**Performance Issues:**
- Profile with browser DevTools
- Check for unnecessary re-renders
- Optimize system update loops

### Getting Help

- Check [Debugging Guide](debugging.md) for detailed troubleshooting
- Review [Findings Documentation](../../findings/README.md) for known issues
- Consult [Architecture Documentation](../architecture/) for design patterns

## Next Steps

After getting set up:

1. Read the [Architecture Overview](../architecture/ARCHITECTURE.md)
2. Study existing plugins as examples
3. Review the [TDD Protocol](../protocols/tdd-protocol.md)
4. Explore the [Task Documentation](../../tasks/README.md)
5. Consider contributing to active development tasks

## Contributing Guidelines

1. Follow the established architecture patterns
2. Maintain comprehensive test coverage
3. Keep documentation updated
4. Use the safety check system
5. Follow semantic commit messages

Welcome to Physics Simulation Studio development! 🚀
