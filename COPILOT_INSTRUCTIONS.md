# COPILOT INSTRUCTIONS

## 🚨 MANDATORY PROTOCOL FOR ALL AI ASSISTANTS

**GitHub Copilot and all AI assistants working on this codebase MUST follow these instructions:**

### BEFORE ANY CODE CHANGES

1. **Read the AI Assistant Protocol:**
   - File: `docs/development/protocols/assistant-protocol.md`
   - This document contains MANDATORY requirements

2. **Run Pre-Change Safety Check:**
   ```bash
   npm run pre-change
   ```
   - This MUST pass before making any changes
   - If it fails, STOP immediately and fix issues

3. **Follow TDD Protocol:**
   - Write failing tests FIRST
   - Write minimal code to pass tests
   - Never implement without tests

### ABSOLUTE REQUIREMENTS

✅ **MUST DO:**
- Always run `npm run pre-change` first
- Write failing tests before implementation
- Follow good system design principles
- Keep code simple and clean
- Use `npm run safe-commit` to commit changes
- Read existing code before modifying it

❌ **FORBIDDEN:**
- Deleting files without understanding them
- Making changes without writing tests first
- Skipping safety checks
- Assuming code is "legacy" without analysis
- Making multiple simultaneous changes

### EMERGENCY ROLLBACK

If anything breaks after changes:
```bash
git checkout -- .
git clean -fd  
npm test
```

### PROTOCOL VALIDATION

Before starting work, acknowledge by stating:
> "I have read and will follow the mandatory TDD protocol. I will run pre-change checks before making any modifications. I will prioritize good system design, simplicity, and clean code in all implementations."

### ENFORCEMENT

This protocol is automatically enforced through:
- Git hooks that reject non-compliant commits
- NPM scripts that validate compliance
- VS Code tasks and settings
- Automated safety checks

**This is MANDATORY. No exceptions.**

### QUICK REFERENCE

| Command | Purpose |
|---------|---------|
| `npm run ai-compliance` | Check protocol compliance |
| `npm run pre-change` | **MANDATORY** safety check |
| `npm run tdd-check` | Verify TDD compliance |  
| `npm run safety-check` | Full validation |
| `npm run safe-commit` | Safe commit with checks |

---
**Protocol Enforcement: ACTIVE**  
**Compliance: MANDATORY**  
**Violations: Will be rejected**
