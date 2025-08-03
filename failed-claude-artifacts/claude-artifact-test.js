// Claude Artifact Test Script
// Tests artifact extraction without the full ZIP process

(function() {
    'use strict';
    
    console.log('🧪 Claude Artifact Test Starting...');
    
    // Find and analyze all code blocks
    const codeBlocks = document.querySelectorAll('pre');
    console.log(`\nFound ${codeBlocks.length} <pre> elements total`);
    
    const artifacts = [];
    
    codeBlocks.forEach((pre, index) => {
        console.log(`\n--- Analyzing code block ${index + 1} ---`);
        
        const codeElement = pre.querySelector('code');
        if (!codeElement) {
            console.log('  No <code> element found');
            return;
        }
        
        const content = codeElement.textContent || '';
        const lines = content.split('\n').length;
        console.log(`  Content length: ${content.length} chars, ${lines} lines`);
        console.log(`  First 100 chars: ${content.substring(0, 100).replace(/\n/g, '\\n')}...`);
        
        // Check code element classes
        console.log(`  Code classes: ${codeElement.className}`);
        
        // Language detection
        const langMatch = codeElement.className.match(/language-(\w+)/);
        if (langMatch) {
            console.log(`  Detected language from class: ${langMatch[1]}`);
        }
        
        // Check parent structure
        let parent = pre.parentElement;
        console.log(`  Parent tag: ${parent?.tagName}, classes: ${parent?.className}`);
        
        // Look for any nearby text that might be a filename
        let possibleFilename = null;
        let current = pre;
        for (let i = 0; i < 5; i++) {
            current = current.parentElement;
            if (!current) break;
            
            // Check all text nodes and spans
            const walker = document.createTreeWalker(
                current,
                NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
                {
                    acceptNode: function(node) {
                        if (node.nodeType === Node.TEXT_NODE) {
                            const text = node.textContent.trim();
                            if (text && text.match(/\.(js|jsx|ts|tsx|py|html|css|json|md|txt|sh|yaml|yml|xml|sql|go|rs|cpp|c|h|java)$/i)) {
                                return NodeFilter.FILTER_ACCEPT;
                            }
                        } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SPAN') {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        return NodeFilter.FILTER_SKIP;
                    }
                }
            );
            
            let node;
            while (node = walker.nextNode()) {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent.trim();
                    if (text.match(/\.(js|jsx|ts|tsx|py|html|css|json|md|txt|sh|yaml|yml|xml|sql|go|rs|cpp|c|h|java)$/i)) {
                        possibleFilename = text;
                        console.log(`  Found possible filename: ${text}`);
                        break;
                    }
                } else if (node.tagName === 'SPAN') {
                    const text = node.textContent.trim();
                    if (text && text.length < 100) {
                        console.log(`  Span text: ${text}`);
                    }
                }
            }
            if (possibleFilename) break;
        }
        
        // Determine if this should be an artifact
        const shouldBeArtifact = content.length >= 100 || lines >= 5;
        console.log(`  Should be artifact: ${shouldBeArtifact}`);
        
        if (shouldBeArtifact) {
            // Try to determine file type
            let fileType = 'txt';
            
            // First check class
            if (langMatch) {
                fileType = langMatch[1];
            } else {
                // Then check content
                if (content.includes('<!DOCTYPE html') || content.includes('<html')) {
                    fileType = 'html';
                } else if (content.includes('use std::') || content.includes('fn main()')) {
                    fileType = 'rs';
                } else if (content.includes('#[') && content.includes('pub ')) {
                    fileType = 'rs';
                } else if (content.includes('def ') || content.includes('import ')) {
                    fileType = 'py';
                } else if (content.includes('function') || content.includes('const ')) {
                    fileType = 'js';
                }
            }
            
            const artifactName = possibleFilename || `artifact_${index + 1}.${fileType}`;
            
            artifacts.push({
                name: artifactName,
                type: fileType,
                content: content,
                lines: lines,
                size: content.length
            });
            
            console.log(`  ✅ Added as artifact: ${artifactName}`);
        }
    });
    
    console.log(`\n\n=== ARTIFACT SUMMARY ===`);
    console.log(`Total artifacts: ${artifacts.length}`);
    
    artifacts.forEach((artifact, i) => {
        console.log(`\n${i + 1}. ${artifact.name}`);
        console.log(`   Type: ${artifact.type}`);
        console.log(`   Size: ${artifact.size} chars, ${artifact.lines} lines`);
        console.log(`   Preview: ${artifact.content.substring(0, 60).replace(/\n/g, '\\n')}...`);
    });
    
    // Test creating files
    console.log('\n\n=== TESTING FILE CREATION ===');
    
    if (artifacts.length > 0) {
        const testArtifact = artifacts[0];
        console.log(`Testing with: ${testArtifact.name}`);
        console.log(`Content length: ${testArtifact.content.length}`);
        console.log(`Content type check: ${typeof testArtifact.content}`);
        console.log(`Content sample: "${testArtifact.content.substring(0, 50)}"`);
        
        // Try creating a blob
        try {
            const blob = new Blob([testArtifact.content], { type: 'text/plain' });
            console.log(`Blob created successfully, size: ${blob.size}`);
            
            // Test if we can create URL
            const url = URL.createObjectURL(blob);
            console.log(`URL created: ${url}`);
            URL.revokeObjectURL(url);
            
            console.log('✅ File creation test passed');
        } catch (error) {
            console.error('❌ File creation test failed:', error);
        }
    }
    
    // Save for manual inspection
    window.claudeTestArtifacts = artifacts;
    console.log('\n💾 Artifacts saved to window.claudeTestArtifacts');
    
})();