// ChatGPT Auto-Capture Debug Script - Test with 5 conversations
// Run this in the browser console on ChatGPT main page

(function() {
    'use strict';
    
    console.log('🔍 ChatGPT Auto-Capture Debug Starting (5 conversations max)...');
    
    // Configuration
    const DELAY_BETWEEN_CHATS = 2000; // 2 seconds between each chat
    const MAX_CONVERSATIONS = 5; // Debug limit
    
    // Get the conversation list container
    console.log('Looking for navigation container...');
    const navXPath = '/html/body/div[1]/div/div[1]/div[1]/div/div[2]/nav';
    const navResult = document.evaluate(navXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    let navContainer = navResult.singleNodeValue;
    
    if (!navContainer) {
        console.log('XPath failed, trying CSS selector...');
        navContainer = document.querySelector('nav');
    }
    
    if (!navContainer) {
        console.error('❌ Could not find conversation navigation');
        return;
    }
    
    console.log('✅ Found navigation container:', navContainer);
    
    // Get conversation links
    function getConversationLinks() {
        console.log('Getting conversation links...');
        
        // Try multiple selectors
        let links = Array.from(navContainer.querySelectorAll('a[href^="/c/"]'));
        console.log(`Found ${links.length} links with href^="/c/"`);
        
        if (links.length === 0) {
            links = Array.from(navContainer.querySelectorAll('aside a'));
            console.log(`Found ${links.length} links in aside`);
        }
        
        if (links.length === 0) {
            links = Array.from(navContainer.querySelectorAll('a'));
            console.log(`Found ${links.length} total links`);
        }
        
        return links;
    }
    
    // Extract conversation data without eval
    function extractConversation() {
        const conversationContainer = document.querySelector('div[class*="thread"]');
        if (!conversationContainer) {
            console.warn('No conversation container found');
            return null;
        }
        
        const articles = conversationContainer.querySelectorAll('article');
        console.log(`Found ${articles.length} messages in conversation`);
        const conversation = [];
        
        articles.forEach((article, index) => {
            let contentElement = article.querySelector('div > div > div.flex.max-w-full.flex-col.grow');
            if (!contentElement) {
                contentElement = article.querySelector('div > div > div:first-child');
            }
            if (!contentElement || !contentElement.textContent.trim()) {
                const allDivs = article.querySelectorAll('div');
                for (const div of allDivs) {
                    if (div.textContent.trim() && div.children.length < 5) {
                        contentElement = div;
                        break;
                    }
                }
            }
            
            if (!contentElement) return;
            
            const articleText = article.textContent || '';
            let role = 'unknown';
            
            if (articleText.startsWith('You said:')) {
                role = 'user';
            } else if (articleText.startsWith('ChatGPT said:')) {
                role = 'assistant';
            } else {
                role = index % 2 === 0 ? 'user' : 'assistant';
            }
            
            const textContent = contentElement.innerText || contentElement.textContent || '';
            const codeBlocks = [];
            const preElements = article.querySelectorAll('pre');
            preElements.forEach(pre => {
                const codeElement = pre.querySelector('code');
                if (codeElement) {
                    const languageMatch = codeElement.className.match(/language-(\w+)/);
                    const language = languageMatch ? languageMatch[1] : 'unknown';
                    codeBlocks.push({
                        language: language,
                        code: codeElement.textContent.trim()
                    });
                }
            });
            
            conversation.push({
                index: index + 1,
                role: role,
                content: textContent.trim(),
                codeBlocks: codeBlocks
            });
        });
        
        return conversation;
    }
    
    // Get conversation title
    function getConversationTitle() {
        const titleElement = document.querySelector('title');
        if (titleElement && titleElement.textContent && !titleElement.textContent.includes('ChatGPT')) {
            return titleElement.textContent.trim();
        }
        
        const h1Elements = document.querySelectorAll('h1');
        for (const h1 of h1Elements) {
            const text = h1.textContent.trim();
            if (text && text.length > 3 && text.length < 100) {
                return text;
            }
        }
        
        return `ChatGPT Conversation ${new Date().toLocaleDateString()}`;
    }
    
    // Sanitize filename
    function sanitizeFilename(filename) {
        return filename
            .replace(/[<>:"/\\|?*]/g, '-')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 200);
    }
    
    // Download conversation as markdown
    function downloadConversation(conversation, title) {
        const sanitizedTitle = sanitizeFilename(title);
        
        let markdown = `# ${title}\n\n`;
        markdown += `> **Exported:** ${new Date().toLocaleString()}\n`;
        markdown += `> **Messages:** ${conversation.length}\n\n`;
        markdown += '---\n\n';
        
        conversation.forEach(msg => {
            const roleEmoji = msg.role === 'user' ? '👤' : '🤖';
            markdown += `## ${roleEmoji} ${msg.role === 'user' ? 'User' : 'ChatGPT'}\n\n`;
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
        exportLink.setAttribute('download', `${sanitizedTitle}.md`);
        document.body.appendChild(exportLink);
        exportLink.click();
        document.body.removeChild(exportLink);
        
        return sanitizedTitle;
    }
    
    // Process a single conversation
    async function processConversation(link, index) {
        console.log(`\n📄 Processing conversation ${index + 1}/${MAX_CONVERSATIONS}...`);
        console.log(`   URL: ${link.href}`);
        
        // Click the conversation link
        link.click();
        
        // Wait for conversation to load
        console.log('   Waiting for conversation to load...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get the conversation title
        const title = getConversationTitle();
        console.log(`   Title: ${title}`);
        
        // Extract conversation
        const conversation = extractConversation();
        
        if (conversation && conversation.length > 0) {
            const filename = downloadConversation(conversation, title);
            console.log(`   ✅ Downloaded: ${filename}.md (${conversation.length} messages)`);
            return { success: true, title, messages: conversation.length };
        } else {
            console.log(`   ❌ Failed to extract conversation`);
            return { success: false, title };
        }
    }
    
    // Main debug capture function
    async function debugCapture() {
        const links = getConversationLinks();
        console.log(`Total conversations found: ${links.length}`);
        
        if (links.length === 0) {
            console.error('❌ No conversation links found!');
            return;
        }
        
        const results = [];
        const conversationsToProcess = Math.min(links.length, MAX_CONVERSATIONS);
        
        console.log(`Will process first ${conversationsToProcess} conversations`);
        
        for (let i = 0; i < conversationsToProcess; i++) {
            const result = await processConversation(links[i], i);
            results.push(result);
            
            if (i < conversationsToProcess - 1) {
                console.log(`Waiting ${DELAY_BETWEEN_CHATS}ms before next conversation...`);
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CHATS));
            }
        }
        
        // Summary
        console.log('\n' + '='.repeat(80));
        console.log('🎉 DEBUG CAPTURE COMPLETE!');
        console.log('='.repeat(80));
        console.log(`Processed: ${results.length} conversations`);
        console.log(`Successful: ${results.filter(r => r.success).length}`);
        console.log(`Failed: ${results.filter(r => !r.success).length}`);
        console.log(`Total messages: ${results.reduce((sum, r) => sum + (r.messages || 0), 0)}`);
        
        console.log('\nDetailed results:');
        results.forEach((r, i) => {
            console.log(`${i + 1}. ${r.title} - ${r.success ? '✅' : '❌'} ${r.messages || 0} messages`);
        });
    }
    
    // Start
    debugCapture();
    
})();