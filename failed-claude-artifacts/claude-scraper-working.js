// Claude Scraper Working - Combines conversation download with manual artifact download
(async function() {
    'use strict';
    
    console.log('🚀 Claude Scraper (Working Solution)\n');
    
    // Get conversation name
    const conversationName = getConversationName();
    console.log(`Processing: ${conversationName}`);
    
    // Extract and download conversation
    const conversation = extractConversation();
    const filename = sanitizeFilename(conversationName);
    const markdown = createMarkdown(conversationName, conversation);
    
    downloadMarkdown(markdown, filename);
    console.log(`✅ Downloaded conversation (${conversation.length} messages)`);
    
    // Now handle artifacts with manual assistance
    const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
    console.log(`\nFound ${artifactButtons.length} artifacts`);
    
    if (artifactButtons.length > 0) {
        console.log('\n📋 ARTIFACT DOWNLOAD INSTRUCTIONS:');
        console.log('The script will now open each artifact and highlight the dropdown button.');
        console.log('You need to manually click the RED dropdown button to download each artifact.\n');
        
        let currentIndex = 0;
        
        async function processNextArtifact() {
            if (currentIndex >= artifactButtons.length) {
                console.log('\n✅ All artifacts processed!');
                return;
            }
            
            console.log(`\nOpening artifact ${currentIndex + 1}/${artifactButtons.length}...`);
            
            // Click artifact button
            artifactButtons[currentIndex].click();
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Find the panel
            const panel = document.querySelector('[class*="basis-0"]') || 
                         document.evaluate('/html/body/div[4]/div[2]/div/div[3]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            
            if (panel) {
                // Find dropdown button
                const dropdownButton = Array.from(panel.querySelectorAll('button')).find(btn => {
                    const svg = btn.querySelector('svg');
                    return svg && svg.querySelector('path[d*="M14.128 7.16482"]');
                });
                
                if (dropdownButton) {
                    // Highlight the dropdown button
                    dropdownButton.style.border = '3px solid red';
                    dropdownButton.style.boxShadow = '0 0 20px red';
                    console.log('👉 CLICK THE RED DROPDOWN BUTTON NOW!');
                    
                    // Set up observer to watch for dropdown menu
                    const observer = new MutationObserver((mutations) => {
                        const downloadLink = document.querySelector('a[href^="blob:"][download]');
                        if (downloadLink && downloadLink.textContent?.includes('Download')) {
                            console.log('✅ Download link found, auto-clicking...');
                            downloadLink.click();
                            
                            // Clean up
                            observer.disconnect();
                            dropdownButton.style.border = '';
                            dropdownButton.style.boxShadow = '';
                            
                            // Close panel and continue
                            setTimeout(() => {
                                const closeBtn = panel.querySelector('button[aria-label="Close"]');
                                if (closeBtn) closeBtn.click();
                                else document.body.click();
                                
                                currentIndex++;
                                setTimeout(() => processNextArtifact(), 1000);
                            }, 500);
                        }
                    });
                    
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                } else {
                    console.log('❌ Dropdown button not found, skipping...');
                    currentIndex++;
                    processNextArtifact();
                }
            } else {
                console.log('❌ Panel not found, skipping...');
                currentIndex++;
                processNextArtifact();
            }
        }
        
        // Start artifact processing
        processNextArtifact();
    }
    
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
            .replace(/\\s+/g, '_')
            .replace(/_{2,}/g, '_')
            .trim()
            .substring(0, 180);
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
    
    function createMarkdown(conversationName, conversation) {
        let markdown = `# ${conversationName}\\n\\n`;
        markdown += `> **URL:** ${window.location.href}\\n`;
        markdown += `> **Exported:** ${new Date().toLocaleString()}\\n`;
        markdown += `> **Messages:** ${conversation.length}\\n\\n`;
        markdown += '---\\n\\n';
        
        conversation.forEach(msg => {
            const roleEmoji = msg.role === 'user' ? '👤' : '🤖';
            markdown += `## ${roleEmoji} ${msg.role === 'user' ? 'Human' : 'Claude'}\\n\\n`;
            markdown += msg.content + '\\n\\n';
            markdown += '---\\n\\n';
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