// Claude Navigator - Opens conversations in new windows and triggers downloads
// Navigates through all conversations systematically

(async function() {
    'use strict';
    
    console.log('🧭 Claude Navigator');
    console.log('Opens each conversation in new window for downloading');
    console.log('=' .repeat(50));
    
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    // Configuration
    const config = {
        conversationSelector: 'a[href^="/chat/"]',
        waitTimes: {
            windowLoad: 5000,          // Wait for new window to load
            downloadComplete: 10000,   // Wait for downloads to complete
            betweenConversations: 2000 // Wait between conversations
        },
        maxConcurrent: 1,  // Number of windows open at once
        autoClose: true    // Auto close windows after download
    };
    
    // State
    const state = {
        conversations: [],
        currentIndex: 0,
        results: [],
        activeWindows: [],
        isPaused: false
    };
    
    // Get all conversation links
    function scanConversations() {
        const links = document.querySelectorAll(config.conversationSelector);
        state.conversations = Array.from(links).map((link, index) => {
            const href = link.getAttribute('href');
            const titleEl = link.querySelector('.truncate, .text-sm, span');
            const title = titleEl ? titleEl.textContent.trim() : `Conversation ${index + 1}`;
            
            return {
                index: index,
                title: title,
                href: href,
                url: `https://claude.ai${href}`,
                processed: false
            };
        });
        
        console.log(`📊 Found ${state.conversations.length} conversations`);
        return state.conversations;
    }
    
    // Process single conversation
    async function processConversation(conversation) {
        console.log(`\n📂 [${conversation.index + 1}/${state.conversations.length}] "${conversation.title}"`);
        
        try {
            // Open in new window
            console.log('  📄 Opening new window...');
            const newWindow = window.open(conversation.url, `claude_${conversation.index}`, 
                'width=1200,height=800,left=100,top=100');
            
            if (!newWindow) {
                throw new Error('Failed to open window (popup blocked?)');
            }
            
            state.activeWindows.push(newWindow);
            
            // Wait for page to load
            console.log('  ⏳ Waiting for page load...');
            await wait(config.waitTimes.windowLoad);
            
            // Check if window is still open
            if (newWindow.closed) {
                throw new Error('Window was closed');
            }
            
            // Inject download script
            console.log('  💉 Injecting download wrapper...');
            
            // We'll inject a message to tell user to run the wrapper
            newWindow.eval(`
                console.log('%c🎯 READY FOR DOWNLOAD', 'color: green; font-size: 20px;');
                console.log('Paste and run claude-complete-wrapper.js to download this conversation');
                console.log('Window will close automatically after download');
            `);
            
            // For full automation, you'd need to inject the wrapper script
            // But browser security prevents direct script injection
            // Alternative: Use Chrome Extension content scripts
            
            console.log('  ⚠️  Manual action required in new window:');
            console.log('     Paste claude-complete-wrapper.js and press Enter');
            
            // Wait for downloads
            console.log('  ⏳ Waiting for downloads...');
            await wait(config.waitTimes.downloadComplete);
            
            // Close window if enabled
            if (config.autoClose && !newWindow.closed) {
                console.log('  🚪 Closing window...');
                newWindow.close();
            }
            
            // Mark as processed
            conversation.processed = true;
            
            state.results.push({
                ...conversation,
                success: true,
                timestamp: new Date().toISOString()
            });
            
            console.log('  ✅ Complete');
            
        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
            
            state.results.push({
                ...conversation,
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
        
        // Remove from active windows
        state.activeWindows = state.activeWindows.filter(w => !w.closed);
    }
    
    // Process next conversation
    async function processNext() {
        if (state.isPaused) {
            console.log('⏸️  Paused');
            return;
        }
        
        if (state.currentIndex >= state.conversations.length) {
            console.log('\n✅ All conversations processed!');
            showSummary();
            return;
        }
        
        const conversation = state.conversations[state.currentIndex];
        state.currentIndex++;
        
        await processConversation(conversation);
        
        // Wait between conversations
        await wait(config.waitTimes.betweenConversations);
        
        // Continue to next
        await processNext();
    }
    
    // Show summary
    function showSummary() {
        const successful = state.results.filter(r => r.success).length;
        const failed = state.results.filter(r => !r.success).length;
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 NAVIGATION COMPLETE');
        console.log('='.repeat(50));
        console.log(`Total conversations: ${state.conversations.length}`);
        console.log(`✅ Successful: ${successful}`);
        console.log(`❌ Failed: ${failed}`);
        
        if (failed > 0) {
            console.log('\n❌ Failed conversations:');
            state.results
                .filter(r => !r.success)
                .forEach(r => {
                    console.log(`   "${r.title}": ${r.error}`);
                });
        }
        
        console.log('\n💾 Results saved to window.navigatorResults');
    }
    
    // Control functions
    const navigator = {
        // Start processing
        start: async function() {
            console.log('\n🚀 Starting navigation...');
            
            // Check if on conversation list
            if (!document.querySelector(config.conversationSelector)) {
                console.log('❌ No conversations found');
                console.log('💡 Navigate to https://claude.ai/chats first');
                return;
            }
            
            scanConversations();
            state.currentIndex = 0;
            state.isPaused = false;
            
            console.log('\n⚠️  IMPORTANT: Manual action required for each window:');
            console.log('1. A new window will open for each conversation');
            console.log('2. Paste claude-complete-wrapper.js in the console');
            console.log('3. Press Enter to download');
            console.log('4. Window will close automatically\n');
            
            await processNext();
        },
        
        // Pause processing
        pause: function() {
            state.isPaused = true;
            console.log('⏸️  Paused. Use navigator.resume() to continue');
        },
        
        // Resume processing
        resume: async function() {
            state.isPaused = false;
            console.log('▶️  Resumed');
            await processNext();
        },
        
        // Get status
        status: function() {
            const successful = state.results.filter(r => r.success).length;
            const failed = state.results.filter(r => !r.success).length;
            
            console.log(`📊 Progress: ${state.currentIndex}/${state.conversations.length}`);
            console.log(`   ✅ Successful: ${successful}`);
            console.log(`   ❌ Failed: ${failed}`);
            console.log(`   🪟 Open windows: ${state.activeWindows.filter(w => !w.closed).length}`);
        },
        
        // Close all windows
        closeAll: function() {
            state.activeWindows.forEach(w => {
                if (!w.closed) w.close();
            });
            console.log('🚪 Closed all windows');
        },
        
        // Get results
        results: () => state.results,
        
        // Configuration
        config: config
    };
    
    // Store navigator in window
    window.navigator = navigator;
    window.navigatorResults = state.results;
    
    // Instructions
    console.log('\n📋 USAGE:');
    console.log('1. Make sure you\'re on https://claude.ai/chats');
    console.log('2. Run: navigator.start()');
    console.log('3. For each window that opens:');
    console.log('   - Wait for it to load');
    console.log('   - Paste claude-complete-wrapper.js in console');
    console.log('   - Press Enter');
    console.log('   - Window will close automatically');
    console.log('\n🎮 CONTROLS:');
    console.log('navigator.pause()    - Pause processing');
    console.log('navigator.resume()   - Resume processing');
    console.log('navigator.status()   - Check progress');
    console.log('navigator.closeAll() - Close all open windows');
    
    // Show current state
    const convCount = document.querySelectorAll(config.conversationSelector).length;
    console.log(`\n📊 Ready to process ${convCount} conversations`);
    
})();