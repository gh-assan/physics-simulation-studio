# CSS Import Issue - CRITICAL FIX DOCUMENTATION

## ⚠️ IMPORTANT: CSS Import Resolution Issue

### Problem
When using compiled TypeScript with Vite, CSS imports in `main.ts` cause build/runtime errors:
```
Failed to resolve import "./styles/studio.css" from "build/src/studio/main.js"
```

### Root Cause
- TypeScript compilation doesn't copy CSS files to build directory
- Vite can't resolve CSS imports from compiled JavaScript modules
- Only works with direct TypeScript imports in development mode

### ✅ SOLUTION (ALWAYS FOLLOW THIS PATTERN)

#### 1. In `src/studio/main.ts` - COMMENT OUT CSS IMPORTS:
```typescript
// Import styles - Commented out for Vite compatibility when using compiled JS
// import "./styles/studio.css";
// import "./styles/toolbar.css";
```

#### 2. In ALL HTML files - ADD DIRECT CSS LINKS:
```html
<link rel="stylesheet" href="./src/studio/styles/tweakpane-styles.css" />
<link rel="stylesheet" href="./src/studio/styles/studio.css" />
<link rel="stylesheet" href="./src/studio/styles/toolbar.css" />
<link rel="stylesheet" href="./src/studio/styles/canvas.css" />
```

### 📋 Required CSS Files for Camera Bar Styling
**ALL HTML files must include these CSS files in this order:**

1. **tweakpane-styles.css** - UI component styles
2. **studio.css** - Base studio styles  
3. **toolbar.css** - ⚠️ CRITICAL for camera bar (.viewport-toolbar)
4. **canvas.css** - Canvas container styles

### 🚨 Files That Must Be Updated When Adding CSS
- `index.html` (main app)
- `test-simple-physics.html`
- `test-solar-system-enhanced.html`
- Any new test HTML files

### 🔍 How to Verify Fix
1. Open main app: `http://localhost:5173/`
2. Check camera bar appears in top-right with proper styling
3. Verify no console errors about missing CSS imports

### 📝 Prevention Checklist
- [ ] Never uncomment CSS imports in main.ts
- [ ] Always add all 4 CSS files to new HTML files
- [ ] Use relative paths: `./src/studio/styles/` not `/src/studio/styles/`
- [ ] Test main app after any CSS changes

---
**This issue was broken twice - following this doc prevents future breaks!** ⚠️
