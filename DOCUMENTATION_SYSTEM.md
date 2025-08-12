# Documentation System Structure

This document defines the organizational structure for all documentation in the Physics Simulation Studio project.

## Directory Structure

```
docs/
├── README.md                    # Main documentation index
├── architecture/                # System design and technical architecture
│   ├── overview.md             # High-level architecture overview
│   ├── ecs-framework.md        # Entity-Component-System documentation
│   ├── plugin-system.md        # Plugin architecture documentation
│   ├── rendering-system.md     # Rendering architecture
│   ├── state-management.md     # State management patterns
│   └── interfaces.md           # Core interfaces and contracts
├── development/                 # Development processes and protocols
│   ├── protocols/              # Development protocols
│   │   ├── tdd-protocol.md     # Test-Driven Development protocol
│   │   ├── assistant-protocol.md # AI Assistant usage protocol
│   │   └── change-safety.md    # Change safety checklist
│   ├── guides/                 # Development guides
│   │   ├── getting-started.md  # Project setup and first steps
│   │   ├── create-simulation.md # How to create new simulations
│   │   ├── debugging.md        # Debugging techniques and tools
│   │   └── testing.md          # Testing guidelines
│   └── tools/                  # Tool-specific documentation
│       ├── build-system.md     # Build configuration
│       └── linting.md          # Code quality tools
├── reports/                    # Project reports and analysis
│   ├── phase-completions/      # Phase completion summaries
│   │   ├── phase-2.md
│   │   ├── phase-3.md
│   │   └── ...
│   ├── migrations/             # Migration reports
│   │   ├── rendering-migration.md
│   │   └── parameter-system.md
│   ├── postmortems/            # Post-mortem analysis
│   │   ├── system-failures.md
│   │   └── learning-notes.md
│   └── optimizations/          # Performance and optimization reports
│       ├── flag-rendering.md
│       └── rendering-optimization.md
├── tasks/                      # Task documentation
│   ├── README.md               # Task system overview
│   ├── template.md             # Task template
│   ├── active/                 # Currently active tasks
│   ├── completed/              # Completed tasks archive
│   └── planning/               # Future task planning
├── findings/                   # Research and investigation results
│   ├── README.md               # Findings index
│   ├── debugging/              # Debugging session findings
│   ├── analysis/               # Code analysis results
│   └── research/               # Technical research findings
└── api/                        # API and usage documentation
    ├── simulations/            # Simulation-specific docs
    ├── plugins/                # Plugin development docs
    └── components/             # Component documentation
```

## File Naming Conventions

### General Rules
- Use kebab-case for all file names: `my-document.md`
- Use descriptive names that clearly indicate content
- Include version numbers for major revisions: `architecture-v2.md`
- Use consistent prefixes for similar document types

### Document Types
- **Protocols**: `*-protocol.md` (e.g., `tdd-protocol.md`)
- **Guides**: `*-guide.md` or descriptive names (e.g., `getting-started.md`)
- **Reports**: `*-report.md` or `*-summary.md` 
- **Analysis**: `*-analysis.md` or `*-findings.md`
- **Templates**: `*-template.md`
- **Specifications**: `*-spec.md` or `*-specification.md`

## Document Headers

All documents should include a consistent header:

```markdown
# Document Title

**Status**: [Draft/Review/Active/Deprecated]  
**Created**: YYYY-MM-DD  
**Last Updated**: YYYY-MM-DD  
**Author(s)**: [Author names or AI Assistant]  
**Related**: [Links to related documents]

## Overview
[Brief description of the document's purpose and scope]
```

## Cross-Reference System

- Use relative links between documents: `[Architecture Overview](../architecture/overview.md)`
- Maintain a centralized index in `docs/README.md`
- Include "Related Documents" sections in each file
- Use consistent anchor linking for sections: `#section-name`

## Maintenance Guidelines

1. **Regular Reviews**: Quarterly review of all documentation for accuracy
2. **Deprecation Process**: Mark outdated docs as deprecated, don't delete
3. **Version Control**: Use git to track documentation changes
4. **Update Triggers**: Update docs when code changes affect documented processes
5. **Template Updates**: Keep templates current with project evolution

## Migration Rules

When moving existing documents:
1. Preserve git history when possible (`git mv`)
2. Update all internal links
3. Add redirect notes in old locations if necessary
4. Update any build scripts or tools that reference old paths
5. Announce changes to team members

## Future Document Guidelines

All new documentation must:
- Follow this structure and naming conventions
- Include proper headers with metadata
- Be placed in the appropriate directory
- Include relevant cross-references
- Be reviewed for clarity and completeness before merging

## Automation

Consider implementing:
- Automated link checking
- Template enforcement
- Documentation coverage metrics
- Automated generation of indexes and cross-references
