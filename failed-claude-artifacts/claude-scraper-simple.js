// Claude Conversation Scraper - Simple Version
// Captures conversation and lists artifacts without trying to extract them

(function() {
    'use strict';
    
    console.log('🚀 Claude Conversation Scraper (Simple) Starting...');
    
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
    
    // Get list of artifacts from the artifacts panel
    async function getArtifactsList() {
        console.log('📋 Getting artifacts list...');
        
        // First check if artifacts panel is already open
        let artifactsList = document.querySelector('/html/body/div[4]/div[2]/div/div[3]/div/div[2]/div/div/div[1]/div[1]/ul');
        
        if (!artifactsList) {
            // Try to open artifacts panel
            const artifactsButtonXPath = '/html/body/div[4]/div[2]/div/div[1]/header/div[2]/div[2]/div/button';
            const artifactsButton = document.evaluate(artifactsButtonXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            
            if (artifactsButton) {
                console.log('Opening artifacts panel...');
                artifactsButton.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        // Now try to find artifacts list
        const artifactsListXPath = '/html/body/div[4]/div[2]/div/div[3]/div/div[2]/div/div/div[1]/div[1]/ul';
        const listResult = document.evaluate(artifactsListXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const listElement = listResult.singleNodeValue;
        
        const artifacts = [];
        
        if (listElement) {
            const listItems = listElement.querySelectorAll('li');
            console.log(`Found ${listItems.length} artifacts`);
            
            listItems.forEach((item, index) => {
                const text = item.textContent || '';
                artifacts.push({
                    index: index + 1,
                    name: text.trim()
                });
            });
        } else {
            console.log('No artifacts panel found');
        }
        
        return artifacts;
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
    
    // Create markdown with artifacts list
    async function createMarkdown() {
        const conversationName = getConversationName();
        const conversation = extractConversation();
        const artifacts = await getArtifactsList();
        
        let markdown = `# ${conversationName}\n\n`;
        markdown += `> **URL:** ${window.location.href}\n`;
        markdown += `> **Exported:** ${new Date().toLocaleString()}\n`;
        markdown += `> **Messages:** ${conversation.length}\n`;
        markdown += `> **Artifacts:** ${artifacts.length}\n\n`;
        
        // List artifacts if any
        if (artifacts.length > 0) {
            markdown += `## 📎 Artifacts in this conversation\n\n`;
            markdown += `*Note: Use Claude's artifact panel to download these files individually*\n\n`;
            artifacts.forEach(artifact => {
                markdown += `${artifact.index}. ${artifact.name}\n`;
            });
            markdown += '\n---\n\n';
        }
        
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
        
        return {
            markdown: markdown,
            filename: sanitizeFilename(conversationName),
            artifactCount: artifacts.length
        };
    }
    
    // Main execution
    async function main() {
        try {
            console.log('📝 Extracting conversation...');
            const result = await createMarkdown();
            
            // Download markdown file
            const blob = new Blob([result.markdown], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${result.filename}.md`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log('\n✅ Complete!');
            console.log(`Downloaded: ${result.filename}.md`);
            console.log(`Contains: conversation with ${result.artifactCount} artifacts listed`);
            console.log('\n💡 To download artifacts: Use Claude\'s artifact panel save options');
            
        } catch (error) {
            console.error('Error:', error);
        }
    }
    
    // Run the scraper
    main();
    
})();