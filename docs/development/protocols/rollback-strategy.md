# Emergency Rollback Strategy

## 🔄 **Immediate Rollback Protocol**

### **When to Trigger Rollback:**
- ANY test fails that was previously passing
- Build breaks after changes
- Parameter panels stop working
- Simulation display stops rendering  
- Any core functionality becomes non-responsive
- User reports functionality regression

### **Rollback Steps:**

#### **Phase 1: Immediate Stop (< 30 seconds)**
1. STOP all current changes immediately
2. Do not attempt to "fix" the issue
3. Do not make additional changes
4. Document current error state
5. Save any work in progress to separate branch

#### **Phase 2: Assessment (< 2 minutes)**
1. Run `npm test` to see all failing tests
2. Run `npm run build` to check build status
3. Check if simulation loads in browser
4. Document what specifically is broken
5. Estimate complexity of forward fix

#### **Phase 3: Rollback Decision (< 1 minute)**
- If forward fix is simple (< 10 minutes) → attempt fix
- If forward fix is complex (> 10 minutes) → rollback
- If uncertain → rollback (safety first)

#### **Phase 4: Execute Rollback (< 5 minutes)**

**Option A: Git Rollback (preferred)**
```bash
# If changes are uncommitted
git checkout -- .
git clean -fd

# If changes are committed  
git reset --hard HEAD~1  # or specific commit hash
git clean -fd
```

**Option B: File Restore (if git unavailable)**
```bash
# Restore backed up files
cp backup/[original-file] src/[file-location]
# Restore package.json dependencies if changed
npm install
```

**Option C: Known Working State**
```bash
# Jump to last known good commit
git checkout [last-working-commit-hash]
git checkout -b rollback-recovery
```

#### **Phase 5: Validation (< 3 minutes)**
1. `npm test` - all tests pass
2. `npm run build` - build succeeds  
3. Open browser - simulation loads
4. Test parameter panels work
5. Test simulation switching works
6. Confirm system is back to working state

#### **Phase 6: Analysis (< 10 minutes)**
1. Document what went wrong
2. Document what was attempted
3. Update prevention checklist with new insights
4. Plan different approach if feature still needed

### **Recovery Files Backup Location:**
- `/backup/working-state/` - last known good files
- Git tag: `last-working-[YYYYMMDD]`
- Branch: `backup-working-state`

### **Critical System Files to Always Backup:**
- `src/plugins/*/index.ts` 
- `src/plugins/*/renderers/*`
- `package.json`
- Test files that currently pass
- Working HTML demo files

### **Emergency Contact Info:**
- If rollback fails: immediately commit current state and seek help
- Never attempt complex recovery without assistance
- Better to have broken state in version control than lose it completely
