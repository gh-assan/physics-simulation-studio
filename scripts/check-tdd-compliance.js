#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🛡️  TDD COMPLIANCE CHECK');
console.log('========================');

// Check if required protocol files exist
const requiredFiles = [
    'TDD_PROTOCOL.md',
    'CHANGE_SAFETY_CHECKLIST.md', 
    'ROLLBACK_STRATEGY.md',
    'SYSTEM_FAILURE_POSTMORTEM.md'
];

let allFilesExist = true;
for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
        console.error(`❌ Missing required file: ${file}`);
        allFilesExist = false;
    } else {
        console.log(`✅ Found: ${file}`);
    }
}

if (!allFilesExist) {
    console.error('\n❌ TDD Protocol files are missing!');
    console.error('Run the setup process to create missing files.');
    process.exit(1);
}

// Check for proper test coverage
const srcDir = 'src';
if (fs.existsSync(srcDir)) {
    const findTsFiles = (dir) => {
        const files = [];
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                files.push(...findTsFiles(fullPath));
            } else if (item.endsWith('.ts') && !item.endsWith('.test.ts') && !item.endsWith('.spec.ts')) {
                files.push(fullPath);
            }
        }
        return files;
    };

    const sourceFiles = findTsFiles(srcDir);
    const testFiles = sourceFiles.map(file => {
        const testFile1 = file.replace('.ts', '.test.ts');
        const testFile2 = file.replace('.ts', '.spec.ts');
        return fs.existsSync(testFile1) ? testFile1 : (fs.existsSync(testFile2) ? testFile2 : null);
    }).filter(Boolean);

    console.log(`\n📊 Test Coverage Analysis:`);
    console.log(`Source files: ${sourceFiles.length}`);
    console.log(`Test files: ${testFiles.length}`);
    
    if (testFiles.length === 0 && sourceFiles.length > 0) {
        console.warn('⚠️  WARNING: No test files found for existing source code');
        console.warn('   Consider adding tests to follow TDD practices');
    }
}

console.log('\n✅ TDD Compliance check passed!');
process.exit(0);
