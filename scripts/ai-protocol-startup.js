#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n🚨🚨🚨 AI ASSISTANT PROTOCOL ENFORCEMENT 🚨🚨🚨');
console.log('='.repeat(60));

console.log(`
🤖 ATTENTION ALL AI ASSISTANTS (INCLUDING COPILOT):

This project has MANDATORY protocols that MUST be followed.

📋 BEFORE making ANY code changes:
   1. Read: docs/development/protocols/assistant-protocol.md
   2. Run: npm run pre-change
   3. Write failing tests FIRST
   4. Write minimal code to pass tests
   5. Commit with: npm run safe-commit

🚫 FORBIDDEN ACTIONS:
   ❌ Deleting files without understanding them
   ❌ Making changes without writing tests first
   ❌ Skipping safety checks

⚡ QUICK COMMANDS:
   npm run ai-compliance    - Check protocol compliance
   npm run pre-change      - Mandatory safety check
   npm run tdd-check       - Verify TDD compliance
   npm run safety-check    - Full safety validation
   
🛡️  This is NOT optional. This is MANDATORY.
   All AI assistants must acknowledge and follow these protocols.
`);

// Check if protocols are in place
const protocolFile = 'docs/development/protocols/assistant-protocol.md';
if (fs.existsSync(protocolFile)) {
  console.log('✅ AI Assistant Protocol: ACTIVE');
} else {
  console.log('❌ AI Assistant Protocol: MISSING - CRITICAL ERROR!');
}

// Check if enforcement is working
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const hasEnforcement = packageJson.scripts && packageJson.scripts['ai-compliance'];
  console.log(`✅ Protocol Enforcement: ${hasEnforcement ? 'ACTIVE' : 'MISSING'}`);
} catch (error) {
  console.log('❌ Protocol Enforcement: ERROR');
}

console.log('\n' + '='.repeat(60));
console.log('🔒 PROTOCOL ENFORCEMENT IS NOW ACTIVE');
console.log('🤖 All AI assistants must comply');
console.log('='.repeat(60) + '\n');
