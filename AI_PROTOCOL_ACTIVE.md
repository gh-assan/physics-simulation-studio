# 🚨 AI ASSISTANT PROTOCOL ACTIVE 🚨

**MANDATORY FOR ALL AI ASSISTANTS INCLUDING COPILOT**

Before making ANY code changes, AI assistants MUST:

## 📋 PROTOCOL REQUIREMENTS

1. **Read the full protocol:** [docs/development/protocols/assistant-protocol.md](./docs/development/protocols/assistant-protocol.md)

2. **Run safety check FIRST:**
   ```bash
   npm run pre-change
   ```

3. **Follow TDD Protocol:**
   - Write failing tests FIRST
   - Write minimal code to pass tests
   - Run `npm test` to verify
   - Use `npm run safe-commit` to commit

## 🚫 ABSOLUTELY FORBIDDEN

- ❌ Deleting ANY files without understanding them
- ❌ Making changes without writing tests first  
- ❌ Skipping the pre-change safety check
- ❌ Assuming code is "old" or "legacy" without analysis

## ⚡ QUICK REFERENCE

| Command | Purpose |
|---------|---------|
| `npm run ai-compliance` | Check protocol compliance |
| `npm run pre-change` | **MANDATORY** safety check |
| `npm run tdd-check` | Verify TDD compliance |
| `npm run safety-check` | Full safety validation |
| `npm run safe-commit` | Commit with safety checks |

## 🛡️ ENFORCEMENT

This protocol is **AUTOMATICALLY ENFORCED** through:
- Git hooks that reject non-compliant commits
- VS Code tasks that remind about requirements  
- NPM scripts that validate compliance
- Automated protocol checks

## 🚨 VIOLATION CONSEQUENCES

Any AI assistant that violates this protocol will:
- Have suggestions rejected immediately
- Be required to execute rollback procedures
- Must re-acknowledge protocol compliance

**This is not optional. This is mandatory for ALL development work.**

---

*Protocol Version: 2.0*  
*Last Updated: December 2024*  
*Enforcement: Active*
