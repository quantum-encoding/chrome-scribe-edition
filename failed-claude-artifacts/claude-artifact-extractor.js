// Claude Artifact Extractor
// Advanced script to find and extract artifacts from Claude conversations

(function() {
    'use strict';
    
    console.log('🎨 Claude Artifact Extractor Starting...');
    
    // Find artifacts by looking for specific patterns
    function findArtifacts() {
        const artifacts = [];
        
        // Method 1: Look for code blocks that might be artifacts
        console.log('\n📦 Method 1: Checking code blocks...');
        const codeBlocks = document.querySelectorAll('pre');
        
        codeBlocks.forEach((pre, index) => {
            const codeElement = pre.querySelector('code');
            if (!codeElement) return;
            
            const content = codeElement.textContent || '';
            if (content.length < 100) return; // Skip small snippets
            
            // Check parent structure for artifact indicators
            let currentElement = pre;
            let isArtifact = false;
            let artifactName = '';
            
            // Walk up the DOM tree
            for (let i = 0; i < 5; i++) {
                currentElement = currentElement.parentElement;
                if (!currentElement) break;
                
                // Look for file indicators
                const buttons = currentElement.querySelectorAll('button');
                buttons.forEach(btn => {
                    const btnText = btn.textContent || '';
                    if (btnText.includes('Copy') || btnText.includes('Download')) {
                        isArtifact = true;
                    }
                });
                
                // Look for filename
                const spans = currentElement.querySelectorAll('span');
                spans.forEach(span => {
                    const text = span.textContent || '';
                    // Check for file extensions
                    if (text.match(/\.(js|jsx|ts|tsx|py|html|css|json|md|txt|sh|yaml|yml|xml|sql|go|rs|cpp|c|h|java)$/i)) {
                        artifactName = text.trim();
                    }
                });
            }
            
            // Detect file type from content
            let fileType = 'txt';
            const firstLine = content.split('\n')[0];
            
            if (content.includes('<!DOCTYPE html') || content.includes('<html')) {
                fileType = 'html';
                if (!artifactName) artifactName = `artifact_${index + 1}.html`;
            } else if (content.includes('import React') || content.includes('export default')) {
                fileType = 'jsx';
                if (!artifactName) artifactName = `artifact_${index + 1}.jsx`;
            } else if (content.includes('def ') || content.includes('import ') || content.includes('from ')) {
                fileType = 'py';
                if (!artifactName) artifactName = `artifact_${index + 1}.py`;
            } else if (content.includes('function') || content.includes('const ') || content.includes('let ')) {
                fileType = 'js';
                if (!artifactName) artifactName = `artifact_${index + 1}.js`;
            } else if (content.includes('package main') || content.includes('func ')) {
                fileType = 'go';
                if (!artifactName) artifactName = `artifact_${index + 1}.go`;
            } else if (content.includes('fn main') || content.includes('impl ')) {
                fileType = 'rs';
                if (!artifactName) artifactName = `artifact_${index + 1}.rs`;
            } else if (content.includes('# ') && content.includes('## ')) {
                fileType = 'md';
                if (!artifactName) artifactName = `artifact_${index + 1}.md`;
            } else if (content.includes('{') && content.includes('}') && content.includes(':')) {
                try {
                    JSON.parse(content);
                    fileType = 'json';
                    if (!artifactName) artifactName = `artifact_${index + 1}.json`;
                } catch (e) {
                    // Not JSON
                }
            }
            
            // Language from class
            const langMatch = codeElement.className.match(/language-(\w+)/);
            if (langMatch) {
                const lang = langMatch[1];
                if (!artifactName) {
                    artifactName = `artifact_${index + 1}.${lang}`;
                }
            }
            
            if (!artifactName) {
                artifactName = `artifact_${index + 1}.${fileType}`;
            }
            
            // Check if this looks like a substantial artifact
            const lineCount = content.split('\n').length;
            if (lineCount > 5 || content.length > 200) {
                artifacts.push({
                    name: artifactName,
                    content: content,
                    type: fileType,
                    lineCount: lineCount,
                    size: content.length,
                    element: pre
                });
                
                console.log(`  Found artifact: ${artifactName} (${lineCount} lines, ${content.length} chars)`);
            }
        });
        
        // Method 2: Look for interactive artifacts (React components, etc.)
        console.log('\n🎭 Method 2: Checking for interactive artifacts...');
        
        // Look for iframes that might contain artifacts
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe, index) => {
            const src = iframe.getAttribute('src') || '';
            const title = iframe.getAttribute('title') || '';
            
            if (src || title) {
                console.log(`  Found iframe: ${title || src}`);
                artifacts.push({
                    name: `interactive_artifact_${index + 1}.html`,
                    content: `<!-- Interactive artifact iframe -->\n<!-- Source: ${src} -->\n<!-- Title: ${title} -->`,
                    type: 'html',
                    interactive: true,
                    element: iframe
                });
            }
        });
        
        // Method 3: Look for file download links
        console.log('\n🔗 Method 3: Checking for download links...');
        const downloadLinks = document.querySelectorAll('a[download], a[href*="blob:"], a[href*="data:"]');
        
        downloadLinks.forEach((link, index) => {
            const href = link.getAttribute('href') || '';
            const download = link.getAttribute('download') || '';
            const text = link.textContent || '';
            
            console.log(`  Found download link: ${download || text}`);
            
            artifacts.push({
                name: download || `download_${index + 1}`,
                content: `Download link: ${href}`,
                type: 'link',
                href: href,
                element: link
            });
        });
        
        return artifacts;
    }
    
    // Extract all artifacts
    const artifacts = findArtifacts();
    
    console.log(`\n✅ Total artifacts found: ${artifacts.length}`);
    
    // Display results
    if (artifacts.length > 0) {
        console.log('\n📋 Artifact Summary:');
        artifacts.forEach((artifact, index) => {
            console.log(`\n${index + 1}. ${artifact.name}`);
            console.log(`   Type: ${artifact.type}`);
            if (artifact.lineCount) {
                console.log(`   Lines: ${artifact.lineCount}`);
                console.log(`   Size: ${artifact.size} characters`);
            }
            if (artifact.interactive) {
                console.log(`   Interactive: Yes`);
            }
            console.log(`   Preview: ${artifact.content.substring(0, 100)}...`);
        });
        
        // Save to window for access
        window.claudeArtifacts = artifacts;
        console.log('\n💾 Artifacts saved to window.claudeArtifacts');
        
        // Create download function
        window.downloadArtifacts = function() {
            artifacts.forEach((artifact, index) => {
                if (artifact.type !== 'link' && artifact.content) {
                    const blob = new Blob([artifact.content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = artifact.name;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    console.log(`Downloaded: ${artifact.name}`);
                }
            });
        };
        
        console.log('\n📥 To download all artifacts, run: downloadArtifacts()');
    } else {
        console.log('\n❌ No artifacts found in this conversation');
        console.log('💡 Artifacts are usually substantial code files or documents');
    }
    
})();