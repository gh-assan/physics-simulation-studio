# AI Assistant Development Protocol
# MANDATORY INSTRUCTIONS FOR ALL AI ASSISTANTS

## 🚨 CRITICAL: READ THIS BEFORE ANY CODE CHANGES

### **ABSOLUTE REQUIREMENTS - NO EXCEPTIONS:**

1. **ALWAYS run `npm run pre-change` FIRST**
   - If this fails, STOP immediately
   - Do NOT attempt any code changes
   - Fix failing tests before proceeding

2. **MANDATORY TDD Sequence:**
   ```bash
   # Step 1: ALWAYS run pre-change check
   npm run pre-change
   
   # Step 2: Write failing test FIRST
   # Create test file with failing test case
   
   # Step 3: Verify test fails
   npm test
   
   # Step 4: Write MINIMAL code to pass test
   # Only write code to make the test pass
   
   # Step 5: Verify test passes
   npm test
   
   # Step 6: Commit safely
   npm run safe-commit
   ```

3. **FORBIDDEN Actions:**
   - ❌ Deleting ANY existing files without understanding them
   - ❌ Making changes without writing tests first
   - ❌ Changing multiple components simultaneously
   - ❌ Assuming code is "old" or "legacy" without analysis
   - ❌ Skipping the pre-change safety check

4. **REQUIRED Actions:**
   - ✅ Read and understand existing code before changing it
   - ✅ Write failing tests before writing implementation
   - ✅ Make one small change at a time
   - ✅ Validate each change immediately
   - ✅ Use rollback strategy if anything fails

### **Emergency Protocols:**

If ANY of these occur, IMMEDIATELY execute rollback:
- Tests that were passing now fail
- Build breaks after changes
- Parameter panels stop working
- Simulation display stops rendering
- Any existing functionality breaks

### **Rollback Command:**
```bash
git checkout -- .
git clean -fd
npm test  # Verify system restored
```

## **Protocol Validation:**

Before starting ANY development work, AI assistant MUST:

1. Confirm all protocol files exist:
   - `TDD_PROTOCOL.md`
   - `CHANGE_SAFETY_CHECKLIST.md`
   - `ROLLBACK_STRATEGY.md`
   - `SYSTEM_FAILURE_POSTMORTEM.md`

2. Run safety validation:
   ```bash
   npm run tdd-check
   npm run pre-change
   ```

3. Acknowledge understanding of protocols by stating:
   "I have read and will follow the mandatory TDD protocol. I will run pre-change checks before making any modifications."

## **Consequences of Protocol Violation:**

Any AI assistant that violates these protocols will:
- Have their suggestions rejected
- Be required to execute immediate rollback
- Must re-read this entire protocol
- Cannot proceed until acknowledging compliance

**This is not optional. This is mandatory for ALL development work.**
