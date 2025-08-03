// Claude Universal Scraper - Captures conversation and artifacts using all available methods
(async function() {
    'use strict';
    
    console.log('🚀 Claude Universal Scraper\n');
    
    // Get conversation name
    const conversationName = getConversationName();
    console.log(`Processing: ${conversationName}`);
    
    // Extract conversation
    const conversation = await extractConversation();
    console.log(`✅ Found ${conversation.messages.length} messages`);
    
    // Find artifacts using multiple methods
    console.log('\nSearching for artifacts...');
    const artifacts = await findAndExtractArtifacts();
    console.log(`✅ Found ${artifacts.length} artifacts`);
    
    // Create combined markdown
    let markdown = `# ${conversationName}\n\n`;
    markdown += `> **URL:** ${window.location.href}\n`;
    markdown += `> **Exported:** ${new Date().toLocaleString()}\n`;
    markdown += `> **Messages:** ${conversation.messages.length}\n`;
    markdown += `> **Artifacts:** ${artifacts.length}\n\n`;
    
    // Add artifacts summary if any
    if (artifacts.length > 0) {
        markdown += '## Artifacts Summary\n\n';
        artifacts.forEach((artifact, idx) => {
            markdown += `${idx + 1}. **${artifact.title}** - \`${artifact.filename}\`\n`;
        });
        markdown += '\n';
    }
    
    markdown += '---\n\n';
    
    // Add conversation with inline artifacts
    conversation.messages.forEach(msg => {
        const roleEmoji = msg.role === 'user' ? '👤' : '🤖';
        markdown += `## ${roleEmoji} ${msg.role === 'user' ? 'Human' : 'Claude'}\n\n`;
        markdown += msg.content + '\n\n';
        
        // Add any artifacts associated with this message
        const msgArtifacts = artifacts.filter(a => a.messageIndex === msg.index);
        if (msgArtifacts.length > 0) {
            msgArtifacts.forEach(artifact => {
                markdown += `### 📎 Artifact: ${artifact.title}\n\n`;
                markdown += `**Filename:** \`${artifact.filename}\`\n\n`;
                markdown += '```' + artifact.filename.split('.').pop() + '\n';
                markdown += artifact.content + '\n';
                markdown += '```\n\n';
            });
        }
        
        markdown += '---\n\n';
    });
    
    // Download the complete file
    downloadMarkdown(markdown, sanitizeFilename(conversationName));
    
    console.log('\n✅ Complete!');
    console.log(`Downloaded conversation with ${artifacts.length} artifacts inline`);
    
    // Helper functions
    function getConversationName() {
        // Try multiple methods
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
    
    async function extractConversation() {
        const messages = [];
        let messageIndex = 0;
        
        // Find conversation container
        const container = document.evaluate(
            '/html/body/div[4]/div[2]/div/div[1]/div/div/div[1]',
            document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
        ).singleNodeValue;
        
        if (!container) {
            console.error('Could not find conversation container');
            return { messages: [] };
        }
        
        // Process all message blocks
        const messageBlocks = container.querySelectorAll('[class*="font-user-message"], [class*="font-claude-message"], [class*="font-claude-response"]');
        
        messageBlocks.forEach(block => {
            const isUser = block.className.includes('font-user-message');
            const role = isUser ? 'user' : 'assistant';
            
            // Find the actual message content
            let content = '';
            const textElements = block.querySelectorAll('p, div[class*="whitespace-pre-wrap"]');
            textElements.forEach(el => {
                if (el.textContent) {
                    content += el.textContent + '\n';
                }
            });
            
            if (content.trim()) {
                messages.push({
                    index: ++messageIndex,
                    role: role,
                    content: content.trim()
                });
            }
        });
        
        return { messages };
    }
    
    async function findAndExtractArtifacts() {
        const artifacts = [];
        
        // Method 1: Look for Preview contents buttons
        let artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
        
        // Method 2: If no preview buttons, look for View buttons
        if (artifactButtons.length === 0) {
            const allButtons = Array.from(document.querySelectorAll('button'));
            artifactButtons = allButtons.filter(btn => 
                btn.textContent?.includes('View') || 
                btn.textContent?.includes('Preview')
            );
        }
        
        console.log(`Found ${artifactButtons.length} artifact buttons`);
        
        // Process each artifact
        for (let i = 0; i < artifactButtons.length; i++) {
            console.log(`\nProcessing artifact ${i + 1}/${artifactButtons.length}`);
            
            // Click to open
            artifactButtons[i].click();
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Find the panel
            const panel = document.querySelector('[class*="basis-0"]') || 
                         document.querySelector('[role="dialog"]') ||
                         document.evaluate('/html/body/div[4]/div[2]/div/div[3]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            
            if (panel) {
                // Get title
                const titleElement = panel.querySelector('h1, h2, h3, [class*="font-bold"], [class*="font-semibold"]');
                const title = titleElement?.textContent?.trim() || `artifact_${i + 1}`;
                
                // Try to get content from the panel directly
                let content = '';
                const codeElements = panel.querySelectorAll('pre, code, [class*="code"], [class*="whitespace-pre"]');
                codeElements.forEach(el => {
                    if (el.textContent) {
                        content += el.textContent;
                    }
                });
                
                if (content) {
                    // Determine file extension
                    let ext = 'txt';
                    if (content.includes('def ') || content.includes('import ')) ext = 'py';
                    else if (content.includes('function ') || content.includes('const ')) ext = 'js';
                    else if (content.includes('# ') && content.includes('## ')) ext = 'md';
                    else if (content.includes('<!DOCTYPE') || content.includes('<html')) ext = 'html';
                    
                    artifacts.push({
                        title: title,
                        filename: `${sanitizeFilename(title)}.${ext}`,
                        content: content,
                        messageIndex: Math.ceil((i + 1) * 2) // Approximate message index
                    });
                    
                    console.log(`  ✅ Extracted ${content.length} chars`);
                } else {
                    console.log('  ❌ Could not extract content');
                }
                
                // Close panel
                const closeButton = panel.querySelector('button[aria-label="Close"]');
                if (closeButton) {
                    closeButton.click();
                } else {
                    document.body.click();
                }
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                console.log('  ❌ Panel not found');
            }
        }
        
        return artifacts;
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