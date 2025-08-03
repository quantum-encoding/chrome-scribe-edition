// Claude Scraper - Copy Method Fixed
// Uses the Copy button to get artifact content and saves inline in the conversation
(async function() {
    'use strict';
    
    console.log('🚀 Claude Scraper (Copy Method Fixed)\n');
    
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
                                // Find the artifact title - look for the heading in the panel
                                const titleElement = panel.querySelector('h1, h2, h3, [class*="text-lg"], [class*="font-bold"], [class*="font-semibold"]');
                                const artifactTitle = titleElement ? titleElement.textContent.trim() : `artifact_${j + 1}`;
                                console.log(`  Artifact title: ${artifactTitle}`);
                                
                                // Find the Copy button - it's the first button in the button group
                                const buttonGroups = panel.querySelectorAll('div.flex.font-medium');
                                let copyButton = null;
                                
                                for (const group of buttonGroups) {
                                    const buttons = group.querySelectorAll('button');
                                    if (buttons.length >= 2) {
                                        // First button is usually Copy
                                        const firstButton = buttons[0];
                                        if (firstButton.textContent.includes('Copy') || firstButton.querySelector('div')?.textContent.includes('Copy')) {
                                            copyButton = firstButton;
                                            break;
                                        }
                                    }
                                }
                                
                                // Alternative: look for button with Copy text
                                if (!copyButton) {
                                    const allButtons = panel.querySelectorAll('button');
                                    for (const btn of allButtons) {
                                        if (btn.textContent.trim() === 'Copy' || 
                                            (btn.querySelector('div') && btn.querySelector('div').textContent.trim() === 'Copy')) {
                                            copyButton = btn;
                                            break;
                                        }
                                    }
                                }
                                
                                if (copyButton) {
                                    // Click copy button
                                    copyButton.click();
                                    console.log('  ✅ Clicked Copy button');
                                    
                                    // Wait for clipboard
                                    await new Promise(resolve => setTimeout(resolve, 500));
                                    
                                    try {
                                        // Read from clipboard
                                        const artifactContent = await navigator.clipboard.readText();
                                        
                                        if (artifactContent && artifactContent.length > 0) {
                                            console.log(`  ✅ Got artifact content (${artifactContent.length} chars)`);
                                            
                                            // Determine file extension from content
                                            let extension = 'txt';
                                            if (artifactContent.includes('import ') || artifactContent.includes('def ') || artifactContent.includes('class ')) {
                                                extension = 'py';
                                            } else if (artifactContent.includes('const ') || artifactContent.includes('function ') || artifactContent.includes('let ')) {
                                                extension = 'js';
                                            } else if (artifactContent.includes('# ') && artifactContent.includes('\n## ')) {
                                                extension = 'md';
                                            } else if (artifactContent.includes('<!DOCTYPE') || artifactContent.includes('<html')) {
                                                extension = 'html';
                                            } else if (artifactContent.includes('{') && artifactContent.includes('}')) {
                                                extension = 'json';
                                            }
                                            
                                            const artifact = {
                                                title: artifactTitle,
                                                filename: `${sanitizeFilename(artifactTitle)}.${extension}`,
                                                content: artifactContent,
                                                messageIndex: messageCount
                                            };
                                            
                                            artifacts.push(artifact);
                                            message.artifacts.push(artifact);
                                        } else {
                                            console.log('  ❌ Clipboard was empty');
                                        }
                                        
                                    } catch (err) {
                                        console.log('  ❌ Could not read clipboard:', err.message);
                                        // Try to show a prompt for clipboard permission
                                        console.log('  💡 Make sure to allow clipboard access when prompted');
                                    }
                                } else {
                                    console.log('  ❌ Copy button not found');
                                    // Debug: log what buttons we see
                                    const allButtons = panel.querySelectorAll('button');
                                    console.log(`  Debug: Found ${allButtons.length} buttons in panel`);
                                    allButtons.forEach((btn, idx) => {
                                        if (idx < 5) { // Only log first 5
                                            console.log(`    Button ${idx}: "${btn.textContent.trim().substring(0, 20)}..."`);
                                        }
                                    });
                                }
                                
                                // Close panel
                                const closeButton = panel.querySelector('button[aria-label="Close"]');
                                if (closeButton) {
                                    closeButton.click();
                                } else {
                                    document.body.click();
                                }
                                await new Promise(resolve => setTimeout(resolve, 500));
                            } else {
                                console.log('  ❌ Panel not found');
                            }
                        }
                    }
                    
                    conversation.push(message);
                }
            } catch (error) {
                console.error('Error processing message:', error);
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