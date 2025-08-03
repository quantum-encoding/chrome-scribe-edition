// ChatGPT Conversation Scraper
// Run this in the browser console on a ChatGPT conversation page

(function() {
    'use strict';
    
    console.log('🚀 ChatGPT Conversation Scraper Starting...');
    
    // Find all article elements (conversation messages)
    const articles = document.querySelectorAll('article');
    console.log(`Found ${articles.length} messages in conversation`);
    
    const conversation = [];
    
    articles.forEach((article, index) => {
        try {
            // Get the message content - ChatGPT uses nested divs
            const contentElement = article.querySelector('div > div > div');
            if (!contentElement) {
                console.warn(`No content found in article ${index + 1}`);
                return;
            }
            
            // Extract text content
            const textContent = contentElement.innerText || contentElement.textContent || '';
            
            // Determine if this is a user or assistant message
            // ChatGPT typically alternates, with odd indices being user messages
            const role = index % 2 === 0 ? 'user' : 'assistant';
            
            // Get any code blocks if present
            const codeBlocks = article.querySelectorAll('pre code');
            const codeContent = Array.from(codeBlocks).map(block => ({
                language: block.className.replace('language-', ''),
                code: block.textContent
            }));
            
            conversation.push({
                index: index + 1,
                role: role,
                content: textContent.trim(),
                codeBlocks: codeContent,
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
        console.log(`\n[${msg.role.toUpperCase()}] (Message ${msg.index}):`);
        console.log(msg.content);
        
        if (msg.codeBlocks.length > 0) {
            msg.codeBlocks.forEach(block => {
                console.log(`\n[CODE - ${block.language}]:`);
                console.log(block.code);
            });
        }
        console.log('\n' + '-'.repeat(80));
    });
    
    // Export functions
    window.chatGPTConversation = conversation;
    
    // Download as JSON
    function downloadJSON() {
        const dataStr = JSON.stringify(conversation, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportLink = document.createElement('a');
        exportLink.setAttribute('href', dataUri);
        exportLink.setAttribute('download', `chatgpt-conversation-${Date.now()}.json`);
        document.body.appendChild(exportLink);
        exportLink.click();
        document.body.removeChild(exportLink);
    }
    
    // Download as Markdown
    function downloadMarkdown() {
        let markdown = '# ChatGPT Conversation\n\n';
        markdown += `*Exported on: ${new Date().toLocaleString()}*\n\n`;
        
        conversation.forEach(msg => {
            markdown += `## ${msg.role === 'user' ? '👤 User' : '🤖 ChatGPT'}\n\n`;
            markdown += msg.content + '\n\n';
            
            if (msg.codeBlocks.length > 0) {
                msg.codeBlocks.forEach(block => {
                    markdown += `\`\`\`${block.language}\n${block.code}\n\`\`\`\n\n`;
                });
            }
        });
        
        const dataUri = 'data:text/markdown;charset=utf-8,'+ encodeURIComponent(markdown);
        const exportLink = document.createElement('a');
        exportLink.setAttribute('href', dataUri);
        exportLink.setAttribute('download', `chatgpt-conversation-${Date.now()}.md`);
        document.body.appendChild(exportLink);
        exportLink.click();
        document.body.removeChild(exportLink);
    }
    
    // Make download functions globally available
    window.downloadChatGPTJSON = downloadJSON;
    window.downloadChatGPTMarkdown = downloadMarkdown;
    
    console.log('\n✅ Scraping Complete!');
    console.log('📥 To download the conversation:');
    console.log('   - As JSON: downloadChatGPTJSON()');
    console.log('   - As Markdown: downloadChatGPTMarkdown()');
    console.log('\n💡 The conversation data is also available in: window.chatGPTConversation');
    
})();