# AI Assistant Development Protocol
# MANDATORY INSTRUCTIONS FOR ALL AI ASSISTANTS

## 🚨 CRITICAL: READ THIS BEFO4. Acknowledge understanding of protocols by stating:
   "I have read and will follow the mandatory TDD protocol. I will run pre-change checks before making any modifications. I will prioritize good system design, simplicity, and clean code in all implementations. I have reviewed the AI Learning Postmortem to avoid common mistakes." ANY CODE CHANGES

### **CORE DEVELOPMENT PRINCIPLES:**

**🎯 PRIMARY FOCUS AREAS:**

1. **Good System Design**
   - Follow SOLID principles and clean architecture
   - Ensure proper separation of concerns
   - Design for extensibility and maintainability
   - Use dependency injection where appropriate
   - Keep interfaces simple and focused

2. **Simplicity First**
   - Choose the simplest solution that works
   - Avoid over-engineering and premature optimization
   - Prefer composition over inheritance
   - Keep functions small and focused on single responsibility
   - Eliminate unnecessary complexity

3. **Clean Code Standards**
   - Write self-documenting code with clear naming
   - Follow consistent formatting and style guidelines
   - Remove dead code and unused imports
   - Keep functions pure when possible
   - Use meaningful variable and function names

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
   - ✅ **Design Review**: Ensure changes follow good system design principles
   - ✅ **Simplicity Check**: Verify solution is the simplest that meets requirements
   - ✅ **Clean Code Review**: Confirm code meets clean code standards
   - ✅ **Architecture Alignment**: Ensure changes align with existing architecture patterns

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
   - `docs/development/protocols/tdd-protocol.md`
   - `docs/development/protocols/change-safety.md`
   - `docs/development/protocols/rollback-strategy.md`
   - `docs/reports/postmortems/system-failures.md`

2. **Read the Learning Postmortem** to avoid repeating common mistakes:
   - Review command reference card
   - Check correct lint/test/build commands
   - Understand established project patterns

3. Run safety validation:
   ```bash
   npm run tdd-check
   npm run pre-change
   ```

3. Acknowledge understanding of protocols by stating:
   "I have read and will follow the mandatory TDD protocol. I will run pre-change checks before making any modifications. I will prioritize good system design, simplicity, and clean code in all implementations."

## **Consequences of Protocol Violation:**

Any AI assistant that violates these protocols will:
- Have their suggestions rejected
- Be required to execute immediate rollback
- Must re-read this entire protocol
- Cannot proceed until acknowledging compliance

**This is not optional. This is mandatory for ALL development work.**

## **Implementation Quality Guidelines:**

### **System Design Checklist:**
- [ ] Does the solution follow single responsibility principle?
- [ ] Are dependencies properly abstracted and injected?
- [ ] Is the code modular and loosely coupled?
- [ ] Does it follow existing architectural patterns?
- [ ] Are interfaces clearly defined and minimal?

### **Simplicity Checklist:**
- [ ] Is this the simplest solution that solves the problem?
- [ ] Can any complexity be removed without losing functionality?
- [ ] Are there fewer than 3 levels of nesting in functions?
- [ ] Is each function doing only one thing?
- [ ] Can the solution be easily understood by other developers?

### **Clean Code Checklist:**
- [ ] Are variable and function names descriptive and clear?
- [ ] Are functions kept small (< 20 lines preferred)?
- [ ] Is there any commented-out or dead code to remove?
- [ ] Are all imports used and properly organized?
- [ ] Does the code follow consistent formatting?
- [ ] Are magic numbers replaced with named constants?

### **Quality Gates:**
Before any code submission, verify:
1. **Design Quality**: Architecture is sound and extensible
2. **Simplicity**: No unnecessary complexity introduced  
3. **Cleanliness**: Code is readable and maintainable
4. **Test Coverage**: All new code has comprehensive tests
5. **Integration**: Changes integrate smoothly with existing system
