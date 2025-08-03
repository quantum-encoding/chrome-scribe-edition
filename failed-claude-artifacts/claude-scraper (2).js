// Claude Conversation Scraper
// Run this in the browser console on a Claude conversation page

(function() {
    'use strict';
    
    console.log('🚀 Claude Conversation Scraper Starting...');
    
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
    
    // Claude seems to use even indices for actual messages
    for (let i = 1; i <= container.children.length; i++) {
        try {
            // Try the specific XPath pattern
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
                    // Check parent elements for role indicators
                    const parentText = messageElement.parentElement?.parentElement?.parentElement?.textContent || '';
                    
                    if (parentText.includes('Human') || parentText.includes('You')) {
                        role = 'user';
                    } else if (parentText.includes('Assistant') || parentText.includes('Claude')) {
                        role = 'assistant';
                    } else {
                        // Fallback: Claude usually alternates, with user messages having the special class
                        role = 'assistant';
                    }
                }
                
                // Extract text content
                const textContent = messageElement.innerText || messageElement.textContent || '';
                
                // Extract code blocks if any
                const codeBlocks = [];
                const preElements = messageElement.querySelectorAll('pre');
                preElements.forEach(pre => {
                    const codeElement = pre.querySelector('code');
                    if (codeElement) {
                        // Try to detect language from class
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
                    codeBlocks: codeBlocks
                });
                
                console.log(`Found message ${messageCount}: ${role} - ${textContent.substring(0, 50)}...`);
            }
        } catch (error) {
            // Continue if a specific index doesn't match the pattern
            continue;
        }
    }
    
    console.log(`\n✅ Found ${conversation.length} messages`);
    
    // Get conversation title from page
    function getConversationTitle() {
        // Try to get from page title
        const titleElement = document.querySelector('title');
        if (titleElement && titleElement.textContent) {
            const title = titleElement.textContent.replace(' - Claude', '').trim();
            if (title && title !== 'Claude') {
                return title;
            }
        }
        
        // Try to get from first user message
        const firstUserMessage = conversation.find(msg => msg.role === 'user');
        if (firstUserMessage) {
            return firstUserMessage.content.substring(0, 50).trim() + '...';
        }
        
        return `Claude Conversation ${new Date().toLocaleDateString()}`;
    }
    
    // Sanitize filename
    function sanitizeFilename(filename) {
        return filename
            .replace(/[<>:"/\\|?*]/g, '-')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 200);
    }
    
    // Export functions
    window.claudeConversation = conversation;
    
    // Download as JSON
    function downloadJSON() {
        const title = getConversationTitle();
        const exportData = {
            metadata: {
                source: 'Claude',
                exportDate: new Date().toISOString(),
                messageCount: conversation.length,
                url: window.location.href,
                title: title
            },
            conversation: conversation
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportLink = document.createElement('a');
        exportLink.setAttribute('href', dataUri);
        exportLink.setAttribute('download', `${sanitizeFilename(title)}.json`);
        document.body.appendChild(exportLink);
        exportLink.click();
        document.body.removeChild(exportLink);
    }
    
    // Download as Markdown
    function downloadMarkdown() {
        const title = getConversationTitle();
        let markdown = `# ${title}\n\n`;
        markdown += `> **URL:** ${window.location.href}\n`;
        markdown += `> **Exported:** ${new Date().toLocaleString()}\n`;
        markdown += `> **Messages:** ${conversation.length}\n\n`;
        markdown += '---\n\n';
        
        conversation.forEach(msg => {
            const roleEmoji = msg.role === 'user' ? '👤' : '🤖';
            markdown += `## ${roleEmoji} ${msg.role === 'user' ? 'Human' : 'Claude'}\n\n`;
            markdown += msg.content + '\n\n';
            
            if (msg.codeBlocks && msg.codeBlocks.length > 0) {
                msg.codeBlocks.forEach(block => {
                    markdown += `\`\`\`${block.language}\n${block.code}\n\`\`\`\n\n`;
                });
            }
            
            markdown += '---\n\n';
        });
        
        const dataUri = 'data:text/markdown;charset=utf-8,'+ encodeURIComponent(markdown);
        const exportLink = document.createElement('a');
        exportLink.setAttribute('href', dataUri);
        exportLink.setAttribute('download', `${sanitizeFilename(title)}.md`);
        document.body.appendChild(exportLink);
        exportLink.click();
        document.body.removeChild(exportLink);
    }
    
    // Download as plain text
    function downloadText() {
        const title = getConversationTitle();
        let text = `${title.toUpperCase()}\n`;
        text += '='.repeat(title.length) + '\n\n';
        text += `URL: ${window.location.href}\n`;
        text += `Exported: ${new Date().toLocaleString()}\n`;
        text += `Messages: ${conversation.length}\n\n`;
        text += '='.repeat(50) + '\n\n';
        
        conversation.forEach(msg => {
            text += `[${msg.role.toUpperCase()}]:\n`;
            text += msg.content + '\n';
            
            if (msg.codeBlocks && msg.codeBlocks.length > 0) {
                msg.codeBlocks.forEach(block => {
                    text += `\n--- CODE (${block.language}) ---\n`;
                    text += block.code + '\n`;
                    text += '--- END CODE ---\n';
                });
            }
            
            text += '\n' + '-'.repeat(50) + '\n\n';
        });
        
        const dataUri = 'data:text/plain;charset=utf-8,'+ encodeURIComponent(text);
        const exportLink = document.createElement('a');
        exportLink.setAttribute('href', dataUri);
        exportLink.setAttribute('download', `${sanitizeFilename(title)}.txt`);
        document.body.appendChild(exportLink);
        exportLink.click();
        document.body.removeChild(exportLink);
    }
    
    // Make functions globally available
    window.downloadClaudeJSON = downloadJSON;
    window.downloadClaudeMarkdown = downloadMarkdown;
    window.downloadClaudeText = downloadText;
    
    // Auto-save based on format selection (for extension integration)
    const selectedFormat = window.__AI_CHRONICLE_FORMAT__ || 'md';
    console.log(`\n🚀 Auto-saving conversation as ${selectedFormat.toUpperCase()}...`);
    
    switch(selectedFormat) {
        case 'json':
            downloadJSON();
            break;
        case 'txt':
            downloadText();
            break;
        case 'md':
        default:
            downloadMarkdown();
            break;
    }
    
    console.log('✅ Download complete!');
    console.log('\n📥 Manual download options:');
    console.log('   - JSON: downloadClaudeJSON()');
    console.log('   - Markdown: downloadClaudeMarkdown()');
    console.log('   - Plain Text: downloadClaudeText()');
    console.log('\n💡 Access raw data: window.claudeConversation');
    
})();