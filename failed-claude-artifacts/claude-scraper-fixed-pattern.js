// Claude Scraper - Fixed pattern matching for download links
(async function() {
    'use strict';
    
    console.log('🚀 Claude Scraper - Fixed Pattern\n');
    
    // Get conversation name
    const conversationName = getConversationName();
    console.log(`Processing: ${conversationName}`);
    
    // Extract conversation
    const conversation = extractConversation();
    console.log(`✅ Found ${conversation.length} messages`);
    
    // Process artifacts
    const artifactData = await processArtifacts();
    
    // Create and download markdown
    const markdown = createMarkdown(conversationName, conversation, artifactData);
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
    console.log(`Downloaded ${artifactData.downloadCount}/${artifactData.artifactsList.length} artifacts`);
    
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
    
    async function processArtifacts() {
        console.log('\n📋 Looking for artifacts...');
        
        const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
        console.log(`Found ${artifactButtons.length} artifacts`);
        
        const artifactsList = [];
        let downloadCount = 0;
        
        for (let i = 0; i < artifactButtons.length; i++) {
            console.log(`\nProcessing artifact ${i + 1}/${artifactButtons.length}`);
            
            // Click artifact button
            artifactButtons[i].click();
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Find the panel
            const panel = document.querySelector('[class*="basis-0"]') || 
                         document.evaluate('/html/body/div[4]/div[2]/div/div[3]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            
            if (!panel) {
                console.log('  ❌ Panel not found');
                continue;
            }
            
            // Find dropdown button (button with SVG after Copy button)
            let dropdownButton = null;
            const buttons = panel.querySelectorAll('button');
            
            for (let j = 0; j < buttons.length; j++) {
                const btn = buttons[j];
                if (btn.textContent?.includes('Copy')) continue;
                
                if (btn.querySelector('svg')) {
                    if (j > 0 && buttons[j-1].textContent?.includes('Copy')) {
                        dropdownButton = btn;
                        console.log('  ✅ Found dropdown button');
                        break;
                    }
                }
            }
            
            if (!dropdownButton) {
                console.log('  ❌ Dropdown button not found');
                continue;
            }
            
            // Click dropdown
            console.log('  Clicking dropdown...');
            dropdownButton.click();
            
            // Wait for menu
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Search for download link with better pattern matching
            let downloadLink = null;
            const allLinks = document.querySelectorAll('a');
            console.log(`  Searching ${allLinks.length} links...`);
            
            for (const link of allLinks) {
                const text = link.textContent || '';
                const href = link.getAttribute('href') || '';
                
                // More flexible pattern matching
                if (text.includes('Download') || 
                    text.match(/download/i) ||
                    (href.includes('blob:') && link.hasAttribute('download'))) {
                    
                    downloadLink = link;
                    console.log(`  ✅ Found: "${text.trim()}"`);
                    
                    // Log parent structure to understand where it appears
                    let parent = link.parentElement;
                    let depth = 0;
                    while (parent && depth < 5) {
                        console.log(`    Parent ${depth}: ${parent.tagName}.${parent.className}`);
                        parent = parent.parentElement;
                        depth++;
                    }
                    break;
                }
            }
            
            // If not found, log what we do see
            if (!downloadLink) {
                console.log('  ❌ No download link found');
                console.log('  Links containing "load":');
                for (const link of allLinks) {
                    if (link.textContent?.toLowerCase().includes('load')) {
                        console.log(`    "${link.textContent.trim()}"`);
                    }
                }
            }
            
            if (downloadLink) {
                const filename = downloadLink.getAttribute('download') || `artifact_${i + 1}`;
                const fileType = downloadLink.textContent.match(/\.(\w+)/)?.[1] || 'unknown';
                
                artifactsList.push({
                    index: i + 1,
                    filename: filename,
                    type: fileType,
                    downloaded: true
                });
                
                downloadLink.click();
                downloadCount++;
                console.log('  📥 Downloaded!');
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                artifactsList.push({
                    index: i + 1,
                    filename: `artifact_${i + 1}`,
                    type: 'unknown',
                    downloaded: false
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
        }
        
        return { downloadCount, artifactsList };
    }
    
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
        
        // Check for first message
        const firstMessageXPath = `${baseXPath}/div[1]/div/div[2]/div[1]/div[2]/p`;
        const firstResult = document.evaluate(firstMessageXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const firstMessage = firstResult.singleNodeValue;
        
        if (firstMessage && firstMessage.textContent?.trim()) {
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
                
                if (messageElement && messageElement.textContent?.trim()) {
                    messageCount++;
                    
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
                    
                    conversation.push({
                        index: messageCount,
                        role: role,
                        content: textContent.trim()
                    });
                }
            } catch (error) {
                continue;
            }
        }
        
        return conversation;
    }
    
    function createMarkdown(conversationName, conversation, artifactData) {
        let markdown = `# ${conversationName}\n\n`;
        markdown += `> **URL:** ${window.location.href}\n`;
        markdown += `> **Exported:** ${new Date().toLocaleString()}\n`;
        markdown += `> **Messages:** ${conversation.length}\n`;
        markdown += `> **Artifacts found:** ${artifactData.artifactsList.length}\n`;
        markdown += `> **Artifacts downloaded:** ${artifactData.downloadCount}\n\n`;
        
        if (artifactData.artifactsList.length > 0) {
            markdown += '## Artifacts\n\n';
            artifactData.artifactsList.forEach(artifact => {
                const status = artifact.downloaded ? '✅' : '❌';
                markdown += `${artifact.index}. ${status} **${artifact.filename}** (${artifact.type})\n`;
            });
            markdown += '\n';
        }
        
        markdown += '---\n\n';
        
        conversation.forEach(msg => {
            const roleEmoji = msg.role === 'user' ? '👤' : '🤖';
            markdown += `## ${roleEmoji} ${msg.role === 'user' ? 'Human' : 'Claude'}\n\n`;
            markdown += msg.content + '\n\n';
            markdown += '---\n\n';
        });
        
        return markdown;
    }
    
})();