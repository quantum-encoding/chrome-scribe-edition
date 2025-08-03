// Claude Main Scraper - Downloads conversation and artifacts
// This combines both scripts into one for the extension

(async function() {
    'use strict';
    
    console.log('🚀 Claude Complete Scraper Starting...\n');
    
    try {
        // Step 1: Download the conversation
        console.log('📝 Step 1: Downloading conversation...');
        
        // Get conversation name and extract conversation
        const conversationName = getConversationName();
        console.log(`Processing: ${conversationName}`);
        
        const conversation = extractConversation();
        const artifactCount = countArtifacts();
        
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
        
        console.log('✅ Conversation downloaded!');
        
        // Wait a bit before artifacts
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 2: Download artifacts
        console.log('\n📦 Step 2: Downloading artifacts...');
        
        const downloadCount = await downloadAllArtifacts();
        
        console.log(`\n✅ Complete!`);
        console.log(`Downloaded conversation: ${filename}.md`);
        console.log(`Downloaded ${downloadCount} artifacts`);
        console.log('💡 Check your downloads folder');
        
    } catch (error) {
        console.error('Error:', error);
    }
    
    // === HELPER FUNCTIONS (from conversation script) ===
    
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
    
    function countArtifacts() {
        const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
        return artifactButtons.length;
    }
    
    function createMarkdown(conversationName, conversation, artifactCount) {
        let markdown = `# ${conversationName}\n\n`;
        markdown += `> **URL:** ${window.location.href}\n`;
        markdown += `> **Exported:** ${new Date().toLocaleString()}\n`;
        markdown += `> **Messages:** ${conversation.length}\n`;
        markdown += `> **Artifacts in conversation:** ${artifactCount}\n\n`;
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
    
    // === ARTIFACT DOWNLOAD FUNCTION (from artifacts script) ===
    
    async function downloadAllArtifacts() {
        // First count artifacts in the conversation
        const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
        console.log(`Found ${artifactButtons.length} artifact buttons in conversation`);
        
        if (artifactButtons.length === 0) {
            console.log('No artifacts to download');
            return 0;
        }
        
        // Method 1: Try to download artifacts directly from conversation
        let downloadCount = 0;
        
        for (let i = 0; i < artifactButtons.length; i++) {
            console.log(`\nProcessing artifact ${i + 1}/${artifactButtons.length}`);
            
            // Click the artifact button
            artifactButtons[i].click();
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Find the panel that opened
            const panel = document.querySelector('[class*="basis-0"]') || 
                         document.evaluate('/html/body/div[4]/div[2]/div/div[3]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            
            if (!panel) {
                console.log('  ❌ Artifact panel not found');
                continue;
            }
            
            // Find dropdown button in the panel
            const buttons = panel.querySelectorAll('button');
            let dropdownButton = null;
            
            for (const btn of buttons) {
                if (btn.id && btn.id.startsWith('radix-') && btn.querySelector('svg')) {
                    const parentButtons = btn.parentElement?.querySelectorAll('button');
                    if (parentButtons && parentButtons.length >= 2) {
                        dropdownButton = btn;
                        break;
                    }
                }
            }
            
            if (!dropdownButton) {
                console.log('  ❌ Dropdown button not found');
                continue;
            }
            
            // Click dropdown
            dropdownButton.click();
            console.log('  Clicked dropdown arrow');
            
            // Small wait for menu to be interactive
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Debug: Check for dropdown menus
            const menus = document.querySelectorAll('[role="menu"], div[id^="radix-"][id*="-content-"], div[data-radix-popper-content-wrapper]');
            console.log(`  Found ${menus.length} potential dropdown menus`);
            
            // Direct search for download links - they're already in the DOM
            let downloadLink = null;
            
            // First try the direct selector approach (most reliable)
            downloadLink = document.querySelector('a[download][href^="blob:"]');
            if (downloadLink) {
                console.log(`  ✅ Found download link via selector`);
            }
            
            // If not found, search all links for "Download as" pattern
            if (!downloadLink) {
                const allLinks = document.querySelectorAll('a');
                for (const link of allLinks) {
                    const text = link.textContent || '';
                    const href = link.getAttribute('href') || '';
                    const downloadAttr = link.getAttribute('download') || '';
                    
                    // Check if this is a download link (same logic as v3)
                    if (text.includes('Download as') || 
                        (href.includes('blob:') && downloadAttr)) {
                        downloadLink = link;
                        console.log(`  ✅ Found download link: "${text}"`);
                        break;
                    }
                }
            }
            
            if (downloadLink) {
                const filename = downloadLink.getAttribute('download') || `artifact_${i + 1}`;
                console.log(`  ✅ Downloading: ${filename}`);
                downloadLink.click();
                downloadCount++;
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                console.log('  ❌ Download link not found');
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
        
        return downloadCount;
    }
    
})();