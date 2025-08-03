// Claude Conversation Scraper V3 - Working artifact downloads
// Uses the correct Radix UI selectors for dropdown menus

(function() {
    'use strict';
    
    console.log('🚀 Claude Conversation Scraper V3 Starting...');
    
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
    
    // Process artifacts using Radix UI components
    async function processArtifacts() {
        console.log('📋 Looking for artifacts in conversation...');
        
        // Find all artifact preview buttons
        const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
        console.log(`Found ${artifactButtons.length} artifact buttons`);
        
        const artifactsList = [];
        let downloadCount = 0;
        
        // Process each artifact
        for (let i = 0; i < artifactButtons.length; i++) {
            console.log(`\nProcessing artifact ${i + 1}/${artifactButtons.length}`);
            
            // Click the artifact button to open the preview
            artifactButtons[i].click();
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Find the dropdown arrow button next to the copy button
            // Look for a button that contains an SVG and is in a radix component
            const panel = document.querySelector('div[class*="md:basis-0"]') || 
                         document.evaluate('/html/body/div[4]/div[2]/div/div[3]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            
            if (!panel) {
                console.log('  ❌ Artifact panel not found');
                continue;
            }
            
            // Find buttons in the panel
            const buttons = panel.querySelectorAll('button');
            let dropdownButton = null;
            
            // Look for the dropdown arrow button (usually has an SVG with chevron/arrow)
            for (const btn of buttons) {
                const svg = btn.querySelector('svg');
                if (svg && btn.id && btn.id.startsWith('radix-')) {
                    // Check if this button is next to a Copy button
                    const prevSibling = btn.previousElementSibling;
                    const nextSibling = btn.nextElementSibling;
                    const parentButtons = btn.parentElement?.querySelectorAll('button');
                    
                    if (parentButtons && parentButtons.length >= 2) {
                        // This is likely our dropdown button
                        dropdownButton = btn;
                        console.log(`  Found dropdown button: ${btn.id}`);
                        break;
                    }
                }
            }
            
            if (!dropdownButton) {
                console.log('  ❌ Dropdown button not found');
                continue;
            }
            
            // Click the dropdown arrow
            dropdownButton.click();
            console.log('  Clicked dropdown arrow');
            
            // Wait longer for menu to appear
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Now look for the Radix menu that appeared
            // Try multiple selectors to find the menu
            let radixMenus = document.querySelectorAll('[id^="radix-"][id$="_"]:has(a)');
            
            // If no radix menus found, try looking for any new divs with links
            if (radixMenus.length === 0) {
                console.log('  Looking for menu with alternative methods...');
                radixMenus = document.querySelectorAll('div[role="menu"], div[data-radix-popper-content-wrapper]');
            }
            let downloadLink = null;
            
            for (const menu of radixMenus) {
                const links = menu.querySelectorAll('a');
                for (const link of links) {
                    const text = link.textContent || '';
                    const href = link.getAttribute('href') || '';
                    const downloadAttr = link.getAttribute('download') || '';
                    
                    // Check if this is a download link
                    // Look for "Download as" text OR blob URLs with download attribute
                    if (text.includes('Download as') || 
                        (href.includes('blob:') && downloadAttr)) {
                        downloadLink = link;
                        console.log(`  ✅ Found download link: "${text}"`);
                        break;
                    }
                }
                if (downloadLink) break;
            }
            
            // Alternative: Look for any new links that appeared
            if (!downloadLink) {
                // Try a broader search for download links
                const allLinks = document.querySelectorAll('a');
                for (const link of allLinks) {
                    const text = link.textContent || '';
                    const href = link.getAttribute('href') || '';
                    // Look for "Download as" text pattern or blob URLs
                    if (text.includes('Download as') || 
                        (href.includes('blob:') && link.hasAttribute('download'))) {
                        downloadLink = link;
                        console.log(`  ✅ Found download link (alt method): "${text}"`);
                        break;
                    }
                }
            }
            
            // Last resort: click dropdown again if no link found
            if (!downloadLink && dropdownButton) {
                console.log('  Trying to click dropdown again...');
                dropdownButton.click();
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // Search one more time
                const finalSearch = document.querySelectorAll('a');
                for (const link of finalSearch) {
                    const text = link.textContent || '';
                    if (text.includes('Download as')) {
                        downloadLink = link;
                        console.log(`  ✅ Found download link (retry): "${text}"`);
                        break;
                    }
                }
            }
            
            if (downloadLink) {
                // Get artifact details
                const filename = downloadLink.getAttribute('download') || `artifact_${i + 1}`;
                const fileType = downloadLink.textContent.match(/Download as (\w+)/)?.[1] || 'unknown';
                
                artifactsList.push({
                    index: i + 1,
                    filename: filename,
                    type: fileType,
                    downloaded: true
                });
                
                // Click the download link
                downloadLink.click();
                downloadCount++;
                console.log('  📥 Download triggered!');
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                console.log('  ❌ No download link found');
                
                artifactsList.push({
                    index: i + 1,
                    filename: `artifact_${i + 1}`,
                    type: 'unknown',
                    downloaded: false
                });
                
                // Debug info
                console.log('  Debug - Radix menus found:', radixMenus.length);
                radixMenus.forEach((menu, idx) => {
                    console.log(`    Menu ${idx}: ${menu.id}, links: ${menu.querySelectorAll('a').length}`);
                });
            }
            
            // Close the panel by clicking outside or close button
            const closeButton = panel.querySelector('button[aria-label="Close"]');
            if (closeButton) {
                closeButton.click();
            } else {
                // Click outside
                document.body.click();
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        return { downloadCount, artifactsList };
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
    function createMarkdown(conversationName, conversation, artifactData) {
        let markdown = `# ${conversationName}\n\n`;
        markdown += `> **URL:** ${window.location.href}\n`;
        markdown += `> **Exported:** ${new Date().toLocaleString()}\n`;
        markdown += `> **Messages:** ${conversation.length}\n`;
        markdown += `> **Artifacts found:** ${artifactData.artifactsList.length}\n`;
        markdown += `> **Artifacts downloaded:** ${artifactData.downloadCount}\n\n`;
        
        // Add artifacts list if any were found
        if (artifactData.artifactsList.length > 0) {
            markdown += '## Artifacts\n\n';
            artifactData.artifactsList.forEach(artifact => {
                const status = artifact.downloaded ? '✅' : '❌';
                markdown += `${artifact.index}. ${status} **${artifact.filename}** (${artifact.type})\n`;
            });
            markdown += '\n';
        }
        
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
            console.log('\n💡 Check your downloads folder for all files');
            
        } catch (error) {
            console.error('Error:', error);
        }
    }
    
    // Run the scraper
    main();
    
})();
