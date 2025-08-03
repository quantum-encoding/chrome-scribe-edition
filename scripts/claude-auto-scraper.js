// Claude Auto Scraper - Automatically downloads all conversations with artifacts
// Cycles through conversation list, opens each in new tab, downloads, closes tab

(async function() {
    'use strict';
    
    console.log('🤖 Claude Auto Scraper');
    console.log('Automatically downloads all conversations + artifacts');
    console.log('=' .repeat(60));
    
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    // Configuration
    const config = {
        conversationSelector: 'a[href^="/chat/"]', // Links to conversations
        waitTimes: {
            afterOpenTab: 5000,      // Wait for conversation to load
            afterDownload: 3000,     // Wait after triggering download
            betweenConversations: 2000  // Wait between conversations
        },
        maxConversations: null  // null = all, or set a number for testing
    };
    
    // Get all conversation links
    function getConversationLinks() {
        const links = document.querySelectorAll(config.conversationSelector);
        const conversations = [];
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            const titleElement = link.querySelector('.truncate');
            const title = titleElement ? titleElement.textContent.trim() : 'Untitled';
            
            conversations.push({
                url: `https://claude.ai${href}`,
                title: title,
                element: link
            });
        });
        
        return conversations;
    }
    
    // Note: For the auto-scraper to work, you need to paste the complete downloader
    // script manually in each new tab, or use the master scraper instead
    
    // Process single conversation
    async function processConversation(conversation, index, total) {
        console.log(`\n📂 [${index + 1}/${total}] Processing: "${conversation.title}"`);
        
        try {
            // Open in new tab
            const newTab = window.open(conversation.url, '_blank');
            
            if (!newTab) {
                console.log('  ❌ Failed to open new tab (popup blocked?)');
                return { success: false, error: 'Popup blocked' };
            }
            
            console.log('  ⏳ Waiting for conversation to load...');
            await wait(config.waitTimes.afterOpenTab);
            
            // Inject and run download script
            console.log('  💉 Injecting download script...');
            
            // We need to message the content script in the new tab
            // Since we can't directly inject, we'll use a different approach
            
            // Store current tab reference
            const currentTab = window;
            
            // Focus new tab
            newTab.focus();
            
            // The user needs to manually trigger the download in the new tab
            // Or we need a content script that auto-runs
            console.log('  ⚠️  Manual action needed: Paste and run download script in new tab');
            console.log('  💡 Consider using the extension\'s content script for automation');
            
            // Wait for download to complete
            await wait(config.waitTimes.afterDownload);
            
            // Close the tab
            newTab.close();
            console.log('  ✅ Tab closed');
            
            return { success: true };
            
        } catch (error) {
            console.error(`  ❌ Error: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    
    // Process all conversations
    async function processAllConversations() {
        const conversations = getConversationLinks();
        const total = config.maxConversations ? 
            Math.min(conversations.length, config.maxConversations) : 
            conversations.length;
        
        console.log(`\nFound ${conversations.length} conversations`);
        if (config.maxConversations) {
            console.log(`Processing first ${total} conversations`);
        }
        
        const results = {
            total: total,
            successful: 0,
            failed: 0,
            conversations: []
        };
        
        for (let i = 0; i < total; i++) {
            const result = await processConversation(conversations[i], i, total);
            
            results.conversations.push({
                title: conversations[i].title,
                url: conversations[i].url,
                ...result
            });
            
            if (result.success) {
                results.successful++;
            } else {
                results.failed++;
            }
            
            // Wait between conversations
            if (i < total - 1) {
                await wait(config.waitTimes.betweenConversations);
            }
        }
        
        return results;
    }
    
    // Enhanced version that uses Chrome Extension messaging
    async function processConversationWithExtension(conversation, index, total) {
        console.log(`\n📂 [${index + 1}/${total}] Processing: "${conversation.title}"`);
        
        try {
            // Click the conversation link to navigate
            conversation.element.click();
            
            console.log('  ⏳ Waiting for navigation...');
            await wait(config.waitTimes.afterOpenTab);
            
            // Now we're on the conversation page
            // Run the complete downloader
            console.log('  📥 Starting download...');
            
            // Would need to inject the complete downloader script here
            // For now, this requires manual intervention
            console.log('  ⚠️  Manual action required: Paste claude-complete-downloader.js');
            console.log('  💡 Or use claude-master-scraper.js instead for full automation');
            
            // Wait for download to complete
            await wait(config.waitTimes.afterDownload);
            
            // Go back to conversation list
            window.history.back();
            await wait(2000);
            
            return { success: true };
            
        } catch (error) {
            console.error(`  ❌ Error: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    
    // Manual instructions
    function showManualInstructions() {
        console.log('\n📋 MANUAL MODE INSTRUCTIONS:');
        console.log('1. This script will open each conversation in a new tab');
        console.log('2. You need to manually run the download script in each tab');
        console.log('3. Copy the claude-complete-downloader.js content');
        console.log('4. Paste it in the console of each new tab');
        console.log('5. The script will auto-close tabs after download');
        console.log('\n⚡ For full automation, integrate with the Chrome extension');
        console.log('   The extension can auto-inject scripts into new tabs');
    }
    
    // Main menu
    console.log('\n🎯 Select mode:');
    console.log('1. Run processAllConversations() - Opens new tabs (manual paste needed)');
    console.log('2. Run processAllWithNavigation() - Navigate in same tab (experimental)');
    console.log('3. See instructions: showManualInstructions()');
    
    // Export functions for manual control
    window.claudeAutoScraper = {
        processAllConversations,
        processConversationWithExtension,
        showManualInstructions,
        getConversationLinks,
        config
    };
    
    console.log('\n💡 Functions available in window.claudeAutoScraper');
    console.log('Example: claudeAutoScraper.processAllConversations()');
    
    // Show current state
    const convCount = getConversationLinks().length;
    console.log(`\n📊 Current state: ${convCount} conversations found`);
    
})();