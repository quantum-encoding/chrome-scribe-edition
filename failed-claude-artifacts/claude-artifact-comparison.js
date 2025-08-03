// Claude Artifact Comparison Script
// Compares what's being extracted vs what's actually in the code blocks

(function() {
    'use strict';
    
    console.log('🔍 Claude Artifact Content Comparison\n');
    
    // Find all code blocks
    const codeBlocks = document.querySelectorAll('pre code');
    console.log(`Found ${codeBlocks.length} code blocks\n`);
    
    // Analyze each code block
    codeBlocks.forEach((code, index) => {
        const content = code.textContent || '';
        const lines = content.split('\n');
        
        // Only process substantial blocks
        if (content.length < 100 && lines.length < 5) return;
        
        console.log(`\n========== CODE BLOCK ${index + 1} ==========`);
        console.log(`Total length: ${content.length} characters`);
        console.log(`Total lines: ${lines.length}`);
        
        // Show first few lines
        console.log('\nFIRST 5 LINES:');
        lines.slice(0, 5).forEach((line, i) => {
            console.log(`${i + 1}: ${line}`);
        });
        
        // Show last few lines
        console.log('\nLAST 5 LINES:');
        lines.slice(-5).forEach((line, i) => {
            console.log(`${lines.length - 4 + i}: ${line}`);
        });
        
        // Check if it's JSON
        let isJSON = false;
        try {
            JSON.parse(content);
            isJSON = true;
            console.log('\n✅ Valid JSON detected');
        } catch (e) {
            // Check if it looks like JSON but might have issues
            if (content.includes('{') && content.includes('}') && content.includes(':')) {
                console.log('\n⚠️ Looks like JSON but failed to parse');
                console.log('Parse error:', e.message);
            }
        }
        
        // Check for truncation signs
        if (content.includes('...') && index < 5) {
            console.log('\n⚠️ WARNING: Content might be truncated (contains "...")');
        }
        
        // Language class
        console.log(`\nLanguage class: ${code.className}`);
        
        // Parent structure
        let parent = code.parentElement;
        if (parent && parent.tagName === 'PRE') {
            console.log('Parent <pre> classes:', parent.className);
        }
    });
    
    // Now let's check what the scraper would extract
    console.log('\n\n========== SCRAPER EXTRACTION TEST ==========');
    
    const artifacts = [];
    codeBlocks.forEach((codeElement, index) => {
        const content = codeElement.textContent || '';
        if (content.length < 100) return;
        
        const pre = codeElement.parentElement;
        let fileType = 'txt';
        
        // Language detection
        const langMatch = codeElement.className.match(/language-(\w+)/);
        if (langMatch) {
            fileType = langMatch[1];
        } else if (content.includes('{') && content.includes('}') && content.includes(':')) {
            try {
                JSON.parse(content);
                fileType = 'json';
            } catch (e) {
                // Not valid JSON
            }
        }
        
        artifacts.push({
            index: index + 1,
            fileType: fileType,
            contentLength: content.length,
            contentPreview: content.substring(0, 100) + '...'
        });
    });
    
    console.log(`\nWould extract ${artifacts.length} artifacts:`);
    artifacts.forEach(a => {
        console.log(`\nArtifact ${a.index}:`);
        console.log(`  Type: ${a.fileType}`);
        console.log(`  Length: ${a.contentLength}`);
        console.log(`  Preview: ${a.contentPreview}`);
    });
    
    // Save for inspection
    window.claudeArtifactDebug = {
        codeBlocks: Array.from(codeBlocks).map(cb => ({
            content: cb.textContent,
            className: cb.className,
            length: cb.textContent.length
        })),
        extractedArtifacts: artifacts
    };
    
    console.log('\n💾 Full data saved to window.claudeArtifactDebug');
    
})();