#!/usr/bin/env node

/**
 * AI Learning Postmortem Updater
 * Automatically logs new mistakes and lessons learned
 */

const fs = require('fs');
const path = require('path');

const POSTMORTEM_FILE = path.join(__dirname, '../AI_LEARNING_POSTMORTEM.md');

class PostmortemLogger {
    constructor() {
        this.currentDate = new Date().toISOString().split('T')[0];
    }

    /**
     * Add a new learning entry to the postmortem
     */
    addLearning(issue, rootCause, solution, prevention) {
        const entry = `
### **Entry ${this.getNextEntryNumber()} - Date: ${this.currentDate}**
**Issue:** ${issue}
**Root Cause:** ${rootCause}
**Solution:** ${solution}
**Prevention:** ${prevention}
`;

        this.appendToPostmortem(entry);
        console.log('✅ New learning added to AI_LEARNING_POSTMORTEM.md');
    }

    /**
     * Add a new command pattern mistake
     */
    addCommandMistake(wrongCommand, correctCommand, context) {
        const mistake = `
❌ **WRONG:** \`${wrongCommand}\`
✅ **CORRECT:** \`${correctCommand}\`
**Context:** ${context}
`;

        this.addToCommandSection(mistake);
        console.log('✅ New command pattern added to postmortem');
    }

    /**
     * Get the next entry number
     */
    getNextEntryNumber() {
        const content = fs.readFileSync(POSTMORTEM_FILE, 'utf8');
        const entries = content.match(/### \*\*Entry (\d+)/g);
        return entries ? entries.length + 1 : 1;
    }

    /**
     * Append content to the postmortem
     */
    appendToPostmortem(entry) {
        const content = fs.readFileSync(POSTMORTEM_FILE, 'utf8');
        const insertPosition = content.lastIndexOf('---\n\n**Remember:**');

        const newContent = content.slice(0, insertPosition) + entry + '\n' + content.slice(insertPosition);
        fs.writeFileSync(POSTMORTEM_FILE, newContent);
    }

    /**
     * Add to command section
     */
    addToCommandSection(mistake) {
        const content = fs.readFileSync(POSTMORTEM_FILE, 'utf8');
        const commandSectionStart = content.indexOf('## 📚 **COMMON MISTAKES & CORRECT SOLUTIONS**');
        const nextSectionStart = content.indexOf('---', commandSectionStart + 1);

        const beforeSection = content.slice(0, nextSectionStart);
        const afterSection = content.slice(nextSectionStart);

        const newContent = beforeSection + mistake + '\n' + afterSection;
        fs.writeFileSync(POSTMORTEM_FILE, newContent);
    }

    /**
     * Quick methods for common scenarios
     */
    static logLintCommandError(wrongCmd, correctCmd) {
        const logger = new PostmortemLogger();
        logger.addCommandMistake(
            wrongCmd,
            correctCmd,
            "Always check package.json scripts for the correct lint/format commands"
        );
    }

    static logTestCommandError(wrongCmd, correctCmd) {
        const logger = new PostmortemLogger();
        logger.addCommandMistake(
            wrongCmd,
            correctCmd,
            "Jest CLI parameters are case-sensitive and have specific syntax requirements"
        );
    }

    static logGeneralMistake(issue, rootCause, solution, prevention) {
        const logger = new PostmortemLogger();
        logger.addLearning(issue, rootCause, solution, prevention);
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'lint-error':
            PostmortemLogger.logLintCommandError(args[1], args[2]);
            break;
        case 'test-error':
            PostmortemLogger.logTestCommandError(args[1], args[2]);
            break;
        case 'general':
            PostmortemLogger.logGeneralMistake(args[1], args[2], args[3], args[4]);
            break;
        default:
            console.log(`
Usage:
  node log-learning.js lint-error "wrong-command" "correct-command"
  node log-learning.js test-error "wrong-command" "correct-command"  
  node log-learning.js general "issue" "root-cause" "solution" "prevention"

Examples:
  node log-learning.js lint-error "npx gts fix" "npm run format"
  node log-learning.js test-error "--testPathPatterns" "--testPathPattern"
            `);
    }
}

module.exports = PostmortemLogger;
