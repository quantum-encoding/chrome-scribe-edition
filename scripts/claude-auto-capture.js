// Claude Auto-Capture Script for Extension
// This script automates capturing all Claude conversations

(function() {
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
    
    // Step 5: Process conversations by opening in new tabs
    async function processConversations() {
        console.log(`\n🎯 Starting capture of ${conversationLinks.length} conversations...`);
        
        // Save conversation list to localStorage for tracking
        const captureSession = {
            total: conversationLinks.length,
            completed: 0,
            conversations: conversationLinks.map(c => ({
                url: c.url,
                title: c.title,
                status: 'pending'
            })),
            startTime: new Date().toISOString()
        };
        
        localStorage.setItem('claude_auto_capture_session', JSON.stringify(captureSession));
        
        // Create status display
        const statusDiv = document.createElement('div');
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
            <div id="capture-progress">Preparing...</div>
            <div id="capture-status" style="margin-top: 10px; font-size: 14px;"></div>
            <button id="stop-capture" style="margin-top: 10px; padding: 5px 10px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">Stop Capture</button>
        `;
        document.body.appendChild(statusDiv);
        
        // Stop button handler
        let stopRequested = false;
        document.getElementById('stop-capture').addEventListener('click', () => {
            stopRequested = true;
            console.log('⛔ Stop requested by user');
        });
        
        // Update progress display
        function updateProgress(current, total, currentTitle) {
            const percent = ((current / total) * 100).toFixed(1);
            document.getElementById('capture-progress').innerHTML = `
                Progress: ${current}/${total} (${percent}%)<br>
                Current: ${currentTitle}
            `;
            
            const timeElapsed = (Date.now() - new Date(captureSession.startTime).getTime()) / 1000;
            const avgTime = timeElapsed / Math.max(current, 1);
            const timeRemaining = avgTime * (total - current);
            
            document.getElementById('capture-status').innerHTML = `
                Time elapsed: ${Math.floor(timeElapsed / 60)}m ${Math.floor(timeElapsed % 60)}s<br>
                Est. remaining: ${Math.floor(timeRemaining / 60)}m ${Math.floor(timeRemaining % 60)}s
            `;
        }
        
        // Process each conversation
        for (let i = 0; i < conversationLinks.length; i++) {
            if (stopRequested) {
                console.log('❌ Capture stopped by user');
                break;
            }
            
            const conversation = conversationLinks[i];
            updateProgress(i, conversationLinks.length, conversation.title);
            
            console.log(`\n📝 Opening conversation ${i + 1}/${conversationLinks.length}: ${conversation.title}`);
            
            // Open in new tab
            window.open(conversation.url, '_blank');
            
            // Update session status
            captureSession.conversations[i].status = 'opened';
            captureSession.completed = i + 1;
            localStorage.setItem('claude_auto_capture_session', JSON.stringify(captureSession));
            
            // Wait a bit before opening the next one
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // Cleanup
        document.body.removeChild(statusDiv);
        localStorage.removeItem('claude_auto_capture_session');
        
        console.log('\n🎉 Auto-capture session complete!');
        console.log(`Opened ${processedCount} conversations for capture`);
        console.log('Note: Each tab needs to run the scraper manually or via extension');
        
        // Show completion message
        const completionDiv = document.createElement('div');
        completionDiv.style.cssText = statusDiv.style.cssText;
        completionDiv.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">✅ Auto-Capture Complete</h3>
            <p>Opened ${captureSession.completed} conversations in new tabs.</p>
            <p style="font-size: 14px; color: #888;">Run the Claude ZIP scraper in each tab to download.</p>
            <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 5px 10px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
        `;
        document.body.appendChild(completionDiv);
    }
    
    // Main execution
    async function main() {
        try {
            // Check if we're on the main Claude page or a conversation page
            if (window.location.pathname.includes('/chat/')) {
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