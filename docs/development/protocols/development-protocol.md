# 🛡️ DEVELOPMENT PROTOCOL ENFORCEMENT

## **MANDATORY WORKFLOW FOR ALL DEVELOPMENT**

### **Before ANY Code Changes:**

#### **1. Run Pre-Change Check**
```bash
npm run pre-change
```
or use VS Code Task: `🛡️ Pre-Change Safety Check`

#### **2. Required TDD Process:**
```bash
# Write failing test first
npm test  # Should fail on new test

# Write minimal code to pass test  
npm test  # Should now pass

# Refactor if needed (tests still passing)
npm test  # Should still pass
```

#### **3. Commit Safely:**
```bash
npm run safe-commit
```
or use VS Code Task: `🔒 Safe Commit`

### **🚨 AUTOMATIC ENFORCEMENT:**

- **Git Pre-Commit Hook**: Prevents commits without tests
- **NPM Scripts**: Enforce safety checks at every step
- **VS Code Tasks**: Easy access to safety workflows
- **Build Integration**: All safety checks run automatically

### **📋 Quick Command Reference:**

| Command | Purpose |
|---------|---------|
| `npm run pre-change` | Safety check before changes |
| `npm run tdd-check` | Verify TDD compliance |
| `npm run safety-check` | Full validation (TDD + Build + Tests) |
| `npm run safe-commit` | Commit with safety validation |

### **🔄 VS Code Task Shortcuts:**

- **Ctrl+Shift+P** → "Tasks: Run Task" → Choose safety task
- Or use Command Palette to run:
  - `🛡️ Pre-Change Safety Check`
  - `🧪 TDD Compliance Check` 
  - `✅ Full Safety Check`
  - `🔒 Safe Commit`

### **💡 Protocol Files Reference:**

- `docs/development/protocols/tdd-protocol.md` - Test-First Development Rules
- `docs/development/protocols/change-safety.md` - Pre-change analysis requirements
- `docs/development/protocols/rollback-strategy.md` - Emergency recovery procedures  
- `docs/reports/postmortems/system-failures.md` - Learning from past failures

## **⚡ This System Prevents:**

- ❌ Code changes without tests
- ❌ Breaking existing functionality
- ❌ Commits with failing builds
- ❌ Destructive changes without rollback plans
- ❌ Multiple simultaneous component changes

## **✅ This System Ensures:**

- ✅ Test-First Development always
- ✅ Build passes before commits
- ✅ All tests pass before commits  
- ✅ Safety checks run automatically
- ✅ Clear recovery procedures available

---

**This enforcement system is mandatory for all development work. It automatically prevents the destructive practices that led to system failures in the past.**
