# AI Learning Postmortem
# Lessons Learned from Common Mistakes

## 🎯 **PURPOSE**
This document captures recurring mistakes and lessons learned to prevent future AI assistants from repeating the same errors. Every mistake is an opportunity to improve our protocols.

---

## 📚 **COMMON MISTAKES & CORRECT SOLUTIONS**

### **1. LINT COMMAND ERRORS**

❌ **WRONG COMMANDS COMMONLY USED:**
```bash
npx gts fix          # This is for formatting, not linting
npm run format       # This is for formatting, not linting
eslint . --fix       # This might not use project config
```

✅ **CORRECT COMMANDS:**
```bash
npm run lint         # For checking lint issues
npm run format       # For fixing formatting issues (gts fix)
npm run style        # For ESLint fixing (npx eslint . --fix)
```

**LESSON LEARNED:** Always check `package.json` scripts before running commands. The project has specific lint and format workflows.

**CURRENT LINT ISSUES FOUND:**
- Promises must be awaited (@typescript-eslint/no-floating-promises)
- "@jest/globals" is extraneous (n/no-extraneous-import)  
- TSConfig doesn't include test files in some directories


❌ **WRONG:** `npx gts fix`
✅ **CORRECT:** `npm run format (for formatting) or npm run lint (for checking)`
**Context:** Always check package.json scripts for the correct lint/format commands


❌ **WRONG:** `undefined`
✅ **CORRECT:** `undefined`
**Context:** Jest CLI parameters are case-sensitive and have specific syntax requirements

---

### **2. TEST FILE LOCATION ERRORS**

❌ **WRONG TEST LOCATION:**
```
src/tests/                    # This causes linting issues!
src/tests/integration/        # NOT included in tsconfig include paths
```

✅ **CORRECT TEST LOCATION:**
```
test/                         # Correct location as per tsconfig.json
test/integration/            # This is properly included in tsconfig
tests/                       # Alternative correct location
```

**LESSON LEARNED:** Always check `tsconfig.json` "include" paths before placing test files. Incorrect test placement causes linting failures and is not recognized by the build system.

**CURRENT CORRECT PATHS FROM tsconfig.json:**
- `"include": ["src/**/*.ts", "test/**/*.ts", "jest.setup.ts", "vite.config.ts"]`
- Tests should be in `test/` directory, NOT `src/tests/`

❌ **WRONG:** `src/tests/integration/my-test.ts`
✅ **CORRECT:** `test/integration/my-test.ts`
**Context:** Test files in wrong locations cause "extraneous import" errors and linting failures

**CRITICAL PROTOCOL REMINDER:** 
- **ALWAYS check tsconfig.json include paths before creating test files**
- **ALWAYS check jest.config.js testMatch patterns before placing test files**
- **ALWAYS verify file locations match project structure conventions**
- **Test files in wrong locations will break linting and CI/CD**
- **Jest testMatch must include all test directories: both src/**/*.test.ts AND test/**/*.test.ts**

---

### **3. TEST COMMAND PATTERNS**

❌ **COMMON MISTAKES:**
```bash
npm test -- --testNamePattern="simulation.*display|render|flag.*render" --verbose
npm test -- --testPathPatterns="FlagParameterSchema.test.ts"
```

✅ **CORRECT PATTERNS:**
```bash
npm test -- --testNamePattern="pattern"     # For test names
npm test -- --testPathPattern="pattern"     # For file paths (no 's')
npm test path/to/specific/test.js           # For specific files
npm test -- --verbose                       # For detailed output
```

**LESSON LEARNED:** Jest CLI options are case-sensitive and some have specific syntax requirements.

---

### **3. PROJECT STRUCTURE AWARENESS**

❌ **COMMON MISTAKE:** Making changes without understanding the project structure

✅ **CORRECT APPROACH:**
1. Always run `npm run pre-change` first
2. Check existing scripts in `package.json`
3. Understand the directory structure before making changes
4. Follow the established patterns in the codebase

**CURRENT PROJECT PATTERNS:**
- Uses `gts` for TypeScript formatting and linting
- Has custom safety scripts (`pre-change`, `safety-check`, `safe-commit`)
- Uses Jest for testing with specific configuration
- Has both TypeScript and CSS linting

---

## 🔧 **SPECIFIC FIXES NEEDED**

### **Current Lint Issues to Address:**

1. **Floating Promise in flag-simulation/index-clean.ts:92**
   ```typescript
   // Fix: Add await or void operator
   await somePromise();
   // OR
   void somePromise();
   ```

2. **Extraneous Jest Imports**
   ```typescript
   // Remove: import { describe, test, expect } from '@jest/globals';
   // Jest globals are configured in jest.setup.ts
   ```

3. **TSConfig Issue with SolarSystemPlugin.test.ts**
   - File is not included in TypeScript configuration
   - Need to update tsconfig.eslint.json or move the file

---

## 📋 **PROTOCOLS TO PREVENT FUTURE MISTAKES**

### **Before Running Any Command:**
1. ✅ Check `package.json` for available scripts
2. ✅ Understand what each script does
3. ✅ Run `npm run pre-change` first
4. ✅ Verify the command syntax in documentation if unsure

### **Before Making Code Changes:**
1. ✅ Run the safety check workflow
2. ✅ Understand the existing code structure
3. ✅ Check for similar patterns in the codebase
4. ✅ Follow established conventions

### **After Making Changes:**
1. ✅ Run `npm run lint` to check for issues
2. ✅ Run `npm test` to verify functionality
3. ✅ Run `npm run safety-check` before committing
4. ✅ Document any new patterns or lessons learned

---

## 🧠 **AI ASSISTANT REMINDERS**

### **Command Reference Card:**
```bash
# SAFETY FIRST
npm run pre-change        # Always run before changes
npm run safety-check      # Complete validation
npm run safe-commit       # Safe commit with checks

# DEVELOPMENT
npm run build            # TypeScript compilation
npm test                 # Run tests
npm run lint            # Check lint issues
npm run format          # Fix formatting (gts fix)
npm run style           # Fix ESLint issues

# DEBUGGING
npm run dev             # Development server
npm run tdd-check       # TDD compliance check
```

### **Decision Tree for Common Tasks:**
- **Need to fix formatting?** → `npm run format`
- **Need to check lint errors?** → `npm run lint`  
- **Need to fix lint errors?** → `npm run style`
- **Need to run tests?** → `npm test`
- **Need to make changes?** → `npm run pre-change` first!
- **Ready to commit?** → `npm run safe-commit`

---

## 📝 **POSTMORTEM LOG**

### **Entry 1 - Date: 2025-08-11**
**Issue:** AI assistant using wrong lint commands
**Root Cause:** Not checking package.json scripts first
**Solution:** Created this postmortem document with correct command reference
**Prevention:** Always check package.json before running commands

### **Entry 2 - Date: 2025-08-11** 
**Issue:** Test command failures due to wrong parameter syntax
**Root Cause:** Using testPathPatterns instead of testPathPattern
**Solution:** Documented correct Jest CLI syntax
**Prevention:** Reference this document for correct test command patterns

---

## 🎯 **ACTION ITEMS FOR IMMEDIATE FIXES**

1. [ ] Fix floating promise in `src/plugins/flag-simulation/index-clean.ts:92`
2. [ ] Remove extraneous Jest imports from test files
3. [ ] Update TSConfig to include `tests/plugins/SolarSystemPlugin.test.ts`
4. [ ] Run `npm run safety-check` after fixes
5. [ ] Update this postmortem with any new learnings


### **Entry 3 - Date: 2025-08-11**
**Issue:** THREE.js BufferGeometry constructor failure in tests
**Root Cause:** THREE.js library not properly mocked or imported in test environment
**Solution:** Need to check THREE.js import/mock setup in test files
**Prevention:** Always run pre-change check to identify failing tests before making changes


### **Entry 4 - Date: 2025-08-11**
**Issue:** Successfully fixed lint errors following postmortem guidance
**Root Cause:** Applied systematic approach: check package.json scripts, run correct commands, fix issues one by one
**Solution:** Fixed extraneous Jest imports and TSConfig include patterns
**Prevention:** Always follow the postmortem command reference and work systematically through lint issues


### **Entry 5 - Date: 2025-08-11**
**Issue:** Successfully fixed all failing tests
**Root Cause:** Fixed THREE.js mocks in jest.setup.ts and corrected test expectations
**Solution:** Enhanced THREE.js mock with BufferGeometry, MeshPhongMaterial, Float32BufferAttribute and getAttribute method. Fixed studio integration test expectations
**Prevention:** Always check test expectations match actual plugin interface and enhance mocks systematically when THREE.js constructor errors occur

---

**Remember:** Every mistake is a learning opportunity. Update this document whenever new patterns or issues are discovered.
