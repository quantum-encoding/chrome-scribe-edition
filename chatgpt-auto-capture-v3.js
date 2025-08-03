// ChatGPT Auto-Capture V3 - Fire and forget individual downloads
// Run this in the browser console on ChatGPT main page

(function() {
    'use strict';
    
    console.log('🚀 ChatGPT Auto-Capture V3 Starting (Fire & Forget Mode)...');
    
    // Configuration
    const DELAY_BETWEEN_CHATS = 3000; // 3 seconds between each chat
    const SCROLL_DELAY = 1500; // 1.5 seconds for scrolling
    const CONVERSATION_LOAD_DELAY = 2500; // 2.5 seconds for conversation to load
    
    // Statistics tracking (just for display, not stored)
    let stats = {
        processed: 0,
        successful: 0,
        failed: 0,
        totalMessages: 0,
        startTime: Date.now()
    };
    
    // Get the conversation list container
    const navXPath = '/html/body/div[1]/div/div[1]/div[1]/div/div[2]/nav';
    const navResult = document.evaluate(navXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    let navContainer = navResult.singleNodeValue;
    
    if (!navContainer) {
        navContainer = document.querySelector('nav');
        if (!navContainer) {
            console.error('Could not find conversation navigation');
            return;
        }
    }
    
    // Get conversation links
    function getConversationLinks() {
        let links = Array.from(navContainer.querySelectorAll('a[href^="/c/"]'));
        if (links.length === 0) {
            links = Array.from(navContainer.querySelectorAll('aside a'));
        }
        return links.filter(link => link.href && link.href.includes('/c/'));
    }
    
    // Extract conversation data
    function extractConversation() {
        const conversationContainer = document.querySelector('div[class*="thread"]');
        if (!conversationContainer) return null;
        
        const articles = conversationContainer.querySelectorAll('article');
        const conversation = [];
        
        articles.forEach((article, index) => {
            try {
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
                        const language = languageMatch ? languageMatch[1] : 'plaintext';
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
            } catch (e) {
                console.warn(`Error processing message ${index}:`, e);
            }
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
        
        // Try to get from first user message
        const firstUserMsg = document.querySelector('article:first-child');
        if (firstUserMsg) {
            const text = firstUserMsg.textContent || '';
            if (text.startsWith('You said:')) {
                return text.substring(9, 60).trim() + '...';
            }
        }
        
        return `ChatGPT_${new Date().toISOString().slice(0,19).replace(/[:-]/g,'')}`;
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
    
    // Download conversation as markdown (fire and forget)
    function downloadConversation(conversation, title, url) {
        try {
            const sanitizedTitle = sanitizeFilename(title);
            const timestamp = new Date().toISOString().slice(0,19).replace(/[:-]/g,'');
            
            let markdown = `# ${title}\n\n`;
            markdown += `> **URL:** ${url}\n`;
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
            
            // Create and trigger download
            const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
            const url_blob = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url_blob;
            link.download = `${sanitizedTitle}_${timestamp}.md`;
            
            // Fire and forget - add to DOM, click, and remove after delay
            document.body.appendChild(link);
            link.click();
            
            // Clean up after a delay
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url_blob);
            }, 100);
            
            return true;
        } catch (e) {
            console.error('Download error:', e);
            return false;
        }
    }
    
    // Process a single conversation
    async function processConversation(link, index) {
        const url = link.href;
        const conversationId = url.split('/').pop();
        
        console.log(`\n📄 [${index}] Processing: ${conversationId}`);
        
        try {
            // Click the conversation link
            link.click();
            
            // Wait for conversation to load
            await new Promise(resolve => setTimeout(resolve, CONVERSATION_LOAD_DELAY));
            
            // Get the conversation title
            const title = getConversationTitle();
            console.log(`   Title: ${title}`);
            
            // Extract conversation
            const conversation = extractConversation();
            
            if (conversation && conversation.length > 0) {
                const downloaded = downloadConversation(conversation, title, url);
                if (downloaded) {
                    stats.successful++;
                    stats.totalMessages += conversation.length;
                    console.log(`   ✅ Saved: ${conversation.length} messages`);
                    return { success: true, messages: conversation.length };
                }
            }
            
            stats.failed++;
            console.log(`   ❌ Failed to extract/save conversation`);
            return { success: false };
            
        } catch (e) {
            stats.failed++;
            console.error(`   ❌ Error:`, e.message);
            return { success: false, error: e.message };
        }
    }
    
    // Scroll to load more conversations
    async function scrollToLoadMore() {
        const previousHeight = navContainer.scrollHeight;
        navContainer.scrollTo(0, navContainer.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, SCROLL_DELAY));
        const newHeight = navContainer.scrollHeight;
        return newHeight > previousHeight;
    }
    
    // Show progress
    function showProgress() {
        const elapsed = Math.floor((Date.now() - stats.startTime) / 1000);
        const rate = stats.processed > 0 ? (stats.processed / elapsed * 60).toFixed(1) : 0;
        
        console.log(`\n📊 Progress Update:`);
        console.log(`   Processed: ${stats.processed}`);
        console.log(`   Successful: ${stats.successful}`);
        console.log(`   Failed: ${stats.failed}`);
        console.log(`   Total Messages: ${stats.totalMessages}`);
        console.log(`   Elapsed: ${elapsed}s`);
        console.log(`   Rate: ${rate} conversations/minute`);
    }
    
    // Main capture function
    async function captureAllConversations() {
        console.log('Starting capture process...');
        console.log('Downloads will save automatically to your default download folder');
        console.log('Press Ctrl+C or close the tab to stop\n');
        
        const processedUrls = new Set();
        let consecutiveScrollFails = 0;
        
        while (true) {
            const links = getConversationLinks();
            let newFound = false;
            
            // Process all visible conversations
            for (const link of links) {
                if (!processedUrls.has(link.href)) {
                    processedUrls.add(link.href);
                    newFound = true;
                    stats.processed++;
                    
                    await processConversation(link, stats.processed);
                    
                    // Show progress every 10 conversations
                    if (stats.processed % 10 === 0) {
                        showProgress();
                    }
                    
                    // Wait between conversations
                    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CHATS));
                }
            }
            
            // If no new conversations found, try scrolling
            if (!newFound) {
                console.log('\n📜 Scrolling to load more conversations...');
                const scrolled = await scrollToLoadMore();
                
                if (!scrolled) {
                    consecutiveScrollFails++;
                    if (consecutiveScrollFails >= 3) {
                        console.log('\n✅ Reached the end of conversation list');
                        break;
                    }
                } else {
                    consecutiveScrollFails = 0;
                }
            }
        }
        
        // Final summary
        console.log('\n' + '='.repeat(80));
        console.log('🎉 AUTO-CAPTURE COMPLETE!');
        console.log('='.repeat(80));
        showProgress();
        console.log('\nAll conversations have been saved to your download folder.');
    }
    
    // Start immediately
    captureAllConversations().catch(e => {
        console.error('Fatal error:', e);
        showProgress();
    });
    
})();