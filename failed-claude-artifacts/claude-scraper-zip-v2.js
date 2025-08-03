// Claude Conversation Scraper with ZIP Artifacts - Version 2
// Updated to work with Claude's artifact preview buttons

(function() {
    'use strict';
    
    console.log('🚀 Claude Conversation Scraper with ZIP Starting (v2)...');
    
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
                    
                    // Determine role by checking CSS classes in the message block
                    let role = 'unknown';
                    
                    // Look for role classes in the entire message block
                    const messageBlock = container.children[i - 1];
                    
                    if (messageBlock) {
                        // Check all elements in the message block for role classes
                        const userElements = messageBlock.querySelectorAll('.font-user-message');
                        const claudeElements = messageBlock.querySelectorAll('.font-claude-message, .font-claude-response');
                        
                        if (userElements.length > 0) {
                            role = 'user';
                        } else if (claudeElements.length > 0) {
                            role = 'assistant';
                        }
                    }
                    
                    // Fallback based on alternation
                    if (role === 'unknown') {
                        role = (messageCount % 2 === 1) ? 'user' : 'assistant';
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
        
        // Extract artifacts using the preview buttons
        async function extractArtifacts() {
            console.log('\n🎨 Extracting artifacts using preview buttons...');
            const artifacts = [];
            
            // Find all artifact preview buttons
            const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
            console.log(`Found ${artifactButtons.length} artifact preview buttons`);
            
            for (let i = 0; i < artifactButtons.length; i++) {
                const button = artifactButtons[i];
                const buttonText = button.textContent || '';
                
                console.log(`\nProcessing artifact ${i + 1}: ${buttonText.substring(0, 50)}...`);
                
                // Extract artifact name and type
                let artifactName = '';
                let artifactType = 'txt';
                
                // Parse button text for name and type
                const textParts = buttonText.split(/(?:Code|Interactive artifact|Text)/);
                if (textParts[0]) {
                    artifactName = textParts[0].trim();
                }
                
                if (buttonText.includes('Code')) {
                    artifactType = 'code';
                } else if (buttonText.includes('Interactive artifact')) {
                    artifactType = 'html';
                }
                
                // Click the button to open preview
                button.click();
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Look for the artifact content panel
                // Try multiple selectors as Claude's UI might vary
                const contentSelectors = [
                    '[class*="artifact-content"]',
                    '[class*="preview-content"]',
                    'div[class*="panel"] pre code',
                    'div[class*="drawer"] pre code',
                    'div[class*="modal"] pre code'
                ];
                
                let artifactContent = '';
                let contentFound = false;
                
                for (const selector of contentSelectors) {
                    const contentElements = document.querySelectorAll(selector);
                    if (contentElements.length > 0) {
                        // Get the most recent element (likely the one we just opened)
                        const contentElement = contentElements[contentElements.length - 1];
                        artifactContent = contentElement.textContent || contentElement.innerText || '';
                        if (artifactContent.trim()) {
                            contentFound = true;
                            console.log(`  Found content using selector: ${selector}`);
                            console.log(`  Content length: ${artifactContent.length} characters`);
                            break;
                        }
                    }
                }
                
                // If no content found, try to get from the panel that opened
                if (!contentFound) {
                    // Look for any new panel that appeared
                    const panels = document.querySelectorAll('div[role="dialog"], div[class*="panel"], div[class*="drawer"]');
                    for (const panel of panels) {
                        const codeElement = panel.querySelector('pre code');
                        if (codeElement) {
                            artifactContent = codeElement.textContent || '';
                            if (artifactContent.trim()) {
                                contentFound = true;
                                console.log('  Found content in dialog/panel');
                                break;
                            }
                        }
                    }
                }
                
                if (contentFound && artifactContent.trim()) {
                    // Determine file extension based on content
                    let extension = 'txt';
                    
                    if (artifactType === 'html' || artifactContent.includes('<!DOCTYPE html')) {
                        extension = 'html';
                    } else if (artifactType === 'code') {
                        // Try to detect language from content
                        if (artifactContent.includes('import React') || artifactContent.includes('export default')) {
                            extension = 'jsx';
                        } else if (artifactContent.includes('def ') || artifactContent.includes('import ')) {
                            extension = 'py';
                        } else if (artifactContent.includes('function') || artifactContent.includes('const ')) {
                            extension = 'js';
                        } else if (artifactContent.includes('{') && artifactContent.includes('}')) {
                            try {
                                JSON.parse(artifactContent);
                                extension = 'json';
                            } catch (e) {
                                // Not JSON
                            }
                        }
                    }
                    
                    artifacts.push({
                        name: sanitizeFilename(artifactName || `artifact_${i + 1}`),
                        extension: extension,
                        content: artifactContent.trim()
                    });
                    
                    console.log(`  ✅ Extracted: ${artifactName}.${extension}`);
                } else {
                    console.log('  ❌ Could not extract content');
                }
                
                // Close the preview - look for close button
                const closeButtons = document.querySelectorAll('button[aria-label="Close"], button:has(svg[class*="x"]), button:has(svg[class*="close"])');
                if (closeButtons.length > 0) {
                    closeButtons[closeButtons.length - 1].click();
                } else {
                    // Try clicking outside or pressing Escape
                    document.body.click();
                }
                
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            console.log(`\nTotal artifacts extracted: ${artifacts.length}`);
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