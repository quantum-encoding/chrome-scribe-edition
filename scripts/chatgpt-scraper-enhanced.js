// Enhanced ChatGPT Conversation Scraper with Precise Selectors
// Run this in the browser console on a ChatGPT conversation page

(function() {
    'use strict';
    
    console.log('🚀 Enhanced ChatGPT Conversation Scraper Starting...');
    
    // More specific selector based on your examples
    const conversationContainer = document.querySelector('div[class*="thread"]');
    if (!conversationContainer) {
        console.error('Could not find conversation container. Make sure you\'re on a ChatGPT conversation page.');
        return;
    }
    
    // Find all article elements within the conversation
    const articles = conversationContainer.querySelectorAll('article');
    console.log(`Found ${articles.length} messages in conversation`);
    
    const conversation = [];
    
    articles.forEach((article, index) => {
        try {
            // Multiple strategies to find content based on ChatGPT's structure
            let contentElement = null;
            let role = 'unknown';
            
            // Strategy 1: Look for the main content div
            contentElement = article.querySelector('div > div > div.flex.max-w-full.flex-col.grow');
            
            // Strategy 2: If not found, try simpler selector
            if (!contentElement) {
                contentElement = article.querySelector('div > div > div:first-child');
            }
            
            // Strategy 3: Look for any div with actual text content
            if (!contentElement || !contentElement.textContent.trim()) {
                const allDivs = article.querySelectorAll('div');
                for (const div of allDivs) {
                    if (div.textContent.trim() && div.children.length < 5) {
                        contentElement = div;
                        break;
                    }
                }
            }
            
            if (!contentElement) {
                console.warn(`No content found in article ${index + 1}`);
                return;
            }
            
            // Better role detection - check for the specific prefixes ChatGPT uses
            const articleText = article.textContent || '';
            
            // ChatGPT prefixes messages with "You said:" or "ChatGPT said:"
            if (articleText.startsWith('You said:')) {
                role = 'user';
            } else if (articleText.startsWith('ChatGPT said:')) {
                role = 'assistant';
            } else {
                // Fallback: check for other indicators
                const hasUserAvatar = article.querySelector('[data-testid*="user"]') || 
                                    article.querySelector('img[alt*="User"]');
                const hasChatGPTAvatar = article.querySelector('[data-testid*="bot"]') || 
                                       article.querySelector('img[alt*="ChatGPT"]');
                
                if (hasUserAvatar) {
                    role = 'user';
                } else if (hasChatGPTAvatar) {
                    role = 'assistant';
                } else {
                    // Final fallback to alternating pattern
                    role = index % 2 === 0 ? 'user' : 'assistant';
                }
            }
            
            // Extract all text content
            const textContent = contentElement.innerText || contentElement.textContent || '';
            
            // Extract code blocks with better detection
            const codeBlocks = [];
            const preElements = article.querySelectorAll('pre');
            preElements.forEach(pre => {
                const codeElement = pre.querySelector('code');
                if (codeElement) {
                    // Try to detect language from class
                    const languageMatch = codeElement.className.match(/language-(\w+)/);
                    const language = languageMatch ? languageMatch[1] : 'unknown';
                    
                    codeBlocks.push({
                        language: language,
                        code: codeElement.textContent.trim()
                    });
                }
            });
            
            // Extract any inline code
            const inlineCodeElements = article.querySelectorAll('code:not(pre code)');
            const inlineCode = Array.from(inlineCodeElements).map(el => el.textContent.trim());
            
            conversation.push({
                index: index + 1,
                role: role,
                content: textContent.trim(),
                codeBlocks: codeBlocks,
                inlineCode: inlineCode,
                htmlContent: contentElement.innerHTML,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error(`Error processing article ${index + 1}:`, error);
        }
    });
    
    // Format conversation for display
    console.log('\n📝 CONVERSATION TRANSCRIPT:\n');
    console.log('=' .repeat(80));
    
    conversation.forEach(msg => {
        const roleEmoji = msg.role === 'user' ? '👤' : '🤖';
        console.log(`\n[${roleEmoji} ${msg.role.toUpperCase()}] (Message ${msg.index}):`);
        console.log(msg.content);
        
        if (msg.codeBlocks.length > 0) {
            msg.codeBlocks.forEach(block => {
                console.log(`\n[CODE - ${block.language}]:`);
                console.log(block.code);
            });
        }
        
        if (msg.inlineCode.length > 0) {
            console.log('\n[INLINE CODE]:');
            msg.inlineCode.forEach(code => console.log(`  \`${code}\``));
        }
        
        console.log('\n' + '-'.repeat(80));
    });
    
    // Export functions
    window.chatGPTConversation = conversation;
    
    // Get conversation title from page
    function getConversationTitle() {
        // Try multiple strategies to find the conversation title
        
        // Strategy 1: Look for the title in the page header
        const titleElement = document.querySelector('title');
        if (titleElement && titleElement.textContent && !titleElement.textContent.includes('ChatGPT')) {
            return titleElement.textContent.trim();
        }
        
        // Strategy 2: Look for heading elements that might contain the title
        const h1Elements = document.querySelectorAll('h1');
        for (const h1 of h1Elements) {
            const text = h1.textContent.trim();
            if (text && text.length > 3 && text.length < 100) {
                return text;
            }
        }
        
        // Strategy 3: Use the first user message as title (truncated)
        const firstUserMessage = conversation.find(msg => msg.role === 'user');
        if (firstUserMessage && firstUserMessage.content) {
            const title = firstUserMessage.content.substring(0, 50).trim();
            return title.length === 50 ? title + '...' : title;
        }
        
        // Fallback to timestamp
        return `ChatGPT Conversation ${new Date().toLocaleDateString()}`;
    }
    
    // Sanitize filename to remove invalid characters
    function sanitizeFilename(filename) {
        return filename
            .replace(/[<>:"/\\|?*]/g, '-')  // Replace invalid chars with dash
            .replace(/\s+/g, ' ')            // Replace multiple spaces with single space
            .trim()                          // Remove leading/trailing spaces
            .substring(0, 200);              // Limit length
    }
    
    // Enhanced JSON download with metadata
    function downloadJSON() {
        const conversationTitle = getConversationTitle();
        const sanitizedTitle = sanitizeFilename(conversationTitle);
        
        const exportData = {
            metadata: {
                source: 'ChatGPT',
                exportDate: new Date().toISOString(),
                messageCount: conversation.length,
                url: window.location.href,
                title: conversationTitle
            },
            conversation: conversation
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportLink = document.createElement('a');
        exportLink.setAttribute('href', dataUri);
        exportLink.setAttribute('download', `${sanitizedTitle}.json`);
        document.body.appendChild(exportLink);
        exportLink.click();
        document.body.removeChild(exportLink);
    }
    
    // Enhanced Markdown download
    function downloadMarkdown() {
        const conversationTitle = getConversationTitle();
        const sanitizedTitle = sanitizeFilename(conversationTitle);
        
        let markdown = `# ${conversationTitle}\n\n`;
        markdown += `> **URL:** ${window.location.href}\n`;
        markdown += `> **Exported:** ${new Date().toLocaleString()}\n`;
        markdown += `> **Messages:** ${conversation.length}\n\n`;
        markdown += '---\n\n';
        
        conversation.forEach(msg => {
            const roleEmoji = msg.role === 'user' ? '👤' : '🤖';
            markdown += `## ${roleEmoji} ${msg.role === 'user' ? 'User' : 'ChatGPT'}\n\n`;
            
            // Process content to preserve formatting
            let content = msg.content;
            
            // Add inline code formatting
            if (msg.inlineCode.length > 0) {
                msg.inlineCode.forEach(code => {
                    content = content.replace(code, `\`${code}\``);
                });
            }
            
            markdown += content + '\n\n';
            
            // Add code blocks
            if (msg.codeBlocks.length > 0) {
                msg.codeBlocks.forEach(block => {
                    markdown += `\`\`\`${block.language}\n${block.code}\n\`\`\`\n\n`;
                });
            }
            
            markdown += '---\n\n';
        });
        
        const dataUri = 'data:text/markdown;charset=utf-8,'+ encodeURIComponent(markdown);
        const exportLink = document.createElement('a');
        exportLink.setAttribute('href', dataUri);
        exportLink.setAttribute('download', `${sanitizedTitle}.md`);
        document.body.appendChild(exportLink);
        exportLink.click();
        document.body.removeChild(exportLink);
    }
    
    // Plain text download
    function downloadText() {
        const conversationTitle = getConversationTitle();
        const sanitizedTitle = sanitizeFilename(conversationTitle);
        
        let text = conversationTitle.toUpperCase() + '\n';
        text += '='.repeat(conversationTitle.length) + '\n\n';
        text += `URL: ${window.location.href}\n`;
        text += `Exported: ${new Date().toLocaleString()}\n`;
        text += `Total Messages: ${conversation.length}\n\n`;
        text += '='.repeat(50) + '\n\n';
        
        conversation.forEach(msg => {
            text += `[${msg.role.toUpperCase()}]:\n`;
            text += msg.content + '\n';
            
            if (msg.codeBlocks.length > 0) {
                msg.codeBlocks.forEach(block => {
                    text += `\n--- CODE (${block.language}) ---\n`;
                    text += block.code + '\n';
                    text += '--- END CODE ---\n';
                });
            }
            
            text += '\n' + '-'.repeat(50) + '\n\n';
        });
        
        const dataUri = 'data:text/plain;charset=utf-8,'+ encodeURIComponent(text);
        const exportLink = document.createElement('a');
        exportLink.setAttribute('href', dataUri);
        exportLink.setAttribute('download', `${sanitizedTitle}.txt`);
        document.body.appendChild(exportLink);
        exportLink.click();
        document.body.removeChild(exportLink);
    }
    
    // Make download functions globally available
    window.downloadChatGPTJSON = downloadJSON;
    window.downloadChatGPTMarkdown = downloadMarkdown;
    window.downloadChatGPTText = downloadText;
    
    // Summary statistics
    const userMessages = conversation.filter(m => m.role === 'user').length;
    const assistantMessages = conversation.filter(m => m.role === 'assistant').length;
    const totalCodeBlocks = conversation.reduce((sum, m) => sum + m.codeBlocks.length, 0);
    
    console.log('\n✅ Scraping Complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Total messages: ${conversation.length}`);
    console.log(`   - User messages: ${userMessages}`);
    console.log(`   - ChatGPT messages: ${assistantMessages}`);
    console.log(`   - Code blocks: ${totalCodeBlocks}`);
    console.log('\n📥 Download options:');
    console.log('   - JSON: downloadChatGPTJSON()');
    console.log('   - Markdown: downloadChatGPTMarkdown()');
    console.log('   - Plain Text: downloadChatGPTText()');
    console.log('\n💡 Access raw data: window.chatGPTConversation');
    
    // Auto-save based on selected format
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
    
    console.log('✅ File downloaded automatically!');
    
})();