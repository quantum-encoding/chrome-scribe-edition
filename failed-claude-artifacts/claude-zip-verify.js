// Claude ZIP Verification Script
// Run this after downloading a ZIP to check its contents

(function() {
    'use strict';
    
    console.log('🔍 Claude ZIP Verification Tool\n');
    
    // This script helps you verify the ZIP contents
    console.log('To verify your ZIP file:');
    console.log('1. In your file browser, extract the ZIP file');
    console.log('2. Check the following structure:\n');
    
    console.log('Expected structure:');
    console.log('├── [ConversationName]_conversation.md  (main conversation)');
    console.log('├── metadata.json                       (export metadata)');
    console.log('└── artifacts/                          (folder)');
    console.log('    ├── _index.md                       (list of artifacts)');
    console.log('    ├── 1_artifact_1.json               (first artifact)');
    console.log('    ├── 2_artifact_2.json               (second artifact)');
    console.log('    └── ...');
    
    console.log('\n📋 Quick checks:');
    console.log('- Are the artifact files empty (0 bytes)?');
    console.log('- Do they contain the expected content?');
    console.log('- Is the conversation markdown showing correct Human/Claude labels?');
    
    // If you want to test the scraper again with more logging
    console.log('\n🧪 To run a test with detailed logging:');
    console.log('1. Copy and run this in console:');
    console.log(`
// Test artifact content before ZIP
(function() {
    const codeBlocks = document.querySelectorAll('pre code');
    console.log('Found ' + codeBlocks.length + ' code blocks');
    
    codeBlocks.forEach((code, i) => {
        const content = code.textContent;
        if (content.length > 100) {
            console.log(\`\\nCode block \${i + 1}:\`);
            console.log('Length:', content.length);
            console.log('Type:', typeof content);
            console.log('First 50 chars:', JSON.stringify(content.substring(0, 50)));
            console.log('Last 50 chars:', JSON.stringify(content.substring(content.length - 50)));
        }
    });
})();
    `);
    
})();