// Claude Scraper - Exact recreation of v3 that worked
(async function() {
    'use strict';
    
    console.log('🚀 Claude Scraper (Exact V3 Recreation)\n');
    
    // Get conversation name
    const conversationName = getConversationName();
    console.log(`Processing: ${conversationName}`);
    
    // Extract conversation
    const conversation = extractConversation();
    console.log(`✅ Found ${conversation.length} messages`);
    
    // Process artifacts
    console.log('\n📋 Looking for artifacts...');
    
    const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
    console.log(`Found ${artifactButtons.length} artifacts`);
    
    const artifactsList = [];
    let downloadCount = 0;
    
    // Process each artifact
    for (let i = 0; i < artifactButtons.length; i++) {
        console.log(`\nProcessing artifact ${i + 1}/${artifactButtons.length}`);
        
        // Click the artifact button to open the preview
        artifactButtons[i].click();
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Find the dropdown arrow button next to the copy button
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
        
        // Small wait for menu to be interactive - EXACTLY 300ms like v3
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Direct search for download links - they're already in the DOM
        let downloadLink = null;
        
        // Search all links in the document for "Download as" pattern
        const allLinks = document.querySelectorAll('a');
        for (const link of allLinks) {
            const text = link.textContent || '';
            const href = link.getAttribute('href') || '';
            const downloadAttr = link.getAttribute('download') || '';
            
            // Check if this is a download link
            if (text.includes('Download as') || 
                (href.includes('blob:') && downloadAttr)) {
                downloadLink = link;
                console.log(`  ✅ Found download link: "${text}"`);
                break;
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
        }
        
        // Close the panel by clicking outside or close button
        const closeButton = panel.querySelector('button[aria-label="Close"]');
        if (closeButton) {
            closeButton.click();
        } else {
            document.body.click();
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Create and download markdown
    const markdown = createMarkdown(conversationName, conversation, artifactsList);
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
    console.log(`Downloaded ${downloadCount}/${artifactButtons.length} artifacts`);
    
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
    
    function createMarkdown(conversationName, conversation, artifactsList) {
        let markdown = `# ${conversationName}\n\n`;
        markdown += `> **URL:** ${window.location.href}\n`;
        markdown += `> **Exported:** ${new Date().toLocaleString()}\n`;
        markdown += `> **Messages:** ${conversation.length}\n`;
        markdown += `> **Artifacts found:** ${artifactsList.length}\n`;
        markdown += `> **Artifacts downloaded:** ${artifactsList.filter(a => a.downloaded).length}\n\n`;
        
        // Add artifacts list if any were found
        if (artifactsList.length > 0) {
            markdown += '## Artifacts\n\n';
            artifactsList.forEach(artifact => {
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
            markdown += msg.content + '\n\n';
            markdown += '---\n\n';
        });
        
        return markdown;
    }
    
})();