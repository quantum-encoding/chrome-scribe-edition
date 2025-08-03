// ChatGPT Auto-Capture Script - Downloads ALL conversations
// Run this in the browser console on ChatGPT main page

(function() {
    'use strict';
    
    console.log('🚀 ChatGPT Auto-Capture Starting...');
    
    // Configuration
    const DELAY_BETWEEN_CHATS = 3000; // 3 seconds between each chat
    const SCROLL_DELAY = 1000; // 1 second for scrolling
    
    // Get the conversation list container using XPath
    const navXPath = '/html/body/div[1]/div/div[1]/div[1]/div/div[2]/nav';
    const navResult = document.evaluate(navXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    let navContainer = navResult.singleNodeValue;
    
    if (!navContainer) {
        // Fallback to CSS selector
        navContainer = document.querySelector('nav');
        if (!navContainer) {
            console.error('Could not find conversation navigation. Make sure you\'re on the ChatGPT main page.');
            return;
        }
    }
    
    // Get all conversation links
    function getConversationLinks() {
        // Use XPath for conversation links
        const linkXPath = '/html/body/div[1]/div/div[1]/div[1]/div/div[2]/nav/div[2]/aside/a';
        const links = [];
        const linkResults = document.evaluate(linkXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        
        for (let i = 0; i < linkResults.snapshotLength; i++) {
            links.push(linkResults.snapshotItem(i));
        }
        
        // If no results with XPath, fallback to CSS
        if (links.length === 0) {
            return Array.from(navContainer.querySelectorAll('a[href^="/c/"]')) || 
                   Array.from(navContainer.querySelectorAll('aside a')) ||
                   Array.from(navContainer.querySelectorAll('a'));
        }
        
        return links;
    }
    
    // Load the enhanced scraper script
    const scraperScript = `
        // Enhanced ChatGPT Conversation Scraper
        (function() {
            const conversationContainer = document.querySelector('div[class*="thread"]');
            if (!conversationContainer) return null;
            
            const articles = conversationContainer.querySelectorAll('article');
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
                        const languageMatch = codeElement.className.match(/language-(\\w+)/);
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
        })();
    `;
    
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
    async function processConversation(link, index, total) {
        console.log(`\n📄 Processing conversation ${index + 1}/${total}...`);
        
        // Click the conversation link
        link.click();
        
        // Wait for conversation to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get the conversation title
        const title = getConversationTitle();
        console.log(`   Title: ${title}`);
        
        // Extract conversation using the scraper
        const conversation = eval(scraperScript);
        
        if (conversation && conversation.length > 0) {
            const filename = downloadConversation(conversation, title);
            console.log(`   ✅ Downloaded: ${filename}.md (${conversation.length} messages)`);
            return { success: true, title, messages: conversation.length };
        } else {
            console.log(`   ❌ Failed to extract conversation`);
            return { success: false, title };
        }
    }
    
    // Scroll to load more conversations
    async function scrollToLoadMore() {
        const scrollContainer = navContainer;
        const previousHeight = scrollContainer.scrollHeight;
        
        scrollContainer.scrollTo(0, scrollContainer.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, SCROLL_DELAY));
        
        return scrollContainer.scrollHeight > previousHeight;
    }
    
    // Main capture function
    async function captureAllConversations() {
        const results = [];
        const processedUrls = new Set();
        let hasMoreConversations = true;
        
        while (hasMoreConversations) {
            const links = getConversationLinks();
            let newConversationsFound = false;
            
            for (let i = 0; i < links.length; i++) {
                const link = links[i];
                const href = link.href;
                
                // Skip if already processed
                if (processedUrls.has(href)) continue;
                
                processedUrls.add(href);
                newConversationsFound = true;
                
                const result = await processConversation(link, processedUrls.size - 1, '?');
                results.push(result);
                
                // Wait between conversations
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CHATS));
            }
            
            // Try to load more conversations
            if (!newConversationsFound || !(await scrollToLoadMore())) {
                hasMoreConversations = false;
            }
        }
        
        // Summary
        console.log('\n' + '='.repeat(80));
        console.log('🎉 AUTO-CAPTURE COMPLETE!');
        console.log('='.repeat(80));
        console.log(`Total conversations processed: ${results.length}`);
        console.log(`Successful downloads: ${results.filter(r => r.success).length}`);
        console.log(`Failed: ${results.filter(r => !r.success).length}`);
        console.log(`Total messages captured: ${results.reduce((sum, r) => sum + (r.messages || 0), 0)}`);
        
        // Save summary
        const summary = results.map((r, i) => 
            `${i + 1}. ${r.title} - ${r.success ? '✅' : '❌'} ${r.messages || 0} messages`
        ).join('\n');
        
        const summaryData = 'data:text/plain;charset=utf-8,' + encodeURIComponent(
            `ChatGPT Auto-Capture Summary\n${new Date().toLocaleString()}\n\n${summary}`
        );
        const summaryLink = document.createElement('a');
        summaryLink.setAttribute('href', summaryData);
        summaryLink.setAttribute('download', `chatgpt-capture-summary-${Date.now()}.txt`);
        document.body.appendChild(summaryLink);
        summaryLink.click();
        document.body.removeChild(summaryLink);
    }
    
    // Start button
    const startButton = confirm('Start auto-capturing all ChatGPT conversations?\n\nThis will:\n- Scroll through your entire conversation list\n- Download each conversation as a Markdown file\n- May take several minutes depending on how many conversations you have');
    
    if (startButton) {
        captureAllConversations();
    } else {
        console.log('Auto-capture cancelled');
    }
    
})();