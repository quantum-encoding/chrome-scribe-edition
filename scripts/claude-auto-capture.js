// Claude Auto-Capture Script for Extension
// This script automates capturing all Claude conversations with artifacts
// Works with the extension to download each conversation automatically

(async function() {
    'use strict';
    
    console.log('🚀 Claude Auto-Capture Starting...');
    
    let conversationLinks = [];
    let processedCount = 0;
    
    // Step 1: Open sidebar if needed
    async function ensureSidebarOpen() {
        const sidebarXPath = '/html/body/div[4]/div[1]/nav/div[2]';
        const sidebar = document.evaluate(sidebarXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        
        if (!sidebar || sidebar.offsetWidth === 0) {
            console.log('📂 Opening sidebar...');
            const sidebarButtonXPath = '/html/body/div[4]/div[1]/nav/div[1]/button';
            const sidebarButton = document.evaluate(sidebarButtonXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            
            if (sidebarButton) {
                sidebarButton.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
    
    // Step 2: Navigate to all chats
    async function navigateToAllChats() {
        console.log('📋 Navigating to all chats...');
        
        // Click on "All chats" link
        const allChatsXPath = '//a[contains(@href, "/recents") or contains(., "All chats")]';
        const allChatsLink = document.evaluate(allChatsXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        
        if (allChatsLink) {
            allChatsLink.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // Step 3: Load all conversations by clicking "View all"
    async function loadAllConversations() {
        console.log('📜 Loading all conversations...');
        let loadedMore = true;
        let totalLoaded = 0;
        
        while (loadedMore) {
            // Look for "View all" or "Load more" buttons
            const viewAllButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
                btn.textContent.toLowerCase().includes('view all') || 
                btn.textContent.toLowerCase().includes('load more') ||
                btn.textContent.toLowerCase().includes('show more')
            );
            
            if (viewAllButtons.length > 0) {
                console.log(`Found ${viewAllButtons.length} load more buttons`);
                for (const button of viewAllButtons) {
                    button.click();
                    totalLoaded++;
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            } else {
                loadedMore = false;
            }
        }
        
        console.log(`Clicked ${totalLoaded} "View all" buttons`);
    }
    
    // Step 4: Collect all conversation links
    function collectConversationLinks() {
        console.log('🔗 Collecting conversation links...');
        const links = [];
        
        // Find all conversation links
        const conversationElements = document.querySelectorAll('a[href*="/chat/"]');
        
        conversationElements.forEach(element => {
            const href = element.getAttribute('href');
            if (href && href.includes('/chat/')) {
                const fullUrl = href.startsWith('http') ? href : `https://claude.ai${href}`;
                
                // Get conversation title
                let title = 'Untitled';
                const titleElement = element.querySelector('[class*="truncate"], [class*="text-"], span');
                if (titleElement) {
                    title = titleElement.textContent.trim();
                }
                
                // Avoid duplicates
                if (!links.some(link => link.url === fullUrl)) {
                    links.push({
                        url: fullUrl,
                        title: title,
                        element: element
                    });
                }
            }
        });
        
        console.log(`Found ${links.length} unique conversations`);
        return links;
    }
    
    // Step 5: Process conversations sequentially  
    async function processConversations() {
        console.log(`\n🎯 Starting capture of ${conversationLinks.length} conversations...`);
        
        // Save state to sessionStorage for persistence across page loads
        const captureState = {
            conversations: conversationLinks,
            currentIndex: 0,
            results: [],
            startTime: new Date().toISOString()
        };
        
        sessionStorage.setItem('claudeAutoCapture', JSON.stringify(captureState));
        
        // Create status display
        const statusDiv = document.createElement('div');
        statusDiv.id = 'claude-auto-capture-status';
        statusDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #1a1a1a;
            color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: system-ui;
            min-width: 300px;
        `;
        statusDiv.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">🤖 Claude Auto-Capture</h3>
            <div id="capture-progress">Starting sequential capture...</div>
            <div id="capture-status" style="margin-top: 10px; font-size: 14px;"></div>
            <button id="stop-capture" style="margin-top: 10px; padding: 5px 10px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">Stop Capture</button>
        `;
        document.body.appendChild(statusDiv);
        
        // Stop button handler
        document.getElementById('stop-capture').addEventListener('click', () => {
            sessionStorage.removeItem('claudeAutoCapture');
            console.log('⛔ Capture stopped by user');
            window.location.href = 'https://claude.ai/chats';
        });
        
        // Navigate to first conversation
        if (conversationLinks.length > 0) {
            console.log(`Navigating to first conversation: ${conversationLinks[0].title}`);
            window.location.href = conversationLinks[0].url;
        }
    }
    
    // Handle being on a conversation page during auto-capture
    async function handleConversationPage() {
        const captureState = JSON.parse(sessionStorage.getItem('claudeAutoCapture'));
        if (!captureState) return false;
        
        console.log('📍 Auto-capture: Processing conversation page');
        
        // Update status display
        const statusDiv = document.createElement('div');
        statusDiv.id = 'claude-auto-capture-status';
        statusDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #1a1a1a;
            color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: system-ui;
            min-width: 300px;
        `;
        
        const current = captureState.currentIndex + 1;
        const total = captureState.conversations.length;
        const currentConv = captureState.conversations[captureState.currentIndex];
        
        statusDiv.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">🤖 Claude Auto-Capture</h3>
            <div>Processing: ${current}/${total}</div>
            <div style="font-size: 14px; margin-top: 5px;">${currentConv.title}</div>
            <div style="margin-top: 10px; font-size: 12px;">Downloading conversation + artifacts...</div>
        `;
        document.body.appendChild(statusDiv);
        
        // Wait for page to fully load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Inject and run the single conversation scraper
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('scripts/claude-scraper-single.js');
        document.head.appendChild(script);
        
        // Wait for download to complete
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Update state
        captureState.currentIndex++;
        captureState.results.push({
            ...currentConv,
            status: 'completed',
            timestamp: new Date().toISOString()
        });
        
        // Check if more conversations to process
        if (captureState.currentIndex < captureState.conversations.length) {
            // Save state and navigate to next
            sessionStorage.setItem('claudeAutoCapture', JSON.stringify(captureState));
            const nextConv = captureState.conversations[captureState.currentIndex];
            console.log(`Navigating to next conversation: ${nextConv.title}`);
            window.location.href = nextConv.url;
        } else {
            // All done!
            console.log('✅ All conversations processed!');
            sessionStorage.removeItem('claudeAutoCapture');
            
            // Show completion
            statusDiv.innerHTML = `
                <h3 style="margin: 0 0 10px 0;">✅ Auto-Capture Complete!</h3>
                <div>Processed: ${total} conversations</div>
                <div style="margin-top: 10px; font-size: 14px;">Check your downloads folder</div>
                <button onclick="window.location.href='https://claude.ai/chats'" style="margin-top: 10px; padding: 5px 10px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer;">Back to Chats</button>
            `;
        }
        
        return true;
    }
    
    // Main execution
    async function main() {
        try {
            // Check if we're on a conversation page during auto-capture
            if (window.location.pathname.includes('/chat/')) {
                const isAutoCapturing = await handleConversationPage();
                if (isAutoCapturing) return;
                
                console.log('📍 Currently on a conversation page');
                console.log('Please navigate to the main Claude page (https://claude.ai/) to capture all conversations');
                return;
            }
            
            // Step 1: Ensure sidebar is open
            await ensureSidebarOpen();
            
            // Step 2: Navigate to all chats
            await navigateToAllChats();
            
            // Step 3: Load all conversations
            await loadAllConversations();
            
            // Step 4: Collect links
            conversationLinks = collectConversationLinks();
            
            if (conversationLinks.length === 0) {
                console.error('No conversations found!');
                alert('No conversations found. Make sure you are on the Claude main page.');
                return;
            }
            
            // Step 5: Process conversations
            await processConversations();
            
        } catch (error) {
            console.error('Auto-capture error:', error);
            alert('Error during auto-capture: ' + error.message);
        }
    }
    
    // Start the process
    main();
    
})();