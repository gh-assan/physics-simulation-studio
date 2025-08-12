#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔍 PRE-CHANGE SAFETY CHECK');
console.log('===========================');

// Step 1: Verify all protocol files exist
console.log('\n1. Checking protocol files...');
const requiredFiles = [
    'docs/development/protocols/tdd-protocol.md',
    'docs/development/protocols/change-safety.md',
    'docs/development/protocols/rollback-strategy.md'
];

for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
        console.error(`❌ Missing protocol file: ${file}`);
        process.exit(1);
    }
    console.log(`✅ ${file}`);
}

// Step 2: Check git status
console.log('\n2. Checking git status...');
try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim()) {
        console.warn('⚠️  You have uncommitted changes:');
        console.log(gitStatus);
        console.warn('Consider committing current work before making new changes.');
    } else {
        console.log('✅ Working directory clean');
    }
} catch (error) {
    console.warn('⚠️  Could not check git status');
}

// Step 3: Run tests to establish baseline
console.log('\n3. Establishing test baseline...');
try {
    execSync('npm test', { stdio: 'inherit' });
    console.log('✅ All tests passing - baseline established');
} catch (error) {
    console.error('❌ Tests are currently failing!');
    console.error('Fix failing tests before making changes.');
    process.exit(1);
}

// Step 4: Check build
console.log('\n4. Checking build status...');
try {
    execSync('npm run build', { stdio: 'pipe' });
    console.log('✅ Build successful');
} catch (error) {
    console.error('❌ Build is currently failing!');
    console.error('Fix build errors before making changes.');
    process.exit(1);
}

// Step 5: Display reminder checklist
console.log('\n📋 REMINDER CHECKLIST:');
console.log('Before making changes, ensure you:');
console.log('□ Understand what you\'re changing and why');
console.log('□ Have written a failing test for desired behavior');
console.log('□ Know exactly which files will be modified');
console.log('□ Have a rollback plan if changes fail');
console.log('□ Will make one small change at a time');
console.log('□ Will test after each change');

console.log('\n🛡️  You are ready to make changes safely!');
console.log('Remember: Test First, Change Small, Validate Always');
process.exit(0);
