// Claude Conversation Scraper with Artifact Downloads
// Captures conversation and triggers artifact downloads

(function() {
    'use strict';
    
    console.log('🚀 Claude Conversation Scraper Starting...');
    
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
    
    // Download artifacts by clicking through the UI
    async function downloadArtifacts() {
        console.log('📋 Starting artifact downloads...');
        
        // Open artifacts panel if not already open
        const artifactsButtonXPath = '/html/body/div[4]/div[2]/div/div[1]/header/div[2]/div[2]/div/button';
        const artifactsButton = document.evaluate(artifactsButtonXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        
        if (artifactsButton) {
            console.log('Opening artifacts panel...');
            artifactsButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Get list of artifacts
        const artifactsListXPath = '/html/body/div[4]/div[2]/div/div[3]/div/div[2]/div/div/div[1]/div[1]/ul';
        const listResult = document.evaluate(artifactsListXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const listElement = listResult.singleNodeValue;
        
        if (!listElement) {
            console.log('No artifacts found');
            return 0;
        }
        
        const listItems = listElement.querySelectorAll('li');
        console.log(`Found ${listItems.length} artifacts to download`);
        
        let downloadCount = 0;
        
        // Process each artifact
        for (let i = 0; i < listItems.length; i++) {
            const item = listItems[i];
            console.log(`\nProcessing artifact ${i + 1}/${listItems.length}: ${item.textContent}`);
            
            // Click on the artifact to select it
            const clickableDiv = item.querySelector('div > div');
            if (clickableDiv) {
                clickableDiv.click();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Click the dropdown arrow
                const dropdownXPath = '/html/body/div[4]/div[2]/div/div[3]/div/div[2]/div/div/div[1]/div[2]/div/button[2]';
                const dropdownButton = document.evaluate(dropdownXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                
                if (dropdownButton) {
                    dropdownButton.click();
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Look for save options in the dropdown menu
                    const menuItems = document.querySelectorAll('div[role="menu"] a, div[tabindex="-1"] a');
                    
                    // Find the best save option (prefer .md, .py, etc over generic)
                    let saveLink = null;
                    
                    // First pass: look for specific formats
                    for (const link of menuItems) {
                        const text = link.textContent || '';
                        if (text.includes('.md') || text.includes('.py') || text.includes('.js') || 
                            text.includes('.html') || text.includes('.json') || text.includes('.tsx')) {
                            saveLink = link;
                            break;
                        }
                    }
                    
                    // Second pass: take any save option
                    if (!saveLink && menuItems.length > 0) {
                        saveLink = menuItems[0];
                    }
                    
                    if (saveLink) {
                        console.log(`  Downloading as: ${saveLink.textContent}`);
                        saveLink.click();
                        downloadCount++;
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } else {
                        console.log('  No download option found');
                    }
                    
                    // Close dropdown if still open
                    document.body.click();
                    await new Promise(resolve => setTimeout(resolve, 300));
                } else {
                    console.log('  Could not find dropdown button');
                }
            }
        }
        
        return downloadCount;
    }
    
    // Extract conversation messages
    function extractConversation() {
        const baseXPath = '/html/body/div[4]/div[2]/div/div[1]/div/div/div[1]';
        const containerResult = document.evaluate(baseXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const container = containerResult.singleNodeValue;
        
        if (!container) {
            console.error('Could not find conversation container');
            return [];
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
                content: firstMessage.textContent.trim()
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
                    
                    conversation.push({
                        index: messageCount,
                        role: role,
                        content: textContent.trim(),
                        thinking: thinking
                    });
                }
            } catch (error) {
                continue;
            }
        }
        
        console.log(`✅ Found ${conversation.length} messages`);
        return conversation;
    }
    
    // Create markdown
    function createMarkdown(conversationName, conversation, artifactCount) {
        let markdown = `# ${conversationName}\n\n`;
        markdown += `> **URL:** ${window.location.href}\n`;
        markdown += `> **Exported:** ${new Date().toLocaleString()}\n`;
        markdown += `> **Messages:** ${conversation.length}\n`;
        markdown += `> **Artifacts:** ${artifactCount}\n\n`;
        markdown += '---\n\n';
        
        // Add conversation
        conversation.forEach(msg => {
            const roleEmoji = msg.role === 'user' ? '👤' : '🤖';
            markdown += `## ${roleEmoji} ${msg.role === 'user' ? 'Human' : 'Claude'}\n\n`;
            
            if (msg.thinking && msg.role === 'assistant') {
                markdown += `<details>\n<summary>💭 Claude's Thinking</summary>\n\n`;
                markdown += msg.thinking + '\n\n';
                markdown += `</details>\n\n`;
            }
            
            markdown += msg.content + '\n\n';
            markdown += '---\n\n';
        });
        
        return markdown;
    }
    
    // Main execution
    async function main() {
        try {
            const conversationName = getConversationName();
            console.log(`\n📝 Processing: ${conversationName}`);
            
            // Extract conversation first
            const conversation = extractConversation();
            
            // Download artifacts
            const artifactCount = await downloadArtifacts();
            
            // Create and download markdown
            const markdown = createMarkdown(conversationName, conversation, artifactCount);
            const filename = sanitizeFilename(conversationName);
            
            const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}.md`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log('\n✅ Complete!');
            console.log(`Downloaded conversation: ${filename}.md`);
            console.log(`Downloaded ${artifactCount} artifacts`);
            console.log('\n💡 Check your downloads folder for all files');
            
        } catch (error) {
            console.error('Error:', error);
        }
    }
    
    // Run the scraper
    main();
    
})();