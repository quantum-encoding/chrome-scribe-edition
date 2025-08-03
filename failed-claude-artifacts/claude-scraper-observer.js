// Claude Scraper with MutationObserver - Watch for menu appearance
(async function() {
    'use strict';
    
    console.log('🚀 Claude Scraper with Observer\n');
    
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
        
        // Find all artifact preview buttons
        const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
        console.log(`Found ${artifactButtons.length} artifacts`);
        
        const artifactsList = [];
        let downloadCount = 0;
        
        // Process each artifact
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
            
            // Find dropdown button
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
            
            // Set up mutation observer BEFORE clicking
            let downloadLink = null;
            let observerTimeout;
            
            const observer = new MutationObserver((mutations) => {
                // Look for new elements that might contain download links
                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                // Check if this node or its children contain download links
                                const links = node.querySelectorAll ? node.querySelectorAll('a') : [];
                                for (const link of links) {
                                    if (link.textContent?.includes('Download')) {
                                        downloadLink = link;
                                        console.log(`  ✅ Found download link via observer: "${link.textContent}"`);
                                        observer.disconnect();
                                        clearTimeout(observerTimeout);
                                        return;
                                    }
                                }
                                
                                // Also check if the node itself is a link
                                if (node.tagName === 'A' && node.textContent?.includes('Download')) {
                                    downloadLink = node;
                                    console.log(`  ✅ Found download link node via observer`);
                                    observer.disconnect();
                                    clearTimeout(observerTimeout);
                                    return;
                                }
                            }
                        });
                    }
                }
                
                // Also check all links in document
                const allLinks = document.querySelectorAll('a');
                for (const link of allLinks) {
                    if (link.textContent?.includes('Download as')) {
                        downloadLink = link;
                        console.log(`  ✅ Found download link in document: "${link.textContent}"`);
                        observer.disconnect();
                        clearTimeout(observerTimeout);
                        return;
                    }
                }
            });
            
            // Start observing
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            // Click dropdown
            console.log('  Clicking dropdown and watching for changes...');
            dropdownButton.click();
            
            // Wait for observer to find link or timeout
            await new Promise(resolve => {
                observerTimeout = setTimeout(() => {
                    observer.disconnect();
                    resolve();
                }, 2000);
                
                // Check periodically if link was found
                const checkInterval = setInterval(() => {
                    if (downloadLink) {
                        clearInterval(checkInterval);
                        clearTimeout(observerTimeout);
                        resolve();
                    }
                }, 100);
            });
            
            if (downloadLink) {
                // Get details
                const filename = downloadLink.getAttribute('download') || `artifact_${i + 1}`;
                const fileType = downloadLink.textContent.match(/Download as \.?(\w+)/)?.[1] || 'unknown';
                
                artifactsList.push({
                    index: i + 1,
                    filename: filename,
                    type: fileType,
                    downloaded: true
                });
                
                // Click download
                downloadLink.click();
                downloadCount++;
                console.log('  📥 Downloaded!');
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                console.log('  ❌ No download link appeared after clicking dropdown');
                
                // Try manual search one more time
                const allLinks = document.querySelectorAll('a');
                console.log(`  Final check: ${allLinks.length} links in document`);
                for (const link of allLinks) {
                    if (link.textContent?.includes('Download')) {
                        console.log(`    Found but too late: "${link.textContent}"`);
                    }
                }
                
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
        
        // Process all message blocks
        const messageBlocks = container.children;
        
        for (let i = 0; i < messageBlocks.length; i++) {
            const block = messageBlocks[i];
            
            // Skip if not a message block
            if (!block.querySelector('[class*="font-user-message"], [class*="font-claude-message"]')) {
                continue;
            }
            
            // Find message content
            const messageElement = block.querySelector('div[class*="whitespace-pre-wrap"]') || 
                                 block.querySelector('div.prose') ||
                                 block.querySelector('div[class*="text-text-"]');
            
            if (messageElement && messageElement.textContent?.trim()) {
                messageCount++;
                
                // Determine role
                const isUser = block.querySelector('[class*="font-user-message"]');
                const role = isUser ? 'user' : 'assistant';
                
                conversation.push({
                    index: messageCount,
                    role: role,
                    content: messageElement.textContent.trim()
                });
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