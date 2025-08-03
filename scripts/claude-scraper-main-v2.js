// Claude Main Scraper V2 - Downloads conversation and artifacts
// Simplified approach based on what works

(async function() {
    'use strict';
    
    console.log('🚀 Claude Complete Scraper V2 Starting...\n');
    
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
    
    // === ARTIFACT DOWNLOAD FUNCTION (simplified) ===
    
    async function downloadAllArtifacts() {
        // First count artifacts in the conversation
        const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
        console.log(`Found ${artifactButtons.length} artifact buttons in conversation`);
        
        if (artifactButtons.length === 0) {
            console.log('No artifacts to download');
            return 0;
        }
        
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
            
            // Find dropdown button - it's the button with SVG arrow after the Copy button
            let dropdownButton = null;
            
            // Look for all buttons with radix IDs
            const buttons = panel.querySelectorAll('button[id^="radix-"]');
            for (const btn of buttons) {
                const svg = btn.querySelector('svg');
                if (svg) {
                    // Check if this SVG contains the dropdown arrow path
                    const path = svg.querySelector('path');
                    if (path && path.getAttribute('d') && path.getAttribute('d').includes('M14.128 7.16482')) {
                        dropdownButton = btn;
                        console.log(`  Found dropdown button by SVG path: ${btn.id}`);
                        break;
                    }
                }
            }
            
            // Fallback: Look for the second button in a button group
            if (!dropdownButton) {
                const allButtons = panel.querySelectorAll('button');
                for (let i = 0; i < allButtons.length; i++) {
                    const btn = allButtons[i];
                    if (btn.id && btn.id.startsWith('radix-') && btn.querySelector('svg')) {
                        // Check if there's a button before this one (Copy button)
                        if (i > 0 && allButtons[i-1].id && allButtons[i-1].id.startsWith('radix-')) {
                            dropdownButton = btn;
                            console.log(`  Found dropdown button as second radix button: ${btn.id}`);
                            break;
                        }
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
            
            // Wait for dropdown menu to appear and be interactive
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // The dropdown appears in body > div[6] > a (or similar)
            // First check the specific location you showed
            let downloadLink = document.querySelector('body > div:nth-child(6) > a[href^="blob:"]');
            
            if (!downloadLink) {
                // Check last few body > div elements for the dropdown menu
                const bodyDivs = document.querySelectorAll('body > div');
                for (let i = bodyDivs.length - 1; i >= Math.max(0, bodyDivs.length - 10); i--) {
                    const div = bodyDivs[i];
                    const link = div.querySelector('a[href^="blob:"]');
                    if (link && link.textContent && link.textContent.includes('Download as')) {
                        downloadLink = link;
                        console.log(`  ✅ Found download link in body > div[${i}]: "${link.textContent.trim()}"`);
                        break;
                    }
                }
            }
            
            // Fallback: check for any radix content with download link
            if (!downloadLink) {
                const radixContent = document.querySelector('[id^="radix-"][id$="-content-"]');
                if (radixContent) {
                    downloadLink = radixContent.querySelector('a[href^="blob:"]');
                    if (downloadLink) {
                        console.log(`  ✅ Found download link in radix content: "${downloadLink.textContent?.trim()}"`);
                    }
                }
            }
            
            // Last resort: search entire document
            if (!downloadLink) {
                const allLinks = document.querySelectorAll('a[href^="blob:"]');
                for (const link of allLinks) {
                    const text = link.textContent || '';
                    if (text.includes('Download as')) {
                        downloadLink = link;
                        console.log(`  ✅ Found download link: "${text.trim()}"`);
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