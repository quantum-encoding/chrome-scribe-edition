// Claude Auto-Capture Script
// This script automates capturing all Claude conversations with artifacts

(function() {
    'use strict';
    
    console.log('🚀 Claude Auto-Capture Starting...');
    
    // Configuration
    const DELAY_BETWEEN_CONVERSATIONS = 3000; // 3 seconds between conversations
    const WAIT_FOR_PAGE_LOAD = 5000; // 5 seconds for page to load
    const WAIT_FOR_SCRAPER = 10000; // 10 seconds for scraper to complete
    
    let conversationUrls = [];
    let currentIndex = 0;
    let activeWindow = null;
    
    // Step 1: Open sidebar
    async function openSidebar() {
        console.log('📂 Opening sidebar...');
        const sidebarButtonXPath = '/html/body/div[4]/div[1]/nav/div[1]/button/div/div[2]/svg';
        const sidebarButton = document.evaluate(sidebarButtonXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        
        if (sidebarButton) {
            sidebarButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            return true;
        }
        return false;
    }
    
    // Step 2: Click "All chats"
    async function clickAllChats() {
        console.log('📋 Clicking "All chats"...');
        const allChatsXPath = '/html/body/div[4]/div[1]/nav/div[2]/div[2]/div[1]/div[1]/a/div/span';
        const allChatsLink = document.evaluate(allChatsXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        
        if (allChatsLink) {
            allChatsLink.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            return true;
        }
        return false;
    }
    
    // Step 3: Click "View all" buttons to load more conversations
    async function loadAllConversations() {
        console.log('📜 Loading all conversations...');
        let foundViewAll = true;
        
        while (foundViewAll) {
            const viewAllXPath = '//button[contains(text(), "View all") or contains(text(), "VIEW ALL")]';
            const viewAllButtons = document.evaluate(viewAllXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            
            if (viewAllButtons.snapshotLength > 0) {
                console.log(`Found ${viewAllButtons.snapshotLength} "View all" buttons`);
                for (let i = 0; i < viewAllButtons.snapshotLength; i++) {
                    const button = viewAllButtons.snapshotItem(i);
                    button.click();
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            } else {
                foundViewAll = false;
            }
        }
    }
    
    // Step 4: Collect all conversation links
    function collectConversationLinks() {
        console.log('🔗 Collecting conversation links...');
        const conversations = [];
        
        // Try to find conversation links
        const linkXPath = '//a[contains(@href, "/chat/")]';
        const links = document.evaluate(linkXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        
        for (let i = 0; i < links.snapshotLength; i++) {
            const link = links.snapshotItem(i);
            const href = link.getAttribute('href');
            if (href && href.includes('/chat/') && !conversations.includes(href)) {
                // Get conversation title
                const titleElement = link.querySelector('div[class*="truncate"], div[class*="text-"]');
                const title = titleElement ? titleElement.textContent.trim() : 'Untitled';
                
                conversations.push({
                    url: href.startsWith('http') ? href : `https://claude.ai${href}`,
                    title: title
                });
            }
        }
        
        console.log(`Found ${conversations.length} conversations`);
        return conversations;
    }
    
    // Step 5: Process each conversation
    async function processConversation(conversation) {
        console.log(`\n📝 Processing: ${conversation.title}`);
        
        try {
            // Open conversation in new window
            activeWindow = window.open(conversation.url, '_blank', 'width=1200,height=800');
            
            if (!activeWindow) {
                console.error('Failed to open window - popup blocked?');
                return false;
            }
            
            // Wait for page to load
            await new Promise(resolve => setTimeout(resolve, WAIT_FOR_PAGE_LOAD));
            
            // Inject and run the ZIP scraper
            activeWindow.eval(`
                (function() {
                    // First, load JSZip
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
                    document.head.appendChild(script);
                    
                    script.onload = function() {
                        // Then run the scraper
                        ${await fetch(chrome.runtime.getURL('scripts/claude-scraper-zip.js')).then(r => r.text())}
                    };
                })();
            `);
            
            // Wait for scraper to complete
            await new Promise(resolve => setTimeout(resolve, WAIT_FOR_SCRAPER));
            
            // Close the window
            activeWindow.close();
            activeWindow = null;
            
            // Update progress
            const progress = ((currentIndex + 1) / conversationUrls.length * 100).toFixed(1);
            console.log(`✅ Completed ${currentIndex + 1}/${conversationUrls.length} (${progress}%)`);
            
            // Save progress to localStorage
            localStorage.setItem('claude_auto_capture_progress', JSON.stringify({
                total: conversationUrls.length,
                completed: currentIndex + 1,
                lastUrl: conversation.url,
                timestamp: new Date().toISOString()
            }));
            
            return true;
            
        } catch (error) {
            console.error(`Error processing conversation: ${error.message}`);
            if (activeWindow) {
                activeWindow.close();
                activeWindow = null;
            }
            return false;
        }
    }
    
    // Main execution
    async function startAutoCapture() {
        try {
            // Step 1: Open sidebar
            if (!await openSidebar()) {
                console.error('Failed to open sidebar');
                return;
            }
            
            // Step 2: Click "All chats"
            if (!await clickAllChats()) {
                console.error('Failed to click "All chats"');
                return;
            }
            
            // Step 3: Load all conversations
            await loadAllConversations();
            
            // Step 4: Collect conversation links
            const conversations = collectConversationLinks();
            conversationUrls = conversations;
            
            if (conversationUrls.length === 0) {
                console.error('No conversations found');
                return;
            }
            
            console.log(`\n🎯 Starting capture of ${conversationUrls.length} conversations...`);
            console.log('This will take approximately ' + 
                Math.ceil((conversationUrls.length * (WAIT_FOR_PAGE_LOAD + WAIT_FOR_SCRAPER + DELAY_BETWEEN_CONVERSATIONS)) / 60000) + 
                ' minutes\n');
            
            // Process each conversation
            for (currentIndex = 0; currentIndex < conversationUrls.length; currentIndex++) {
                await processConversation(conversationUrls[currentIndex]);
                
                // Delay between conversations
                if (currentIndex < conversationUrls.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CONVERSATIONS));
                }
            }
            
            console.log('\n🎉 Auto-capture complete!');
            console.log(`Successfully processed ${conversationUrls.length} conversations`);
            console.log('Check your downloads folder for the ZIP files');
            
            // Clear progress
            localStorage.removeItem('claude_auto_capture_progress');
            
        } catch (error) {
            console.error('Auto-capture error:', error);
        }
    }
    
    // Add resume capability
    function checkForResume() {
        const progress = localStorage.getItem('claude_auto_capture_progress');
        if (progress) {
            const data = JSON.parse(progress);
            const resume = confirm(`Found previous capture session:\n` +
                `Completed: ${data.completed}/${data.total}\n` +
                `Last captured: ${new Date(data.timestamp).toLocaleString()}\n\n` +
                `Do you want to resume from where you left off?`);
            
            if (resume) {
                // TODO: Implement resume logic
                console.log('Resume functionality to be implemented');
            } else {
                localStorage.removeItem('claude_auto_capture_progress');
            }
        }
    }
    
    // Check for previous session
    checkForResume();
    
    // Start the auto-capture
    startAutoCapture();
    
})();