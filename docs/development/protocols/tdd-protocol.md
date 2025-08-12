# TDD-First Development Protocol

## 🔬 **MANDATORY TDD Process for All Changes**

### **Phase 1: Test-First Analysis (ALWAYS START HERE)**
```bash
# 1. Run existing tests BEFORE any changes
npm test -- --testPathPatterns="[ComponentName]"

# 2. Document current test state
echo "Current test status: X passing, Y failing, Z skipped" > change-log.md

# 3. Write failing test for desired behavior
# 4. Confirm test fails (RED)
# 5. Make minimal change to pass test (GREEN) 
# 6. Refactor while keeping tests green (REFACTOR)
```

### **Phase 2: Change Validation (NEVER SKIP)**
```bash
# Before committing ANY change:
npm run build        # Must pass
npm test            # All existing tests must still pass
npm run lint        # Code quality must be maintained
```

### **Phase 3: Rollback Strategy (REQUIRED)**
- Every change must have a clear rollback plan
- Keep working version in backup files during development
- Test rollback plan before making changes

## 🚫 **FORBIDDEN ACTIONS**
- ❌ Deleting files without understanding their purpose
- ❌ Making changes without tests
- ❌ Removing working code before replacement is tested
- ❌ Changing multiple systems simultaneously

## ✅ **REQUIRED ACTIONS** 
- ✅ Write test first, see it fail, make it pass
- ✅ One small change at a time
- ✅ Validate each change before proceeding
- ✅ Document what you're changing and why
