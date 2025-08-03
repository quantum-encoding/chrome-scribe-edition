// Claude Conversation Scraper with Artifact Download
// Run this in the browser console on a Claude conversation page

(function() {
    'use strict';
    
    console.log('🚀 Claude Conversation Scraper with Artifacts Starting...');
    
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
        console.error('Could not find conversation container. Make sure you\'re on a Claude conversation page.');
        return;
    }
    
    console.log('✅ Found conversation container');
    
    const conversation = [];
    let messageCount = 0;
    
    // Check for the first message with different structure
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
        console.log(`Found first message: user - ${firstMessage.textContent.substring(0, 50)}...`);
    }
    
    // Then check the rest with the standard pattern
    for (let i = 1; i <= container.children.length; i++) {
        try {
            const messageXPath = `${baseXPath}/div[${i}]/div/div/div[1]/div[2]`;
            const result = document.evaluate(messageXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const messageElement = result.singleNodeValue;
            
            if (messageElement && messageElement.textContent && messageElement.textContent.trim()) {
                messageCount++;
                
                // Determine role
                let role = 'unknown';
                
                // Check for user message class
                if (messageElement.classList.contains('font-user-message')) {
                    role = 'user';
                } else {
                    // Check for role indicators
                    const messageContainer = messageElement.closest('div[class*="group"]') || messageElement.parentElement?.parentElement?.parentElement;
                    const containerText = messageContainer?.textContent || '';
                    
                    if (containerText.startsWith('Human') || containerText.includes('\nHuman\n')) {
                        role = 'user';
                    } else if (containerText.startsWith('Assistant') || containerText.includes('\nAssistant\n')) {
                        role = 'assistant';
                    } else {
                        // Fallback based on alternation
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
                
                // Extract text content
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
                
                console.log(`Found message ${messageCount}: ${role} - ${textContent.substring(0, 50)}...`);
            }
        } catch (error) {
            continue;
        }
    }
    
    console.log(`\n✅ Found ${conversation.length} messages`);
    
    // Process artifacts
    async function processArtifacts() {
        console.log('\n🎨 Looking for artifacts...');
        
        // Click the artifacts button
        const artifactsButtonXPath = '/html/body/div[4]/div[2]/div/div[3]/div/div[2]/div/div/div[1]/button';
        const buttonResult = document.evaluate(artifactsButtonXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const artifactsButton = buttonResult.singleNodeValue;
        
        if (!artifactsButton) {
            console.log('No artifacts button found');
            return [];
        }
        
        console.log('Found artifacts button, clicking...');
        artifactsButton.click();
        
        // Wait for list to appear
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get artifact list items
        const artifactsList = [];
        const listXPath = '/html/body/div[4]/div[2]/div/div[3]/div/div[2]/div/div/div[1]/div[1]/ul';
        const listResult = document.evaluate(listXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const listElement = listResult.singleNodeValue;
        
        if (listElement) {
            const listItems = listElement.querySelectorAll('li');
            console.log(`Found ${listItems.length} artifacts`);
            
            for (let i = 0; i < listItems.length; i++) {
                const item = listItems[i];
                const artifactName = item.textContent.trim();
                
                // Click on the artifact
                const clickableElement = item.querySelector('div > div') || item;
                clickableElement.click();
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Look for download button
                const downloadButtonXPath = '/html/body/div[4]/div[2]/div/div[3]/div/div[2]/div/div/div[1]/div[2]/div/button[2]';
                const downloadResult = document.evaluate(downloadButtonXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                const downloadButton = downloadResult.singleNodeValue;
                
                if (downloadButton) {
                    console.log(`Clicking download for artifact: ${artifactName}`);
                    downloadButton.click();
                    
                    // Wait for download menu
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Look for download options in the menu (assuming it appears in div[6])
                    const menuLinks = document.querySelectorAll('div[role="menu"] a, div[tabindex="-1"] a');
                    
                    // Prefer .md, then native format (.py, .js), then any
                    let downloadLink = null;
                    
                    // First pass: look for .md
                    for (const link of menuLinks) {
                        if (link.textContent.includes('.md') || link.textContent.includes('Markdown')) {
                            downloadLink = link;
                            break;
                        }
                    }
                    
                    // Second pass: look for native format
                    if (!downloadLink) {
                        for (const link of menuLinks) {
                            if (link.textContent.includes('.py') || 
                                link.textContent.includes('.js') || 
                                link.textContent.includes('.html') ||
                                link.textContent.includes('.css')) {
                                downloadLink = link;
                                break;
                            }
                        }
                    }
                    
                    // Third pass: take first download option
                    if (!downloadLink && menuLinks.length > 0) {
                        downloadLink = menuLinks[0];
                    }
                    
                    if (downloadLink) {
                        console.log(`Downloading: ${downloadLink.textContent}`);
                        downloadLink.click();
                        
                        artifactsList.push({
                            name: artifactName,
                            downloaded: true,
                            format: downloadLink.textContent
                        });
                    } else {
                        console.log(`No download link found for: ${artifactName}`);
                        artifactsList.push({
                            name: artifactName,
                            downloaded: false
                        });
                    }
                    
                    // Close menu if still open
                    document.body.click();
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }
        }
        
        return artifactsList;
    }
    
    // Save conversation as markdown
    function saveConversation(conversationName) {
        const sanitizedName = sanitizeFilename(conversationName);
        
        let markdown = `# ${conversationName}\n\n`;
        markdown += `> **URL:** ${window.location.href}\n`;
        markdown += `> **Exported:** ${new Date().toLocaleString()}\n`;
        markdown += `> **Messages:** ${conversation.length}\n\n`;
        markdown += '---\n\n';
        
        conversation.forEach(msg => {
            const roleEmoji = msg.role === 'user' ? '👤' : '🤖';
            markdown += `## ${roleEmoji} ${msg.role === 'user' ? 'Human' : 'Claude'}\n\n`;
            
            // Add thinking section if present
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
        
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${sanitizedName}/${sanitizedName}_conversation.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log(`✅ Saved conversation: ${sanitizedName}_conversation.md`);
    }
    
    // Main execution
    async function execute() {
        const conversationName = getConversationName();
        console.log(`\nConversation: ${conversationName}`);
        
        // Save the conversation
        saveConversation(conversationName);
        
        // Process artifacts
        const artifacts = await processArtifacts();
        
        if (artifacts.length > 0) {
            console.log(`\n✅ Processed ${artifacts.length} artifacts`);
            console.log('Downloaded artifacts:', artifacts.filter(a => a.downloaded).map(a => a.name));
        }
        
        console.log('\n🎉 Complete! Check your downloads folder');
        console.log(`Folder name: ${sanitizeFilename(conversationName)}`);
        console.log('Note: You may need to manually organize downloads into the folder');
    }
    
    // Start the process
    execute();
    
})();