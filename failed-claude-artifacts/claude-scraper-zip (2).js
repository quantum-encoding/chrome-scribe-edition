// Claude Conversation Scraper with ZIP Artifacts
// Run this in the browser console on a Claude conversation page

(function() {
    'use strict';
    
    console.log('🚀 Claude Conversation Scraper with ZIP Starting...');
    
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
        
        // Base XPath for the conversation container
        const baseXPath = '/html/body/div[4]/div[2]/div/div[1]/div/div/div[1]';
        const containerResult = document.evaluate(baseXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const container = containerResult.singleNodeValue;
        
        if (!container) {
            console.error('Could not find conversation container');
            return;
        }
        
        const conversation = [];
        let messageCount = 0;
        
        // Check for the first message
        const firstMessageXPath = `${baseXPath}/div[1]/div/div[2]/div[1]/div[2]/p`;
        const firstResult = document.evaluate(firstMessageXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const firstMessage = firstResult.singleNodeValue;
        
        if (firstMessage && firstMessage.textContent && firstMessage.textContent.trim()) {
            messageCount++;
            conversation.push({
                index: messageCount,
                role: 'user',
                content: firstMessage.textContent.trim(),
                codeBlocks: []
            });
        }
        
        // Process other messages
        for (let i = 1; i <= container.children.length; i++) {
            try {
                const messageXPath = `${baseXPath}/div[${i}]/div/div/div[1]/div[2]`;
                const result = document.evaluate(messageXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                const messageElement = result.singleNodeValue;
                
                if (messageElement && messageElement.textContent && messageElement.textContent.trim()) {
                    messageCount++;
                    
                    // Determine role
                    let role = 'unknown';
                    if (messageElement.classList.contains('font-user-message')) {
                        role = 'user';
                    } else {
                        const messageContainer = messageElement.closest('div[class*="group"]') || messageElement.parentElement?.parentElement?.parentElement;
                        const containerText = messageContainer?.textContent || '';
                        
                        if (containerText.startsWith('Human') || containerText.includes('\nHuman\n')) {
                            role = 'user';
                        } else if (containerText.startsWith('Assistant') || containerText.includes('\nAssistant\n')) {
                            role = 'assistant';
                        } else {
                            role = (messageCount % 2 === 1) ? 'user' : 'assistant';
                        }
                    }
                    
                    // Check for thinking section
                    let thinking = '';
                    const thinkingXPath = `.//div[1]/div/div/div/div/div/div/p`;
                    const thinkingResult = document.evaluate(thinkingXPath, messageElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    
                    if (thinkingResult.snapshotLength > 0) {
                        const thinkingParts = [];
                        for (let j = 0; j < thinkingResult.snapshotLength; j++) {
                            const para = thinkingResult.snapshotItem(j);
                            if (para.textContent.trim()) {
                                thinkingParts.push(para.textContent.trim());
                            }
                        }
                        if (thinkingParts.length > 0) {
                            thinking = thinkingParts.join('\n\n');
                        }
                    }
                    
                    const textContent = messageElement.innerText || messageElement.textContent || '';
                    
                    // Extract code blocks
                    const codeBlocks = [];
                    const preElements = messageElement.querySelectorAll('pre');
                    preElements.forEach(pre => {
                        const codeElement = pre.querySelector('code');
                        if (codeElement) {
                            const languageMatch = codeElement.className.match(/language-(\w+)/);
                            const language = languageMatch ? languageMatch[1] : 'plaintext';
                            
                            codeBlocks.push({
                                language: language,
                                code: codeElement.textContent.trim()
                            });
                        }
                    });
                    
                    conversation.push({
                        index: messageCount,
                        role: role,
                        content: textContent.trim(),
                        thinking: thinking,
                        codeBlocks: codeBlocks
                    });
                }
            } catch (error) {
                continue;
            }
        }
        
        console.log(`✅ Found ${conversation.length} messages`);
        
        // Extract artifacts from the conversation
        async function extractArtifacts() {
            console.log('\n🎨 Extracting artifacts...');
            const artifacts = [];
            
            // Method 1: Extract from code blocks
            const codeBlocks = document.querySelectorAll('pre');
            
            codeBlocks.forEach((pre, index) => {
                const codeElement = pre.querySelector('code');
                if (!codeElement) return;
                
                const content = codeElement.textContent || '';
                if (content.length < 100) return; // Skip small snippets
                
                // Check parent structure for artifact indicators
                let artifactName = '';
                let currentElement = pre;
                
                // Walk up the DOM tree looking for filenames
                for (let i = 0; i < 5; i++) {
                    currentElement = currentElement.parentElement;
                    if (!currentElement) break;
                    
                    // Look for filename in spans
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
                
                if (content.includes('<!DOCTYPE html') || content.includes('<html')) {
                    fileType = 'html';
                } else if (content.includes('import React') || content.includes('export default')) {
                    fileType = 'jsx';
                } else if (content.includes('def ') || content.includes('import ') || content.includes('from ')) {
                    fileType = 'py';
                } else if (content.includes('function') || content.includes('const ') || content.includes('let ')) {
                    fileType = 'js';
                } else if (content.includes('package main') || content.includes('func ')) {
                    fileType = 'go';
                } else if (content.includes('fn main') || content.includes('impl ')) {
                    fileType = 'rs';
                } else if (content.startsWith('# ') || (content.includes('\n# ') && content.includes('\n## '))) {
                    fileType = 'md';
                } else if (content.includes('{') && content.includes('}') && content.includes(':')) {
                    try {
                        JSON.parse(content);
                        fileType = 'json';
                    } catch (e) {
                        // Not JSON
                    }
                }
                
                // Language from class
                const langMatch = codeElement.className.match(/language-(\w+)/);
                if (langMatch) {
                    fileType = langMatch[1];
                }
                
                if (!artifactName) {
                    artifactName = `artifact_${index + 1}`;
                }
                
                // Remove extension from name if present
                const nameWithoutExt = artifactName.replace(/\.[^/.]+$/, '');
                
                // Check if this looks like a substantial artifact
                const lineCount = content.split('\n').length;
                if (lineCount > 5 || content.length > 200) {
                    artifacts.push({
                        name: sanitizeFilename(nameWithoutExt),
                        extension: fileType,
                        content: content.trim()
                    });
                    
                    console.log(`Found artifact: ${nameWithoutExt}.${fileType} (${lineCount} lines)`);
                }
            });
            
            // Method 2: Look for download links
            const downloadLinks = document.querySelectorAll('a[download], a[href*="blob:"], a[href*="data:"]');
            
            downloadLinks.forEach((link, index) => {
                const href = link.getAttribute('href') || '';
                const download = link.getAttribute('download') || '';
                const text = link.textContent || '';
                
                if (download || text.match(/\.(js|jsx|ts|tsx|py|html|css|json|md|txt|sh|yaml|yml|xml|sql|go|rs|cpp|c|h|java)$/i)) {
                    console.log(`Found download link: ${download || text}`);
                    
                    // Note: We can't automatically download these, but we'll note them
                    artifacts.push({
                        name: sanitizeFilename(download || text || `download_${index + 1}`),
                        extension: 'link',
                        content: `Download available at: ${href}`
                    });
                }
            });
            
            console.log(`Total artifacts found: ${artifacts.length}`);
            return artifacts;
        }
        
        // Create conversation markdown
        function createConversationMarkdown(conversationName) {
            let markdown = `# ${conversationName}\n\n`;
            markdown += `> **URL:** ${window.location.href}\n`;
            markdown += `> **Exported:** ${new Date().toLocaleString()}\n`;
            markdown += `> **Messages:** ${conversation.length}\n\n`;
            markdown += '---\n\n';
            
            conversation.forEach(msg => {
                const roleEmoji = msg.role === 'user' ? '👤' : '🤖';
                markdown += `## ${roleEmoji} ${msg.role === 'user' ? 'Human' : 'Claude'}\n\n`;
                
                if (msg.thinking && msg.role === 'assistant') {
                    markdown += `<details>\n<summary>💭 Claude's Thinking</summary>\n\n`;
                    markdown += msg.thinking + '\n\n';
                    markdown += `</details>\n\n`;
                }
                
                markdown += msg.content + '\n\n';
                
                if (msg.codeBlocks && msg.codeBlocks.length > 0) {
                    msg.codeBlocks.forEach(block => {
                        markdown += `\`\`\`${block.language}\n${block.code}\n\`\`\`\n\n`;
                    });
                }
                
                markdown += '---\n\n';
            });
            
            return markdown;
        }
        
        // Main execution
        const conversationName = getConversationName();
        const sanitizedName = sanitizeFilename(conversationName);
        console.log(`\nConversation: ${conversationName}`);
        
        // Extract artifacts
        const artifacts = await extractArtifacts();
        
        // Create ZIP file
        const zip = new JSZip();
        
        // Add conversation markdown
        const conversationMarkdown = createConversationMarkdown(conversationName);
        zip.file(`${sanitizedName}_conversation.md`, conversationMarkdown);
        
        // Add artifacts
        if (artifacts.length > 0) {
            const artifactsFolder = zip.folder('artifacts');
            artifacts.forEach((artifact, index) => {
                const filename = `${index + 1}_${artifact.name}.${artifact.extension}`;
                artifactsFolder.file(filename, artifact.content);
            });
            
            // Add artifacts index
            let artifactsIndex = '# Artifacts Index\n\n';
            artifacts.forEach((artifact, index) => {
                artifactsIndex += `${index + 1}. ${artifact.name}.${artifact.extension}\n`;
            });
            artifactsFolder.file('_index.md', artifactsIndex);
        }
        
        // Add metadata
        const metadata = {
            conversationName: conversationName,
            exportDate: new Date().toISOString(),
            messageCount: conversation.length,
            artifactCount: artifacts.length,
            url: window.location.href
        };
        zip.file('metadata.json', JSON.stringify(metadata, null, 2));
        
        // Generate and download ZIP
        zip.generateAsync({type: 'blob'}).then(function(content) {
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${sanitizedName}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log('\n🎉 Complete!');
            console.log(`Downloaded: ${sanitizedName}.zip`);
            console.log(`Contains: ${conversation.length} messages, ${artifacts.length} artifacts`);
        });
    }
    
})();