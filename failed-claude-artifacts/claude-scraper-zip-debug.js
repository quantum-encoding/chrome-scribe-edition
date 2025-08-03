// Claude Conversation Scraper with ZIP Artifacts - DEBUG VERSION
// This version includes extensive logging to debug artifact extraction

(function() {
    'use strict';
    
    console.log('🚀 Claude Conversation Scraper with ZIP (DEBUG) Starting...');
    
    // Load JSZip library
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    document.head.appendChild(script);
    
    script.onload = async function() {
        console.log('✅ JSZip loaded');
        await startScraping();
    };
    
    async function startScraping() {
        // Get conversation name from header
        function getConversationName() {
            const nameXPath = '/html/body/div[4]/div[2]/div/div[1]/header/div[2]/div[1]/div/button/div[1]/div';
            const nameResult = document.evaluate(nameXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const nameElement = nameResult.singleNodeValue;
            
            if (nameElement && nameElement.textContent) {
                return nameElement.textContent.trim();
            }
            
            // Fallback to page title
            const titleElement = document.querySelector('title');
            if (titleElement && titleElement.textContent) {
                const title = titleElement.textContent.replace(' - Claude', '').trim();
                if (title && title !== 'Claude') {
                    return title;
                }
            }
            
            return `Claude_Conversation_${new Date().toISOString().slice(0,19).replace(/[:-]/g,'')}`;
        }
        
        // Sanitize filename
        function sanitizeFilename(filename) {
            return filename
                .replace(/[<>:"/\\|?*]/g, '_')
                .replace(/\s+/g, '_')
                .replace(/_{2,}/g, '_')
                .trim()
                .substring(0, 180);
        }
        
        // Extract conversation messages (simplified for debugging)
        const conversation = [];
        console.log('📝 Extracting conversation messages...');
        
        // Extract artifacts with detailed logging
        async function extractArtifacts() {
            console.log('\n🎨 Extracting artifacts (DEBUG MODE)...');
            const artifacts = [];
            
            // Find all code blocks
            const codeBlocks = document.querySelectorAll('pre');
            console.log(`Found ${codeBlocks.length} <pre> elements`);
            
            codeBlocks.forEach((pre, index) => {
                console.log(`\n--- Code block ${index + 1} ---`);
                
                const codeElement = pre.querySelector('code');
                if (!codeElement) {
                    console.log('  ❌ No <code> element found');
                    return;
                }
                
                const content = codeElement.textContent || '';
                const lines = content.split('\n').length;
                
                console.log(`  📏 Size: ${content.length} chars, ${lines} lines`);
                console.log(`  📄 First line: ${content.split('\n')[0].substring(0, 50)}...`);
                
                // Skip small snippets
                if (content.length < 100 && lines < 5) {
                    console.log('  ⏭️ Skipping (too small)');
                    return;
                }
                
                // Detect language/type
                let fileType = 'txt';
                const langMatch = codeElement.className.match(/language-(\w+)/);
                
                if (langMatch) {
                    fileType = langMatch[1];
                    console.log(`  🏷️ Language from class: ${fileType}`);
                } else {
                    // Content-based detection
                    if (content.includes('use std::') || content.includes('fn main') || content.includes('impl ') || content.includes('pub fn')) {
                        fileType = 'rs';
                        console.log('  🦀 Detected Rust from content');
                    } else if (content.includes('def ') || content.includes('import ')) {
                        fileType = 'py';
                        console.log('  🐍 Detected Python from content');
                    } else if (content.includes('function') || content.includes('const ')) {
                        fileType = 'js';
                        console.log('  📜 Detected JavaScript from content');
                    }
                }
                
                const artifactName = `artifact_${index + 1}`;
                const fullName = `${artifactName}.${fileType}`;
                
                console.log(`  💾 Creating artifact: ${fullName}`);
                console.log(`  📊 Content type: ${typeof content}`);
                console.log(`  ✂️ Content trimmed: ${content.trim().length} chars`);
                
                artifacts.push({
                    name: sanitizeFilename(artifactName),
                    extension: fileType,
                    content: content.trim(),
                    originalLength: content.length,
                    trimmedLength: content.trim().length
                });
                
                console.log('  ✅ Artifact added');
            });
            
            console.log(`\n📦 Total artifacts extracted: ${artifacts.length}`);
            return artifacts;
        }
        
        // Main execution
        const conversationName = getConversationName();
        const sanitizedName = sanitizeFilename(conversationName);
        console.log(`\n📌 Conversation: ${conversationName}`);
        console.log(`📁 Sanitized name: ${sanitizedName}`);
        
        // Extract artifacts
        const artifacts = await extractArtifacts();
        
        // Create ZIP file
        console.log('\n📦 Creating ZIP file...');
        const zip = new JSZip();
        
        // Add a simple test file first
        console.log('  Adding test file...');
        zip.file('test.txt', 'This is a test file to verify ZIP creation works.');
        
        // Add conversation markdown (simplified)
        console.log('  Adding conversation file...');
        const conversationMarkdown = `# ${conversationName}\n\nExported: ${new Date().toLocaleString()}\n\nThis is a test export.`;
        zip.file(`${sanitizedName}_conversation.md`, conversationMarkdown);
        
        // Add artifacts
        if (artifacts.length > 0) {
            console.log(`  Creating artifacts folder with ${artifacts.length} files...`);
            const artifactsFolder = zip.folder('artifacts');
            
            artifacts.forEach((artifact, index) => {
                const filename = `${index + 1}_${artifact.name}.${artifact.extension}`;
                console.log(`    Adding: ${filename} (${artifact.trimmedLength} chars)`);
                
                // Log the actual content being added
                if (artifact.content.length === 0) {
                    console.warn(`    ⚠️ WARNING: Empty content for ${filename}`);
                } else {
                    console.log(`    ✓ Content starts with: ${artifact.content.substring(0, 30)}...`);
                }
                
                artifactsFolder.file(filename, artifact.content);
            });
            
            // Add artifacts index
            let artifactsIndex = '# Artifacts Index\n\n';
            artifacts.forEach((artifact, index) => {
                artifactsIndex += `${index + 1}. ${artifact.name}.${artifact.extension} (${artifact.trimmedLength} chars)\n`;
            });
            artifactsFolder.file('_index.md', artifactsIndex);
            console.log('  Added artifacts index');
        } else {
            console.log('  No artifacts to add');
        }
        
        // Add metadata
        console.log('  Adding metadata...');
        const metadata = {
            conversationName: conversationName,
            exportDate: new Date().toISOString(),
            artifactCount: artifacts.length,
            url: window.location.href,
            debug: true
        };
        zip.file('metadata.json', JSON.stringify(metadata, null, 2));
        
        // List ZIP contents before generating
        console.log('\n📋 ZIP contents:');
        Object.keys(zip.files).forEach(filename => {
            const file = zip.files[filename];
            console.log(`  - ${filename} (${file.dir ? 'directory' : 'file'})`);
        });
        
        // Generate and download ZIP
        console.log('\n💾 Generating ZIP file...');
        
        zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: {
                level: 6
            }
        }).then(function(content) {
            console.log(`✅ ZIP generated, size: ${content.size} bytes`);
            
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${sanitizedName}_debug.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log('\n🎉 Download complete!');
            console.log(`📁 Filename: ${sanitizedName}_debug.zip`);
            console.log(`📊 ZIP size: ${(content.size / 1024).toFixed(2)} KB`);
            console.log(`🎨 Artifacts included: ${artifacts.length}`);
            
            // Save artifacts for inspection
            window.debugArtifacts = artifacts;
            console.log('\n💡 Artifacts saved to window.debugArtifacts for inspection');
            
        }).catch(function(error) {
            console.error('❌ Error generating ZIP:', error);
        });
    }
    
})();