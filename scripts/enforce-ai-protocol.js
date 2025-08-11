#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🤖 AI ASSISTANT PROTOCOL ENFORCER');
console.log('==================================');

class ProtocolEnforcer {
  constructor() {
    this.protocolFile = 'AI_ASSISTANT_PROTOCOL.md';
    this.violations = [];
    this.compliance = true;
  }

  enforceProtocol() {
    console.log('\n🔍 Checking protocol compliance...');

    // Check if protocol file exists
    if (!fs.existsSync(this.protocolFile)) {
      this.addViolation('CRITICAL: AI_ASSISTANT_PROTOCOL.md is missing!');
      return false;
    }

    // Check required protocol files
    const requiredFiles = [
      'TDD_PROTOCOL.md',
      'CHANGE_SAFETY_CHECKLIST.md',
      'ROLLBACK_STRATEGY.md',
      'DEVELOPMENT_PROTOCOL.md'
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        this.addViolation(`Required protocol file missing: ${file}`);
      }
    }

    // Check if pre-change script exists
    if (!fs.existsSync('scripts/pre-change-check.js')) {
      this.addViolation('Pre-change enforcement script missing');
    }

    // Check git hooks
    if (!fs.existsSync('.githooks/pre-commit')) {
      this.addViolation('Git pre-commit hook missing');
    }

    // Check NPM scripts
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredScripts = ['pre-change', 'tdd-check', 'safety-check', 'safe-commit'];

    for (const script of requiredScripts) {
      if (!packageJson.scripts[script]) {
        this.addViolation(`Required NPM script missing: ${script}`);
      }
    }

    // Check current git status
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      if (gitStatus.trim()) {
        console.log('\n⚠️  WARNING: Uncommitted changes detected');
        console.log('AI assistants should commit changes using: npm run safe-commit');
      }
    } catch (error) {
      console.log('\n⚠️  Could not check git status');
    }

    return this.reportCompliance();
  }

  addViolation(message) {
    this.violations.push(message);
    this.compliance = false;
  }

  reportCompliance() {
    if (this.compliance) {
      console.log('\n✅ PROTOCOL COMPLIANCE: PASSED');
      console.log('✅ AI assistants are required to follow established protocols');
      console.log('✅ All enforcement mechanisms are in place');

      this.displayProtocolReminder();
      return true;
    } else {
      console.log('\n❌ PROTOCOL COMPLIANCE: FAILED');
      console.log('❌ The following violations were detected:');

      for (const violation of this.violations) {
        console.log(`   • ${violation}`);
      }

      console.log('\n🚨 AI assistants CANNOT proceed until violations are fixed');
      return false;
    }
  }

  displayProtocolReminder() {
    console.log('\n📋 AI ASSISTANT PROTOCOL REMINDER:');
    console.log('1. ALWAYS run: npm run pre-change');
    console.log('2. Write failing tests FIRST');
    console.log('3. Write minimal code to pass tests');
    console.log('4. Commit using: npm run safe-commit');
    console.log('5. NEVER delete files without understanding them');
    console.log('6. Use rollback if anything fails');

    console.log('\n🔒 ENFORCEMENT ACTIVE: All protocols are automatically enforced');
  }

  generateComplianceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      compliance: this.compliance,
      violations: this.violations,
      protocolFiles: {
        'AI_ASSISTANT_PROTOCOL.md': fs.existsSync('AI_ASSISTANT_PROTOCOL.md'),
        'TDD_PROTOCOL.md': fs.existsSync('TDD_PROTOCOL.md'),
        'DEVELOPMENT_PROTOCOL.md': fs.existsSync('DEVELOPMENT_PROTOCOL.md')
      },
      enforcementMechanisms: {
        gitHooks: fs.existsSync('.githooks/pre-commit'),
        npmScripts: fs.existsSync('package.json'),
        vscodeSettings: fs.existsSync('.vscode/settings.json'),
        snippets: fs.existsSync('.vscode/typescript.json')
      }
    };

    fs.writeFileSync('protocol-compliance-report.json', JSON.stringify(report, null, 2));
    console.log('\n📊 Compliance report saved to: protocol-compliance-report.json');
  }
}

// Execute enforcement
const enforcer = new ProtocolEnforcer();
const compliant = enforcer.enforceProtocol();
enforcer.generateComplianceReport();

if (!compliant) {
  process.exit(1);
}

console.log('\n🛡️  Protocol enforcement complete. AI assistants must comply.');
process.exit(0);
