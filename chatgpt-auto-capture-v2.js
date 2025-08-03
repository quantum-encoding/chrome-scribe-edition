// ChatGPT Auto-Capture V2 - Stores in browser storage, downloads on demand
// Run this in the browser console on ChatGPT main page

(function() {
    'use strict';
    
    console.log('🚀 ChatGPT Auto-Capture V2 Starting...');
    
    // Configuration
    const DELAY_BETWEEN_CHATS = 2000; // 2 seconds between each chat
    const SCROLL_DELAY = 1000; // 1 second for scrolling
    const STORAGE_KEY = 'chatgpt_capture_data';
    const PROGRESS_KEY = 'chatgpt_capture_progress';
    
    // Initialize or get existing capture data
    let captureData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    let captureProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{"processedUrls": []}');
    
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
        if (links.length === 0) {
            links = Array.from(navContainer.querySelectorAll('a'));
        }
        return links;
    }
    
    // Extract conversation data
    function extractConversation() {
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
    
    // Save conversation to storage
    function saveConversation(url, title, conversation) {
        captureData[url] = {
            title: title,
            url: url,
            messages: conversation,
            capturedAt: new Date().toISOString(),
            messageCount: conversation.length
        };
        
        // Save to localStorage
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(captureData));
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            // If localStorage is full, try to clear old data
            if (e.name === 'QuotaExceededError') {
                console.log('Storage full, downloading current data...');
                downloadAllConversations();
                return false;
            }
        }
    }
    
    // Process a single conversation
    async function processConversation(link, index, total) {
        const url = link.href;
        
        // Skip if already processed
        if (captureProgress.processedUrls.includes(url)) {
            console.log(`Skipping already processed: ${url}`);
            return { skipped: true };
        }
        
        console.log(`\n📄 Processing conversation ${index + 1}/${total}...`);
        console.log(`   URL: ${url}`);
        
        // Click the conversation link
        link.click();
        
        // Wait for conversation to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get the conversation title
        const title = getConversationTitle();
        console.log(`   Title: ${title}`);
        
        // Extract conversation
        const conversation = extractConversation();
        
        if (conversation && conversation.length > 0) {
            const saved = saveConversation(url, title, conversation);
            if (saved) {
                captureProgress.processedUrls.push(url);
                localStorage.setItem(PROGRESS_KEY, JSON.stringify(captureProgress));
                console.log(`   ✅ Saved: ${title} (${conversation.length} messages)`);
                return { success: true, title, messages: conversation.length };
            } else {
                console.log(`   ⚠️ Storage full - download data and clear before continuing`);
                return { success: false, title, storageError: true };
            }
        } else {
            console.log(`   ❌ Failed to extract conversation`);
            return { success: false, title };
        }
    }
    
    // Convert conversations to markdown
    function conversationToMarkdown(data) {
        let markdown = `# ${data.title}\n\n`;
        markdown += `> **URL:** ${data.url}\n`;
        markdown += `> **Captured:** ${data.capturedAt}\n`;
        markdown += `> **Messages:** ${data.messageCount}\n\n`;
        markdown += '---\n\n';
        
        data.messages.forEach(msg => {
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
        
        return markdown;
    }
    
    // Download all conversations
    function downloadAllConversations() {
        const conversations = Object.values(captureData);
        if (conversations.length === 0) {
            console.log('No conversations to download');
            return;
        }
        
        console.log(`Downloading ${conversations.length} conversations...`);
        
        // Create a combined markdown file
        let combinedMarkdown = `# ChatGPT Conversations Export\n\n`;
        combinedMarkdown += `**Total Conversations:** ${conversations.length}\n`;
        combinedMarkdown += `**Export Date:** ${new Date().toLocaleString()}\n\n`;
        combinedMarkdown += '='.repeat(80) + '\n\n';
        
        conversations.forEach(conv => {
            combinedMarkdown += conversationToMarkdown(conv);
            combinedMarkdown += '\n\n' + '='.repeat(80) + '\n\n';
        });
        
        // Download
        const dataUri = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(combinedMarkdown);
        const exportLink = document.createElement('a');
        exportLink.setAttribute('href', dataUri);
        exportLink.setAttribute('download', `chatgpt-all-conversations-${Date.now()}.md`);
        document.body.appendChild(exportLink);
        exportLink.click();
        document.body.removeChild(exportLink);
        
        console.log('✅ Download complete!');
    }
    
    // Scroll to load more conversations
    async function scrollToLoadMore() {
        const previousHeight = navContainer.scrollHeight;
        navContainer.scrollTo(0, navContainer.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, SCROLL_DELAY));
        return navContainer.scrollHeight > previousHeight;
    }
    
    // Main capture function
    async function captureAllConversations() {
        const results = [];
        let hasMoreConversations = true;
        let totalProcessed = 0;
        
        while (hasMoreConversations) {
            const links = getConversationLinks();
            let newConversationsFound = false;
            
            for (const link of links) {
                const result = await processConversation(link, totalProcessed, '?');
                
                if (!result.skipped) {
                    results.push(result);
                    totalProcessed++;
                    newConversationsFound = true;
                    
                    if (result.storageError) {
                        console.log('⚠️ Storage full - stopping capture');
                        hasMoreConversations = false;
                        break;
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CHATS));
                }
            }
            
            // Try to load more conversations
            if (hasMoreConversations && !newConversationsFound) {
                console.log('Scrolling to load more conversations...');
                const scrolled = await scrollToLoadMore();
                if (!scrolled) {
                    hasMoreConversations = false;
                }
            }
        }
        
        // Summary
        console.log('\n' + '='.repeat(80));
        console.log('🎉 AUTO-CAPTURE COMPLETE!');
        console.log('='.repeat(80));
        console.log(`Total conversations processed: ${results.length}`);
        console.log(`Currently stored: ${Object.keys(captureData).length} conversations`);
        console.log('\n📥 To download all conversations, run: downloadAllConversations()');
        console.log('🗑️ To clear storage and start fresh, run: clearCaptureData()');
    }
    
    // Clear capture data
    function clearCaptureData() {
        if (confirm('Are you sure you want to clear all captured data?')) {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(PROGRESS_KEY);
            captureData = {};
            captureProgress = { processedUrls: [] };
            console.log('✅ Capture data cleared');
        }
    }
    
    // Make functions globally available
    window.downloadAllConversations = downloadAllConversations;
    window.clearCaptureData = clearCaptureData;
    window.getCaptureStats = () => {
        console.log(`Captured: ${Object.keys(captureData).length} conversations`);
        console.log(`Total messages: ${Object.values(captureData).reduce((sum, c) => sum + c.messageCount, 0)}`);
        console.log(`Storage used: ${JSON.stringify(captureData).length} characters`);
    };
    
    // Show current status
    console.log(`\n📊 Current Status:`);
    console.log(`   Existing captures: ${Object.keys(captureData).length}`);
    console.log(`   Already processed URLs: ${captureProgress.processedUrls.length}`);
    
    // Start button
    const startButton = confirm(`Start auto-capturing ChatGPT conversations?\n\nCurrent status:\n- ${Object.keys(captureData).length} conversations already captured\n- Will skip already processed conversations\n- Data saved to browser storage (no download prompts)\n- Run downloadAllConversations() when ready`);
    
    if (startButton) {
        captureAllConversations();
    } else {
        console.log('Auto-capture cancelled');
        console.log('Run downloadAllConversations() to download existing captures');
    }
    
})();