# Pre-Change Safety Checklist

## 🛡️ **MANDATORY Pre-Change Analysis**

### **Before Making ANY Code Changes:**

#### 1. **Understanding Phase** (30 minutes minimum)
- [ ] Read existing documentation about the component
- [ ] Run current tests and document results  
- [ ] Understand current architecture and why it exists
- [ ] Identify all files that will be affected
- [ ] List all systems that depend on what you're changing

#### 2. **Impact Assessment** (15 minutes minimum)
- [ ] What other plugins/systems use this code?
- [ ] What tests cover this functionality?
- [ ] What would break if this component fails?
- [ ] How will users be affected?
- [ ] Is this a breaking change or enhancement?

#### 3. **Change Plan** (15 minutes minimum)  
- [ ] Write specific failing test for desired behavior
- [ ] Define minimal change needed to pass test
- [ ] Identify validation steps for each change
- [ ] Plan rollback strategy if changes fail
- [ ] Set maximum time limit for change attempt

#### 4. **Backup Strategy** (5 minutes)
- [ ] Backup current working files
- [ ] Tag current git state
- [ ] Document current working behavior
- [ ] Test backup/restore process

### **During Changes:**
- [ ] Make one small change at a time
- [ ] Run tests after each change  
- [ ] Document what each change does
- [ ] Stop if tests start failing
- [ ] Never change multiple components simultaneously

### **After Changes:**
- [ ] All original tests still pass
- [ ] New test passes
- [ ] Build succeeds
- [ ] Manual testing confirms expected behavior
- [ ] Documentation updated
- [ ] Rollback tested and confirmed working

## 🚨 **STOP Conditions**
If ANY of these occur, STOP and rollback:
- Tests that were passing now fail
- Build breaks  
- More than 3 components need changes
- Change takes longer than planned time limit
- Uncertainty about what change is supposed to do
