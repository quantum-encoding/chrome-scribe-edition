// Claude Scraper - Copy Method
// Uses the Copy button to get artifact content and saves inline in the conversation
(async function() {
    'use strict';
    
    console.log('🚀 Claude Scraper (Copy Method)\n');
    
    // Get conversation name
    const conversationName = getConversationName();
    console.log(`Processing: ${conversationName}`);
    
    // Extract conversation with artifacts inline
    const { conversation, artifacts } = await extractConversationWithArtifacts();
    
    // Create markdown with artifacts included
    const markdown = createMarkdownWithArtifacts(conversationName, conversation, artifacts);
    const filename = sanitizeFilename(conversationName);
    
    // Download the complete conversation with artifacts
    downloadMarkdown(markdown, filename);
    
    console.log(`\n✅ Complete!`);
    console.log(`Downloaded conversation with ${artifacts.length} artifacts inline`);
    
    // Helper functions
    function getConversationName() {
        const nameXPath = '/html/body/div[4]/div[2]/div/div[1]/header/div[2]/div[1]/div/button/div[1]/div';
        const nameResult = document.evaluate(nameXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const nameElement = nameResult.singleNodeValue;
        
        if (nameElement && nameElement.textContent) {
            return nameElement.textContent.trim();
        }
        
        const titleElement = document.querySelector('title');
        if (titleElement && titleElement.textContent) {
            const title = titleElement.textContent.replace(' - Claude', '').trim();
            if (title && title !== 'Claude') {
                return title;
            }
        }
        
        return `Claude_Conversation_${new Date().toISOString().slice(0,19).replace(/[:-]/g,'')}`;
    }
    
    function sanitizeFilename(filename) {
        return filename
            .replace(/[<>:"/\\|?*]/g, '_')
            .replace(/\s+/g, '_')
            .replace(/_{2,}/g, '_')
            .trim()
            .substring(0, 180);
    }
    
    async function extractConversationWithArtifacts() {
        const baseXPath = '/html/body/div[4]/div[2]/div/div[1]/div/div/div[1]';
        const containerResult = document.evaluate(baseXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const container = containerResult.singleNodeValue;
        
        if (!container) {
            console.error('Could not find conversation container');
            return { conversation: [], artifacts: [] };
        }
        
        const conversation = [];
        const artifacts = [];
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
                artifacts: []
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
                    
                    // Determine role by checking CSS classes
                    let role = 'unknown';
                    const messageBlock = container.children[i - 1];
                    
                    if (messageBlock) {
                        const userElements = messageBlock.querySelectorAll('.font-user-message');
                        const claudeElements = messageBlock.querySelectorAll('.font-claude-message, .font-claude-response');
                        
                        if (userElements.length > 0) {
                            role = 'user';
                        } else if (claudeElements.length > 0) {
                            role = 'assistant';
                        }
                    }
                    
                    if (role === 'unknown') {
                        role = (messageCount % 2 === 1) ? 'user' : 'assistant';
                    }
                    
                    const textContent = messageElement.innerText || messageElement.textContent || '';
                    
                    const message = {
                        index: messageCount,
                        role: role,
                        content: textContent.trim(),
                        artifacts: []
                    };
                    
                    // Look for artifacts in this message
                    if (messageBlock) {
                        const artifactButtons = messageBlock.querySelectorAll('button[aria-label="Preview contents"]');
                        
                        for (let j = 0; j < artifactButtons.length; j++) {
                            console.log(`\nProcessing artifact ${j + 1} in message ${messageCount}...`);
                            
                            // Click artifact button
                            artifactButtons[j].click();
                            await new Promise(resolve => setTimeout(resolve, 1500));
                            
                            // Find the panel
                            const panel = document.querySelector('[class*="basis-0"]') || 
                                         document.evaluate('/html/body/div[4]/div[2]/div/div[3]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                            
                            if (panel) {
                                // Find the artifact title
                                const titleElement = panel.querySelector('h2, div[class*="text-lg"], div[class*="font-semibold"]');
                                const artifactTitle = titleElement ? titleElement.textContent.trim() : `artifact_${j + 1}`;
                                
                                // Find the Copy button
                                const copyButton = panel.querySelector('button:has(div:contains("Copy"))') ||
                                                  Array.from(panel.querySelectorAll('button')).find(btn => 
                                                      btn.textContent.includes('Copy')
                                                  );
                                
                                if (copyButton) {
                                    // Click copy button
                                    copyButton.click();
                                    console.log('  Clicked Copy button');
                                    
                                    // Wait for clipboard
                                    await new Promise(resolve => setTimeout(resolve, 300));
                                    
                                    try {
                                        // Read from clipboard
                                        const artifactContent = await navigator.clipboard.readText();
                                        console.log('  ✅ Got artifact content from clipboard');
                                        
                                        // Determine file extension from content or title
                                        let extension = 'txt';
                                        if (artifactContent.includes('```python') || artifactContent.includes('import ') || artifactContent.includes('def ')) {
                                            extension = 'py';
                                        } else if (artifactContent.includes('```javascript') || artifactContent.includes('const ') || artifactContent.includes('function ')) {
                                            extension = 'js';
                                        } else if (artifactContent.includes('#') && artifactContent.includes('\n')) {
                                            extension = 'md';
                                        }
                                        
                                        const artifact = {
                                            title: artifactTitle,
                                            filename: `${sanitizeFilename(artifactTitle)}.${extension}`,
                                            content: artifactContent,
                                            messageIndex: messageCount
                                        };
                                        
                                        artifacts.push(artifact);
                                        message.artifacts.push(artifact);
                                        
                                    } catch (err) {
                                        console.log('  ❌ Could not read clipboard:', err);
                                    }
                                } else {
                                    console.log('  ❌ Copy button not found');
                                }
                                
                                // Close panel
                                const closeButton = panel.querySelector('button[aria-label="Close"]');
                                if (closeButton) {
                                    closeButton.click();
                                } else {
                                    document.body.click();
                                }
                                await new Promise(resolve => setTimeout(resolve, 500));
                            }
                        }
                    }
                    
                    conversation.push(message);
                }
            } catch (error) {
                continue;
            }
        }
        
        console.log(`\n✅ Found ${conversation.length} messages`);
        console.log(`✅ Found ${artifacts.length} artifacts`);
        return { conversation, artifacts };
    }
    
    function createMarkdownWithArtifacts(conversationName, conversation, artifacts) {
        let markdown = `# ${conversationName}\n\n`;
        markdown += `> **URL:** ${window.location.href}\n`;
        markdown += `> **Exported:** ${new Date().toLocaleString()}\n`;
        markdown += `> **Messages:** ${conversation.length}\n`;
        markdown += `> **Artifacts:** ${artifacts.length}\n\n`;
        
        // Add artifacts summary
        if (artifacts.length > 0) {
            markdown += '## Artifacts Summary\n\n';
            artifacts.forEach((artifact, idx) => {
                markdown += `${idx + 1}. **${artifact.title}** - \`${artifact.filename}\` (in message ${artifact.messageIndex})\n`;
            });
            markdown += '\n';
        }
        
        markdown += '---\n\n';
        
        // Add conversation with inline artifacts
        conversation.forEach(msg => {
            const roleEmoji = msg.role === 'user' ? '👤' : '🤖';
            markdown += `## ${roleEmoji} ${msg.role === 'user' ? 'Human' : 'Claude'}\n\n`;
            markdown += msg.content + '\n\n';
            
            // Add artifacts for this message
            if (msg.artifacts && msg.artifacts.length > 0) {
                msg.artifacts.forEach(artifact => {
                    markdown += `### 📎 Artifact: ${artifact.title}\n\n`;
                    markdown += `**Filename:** \`${artifact.filename}\`\n\n`;
                    markdown += '```' + artifact.filename.split('.').pop() + '\n';
                    markdown += artifact.content + '\n';
                    markdown += '```\n\n';
                });
            }
            
            markdown += '---\n\n';
        });
        
        return markdown;
    }
    
    function downloadMarkdown(content, filename) {
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
})();