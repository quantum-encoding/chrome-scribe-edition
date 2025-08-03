// Claude Main Scraper - Wrapper that runs both conversation and artifacts scripts
// This is the main script that coordinates everything

(function() {
    'use strict';
    
    console.log('🚀 Claude Main Scraper Starting...\n');
    
    async function runFullScrape() {
        try {
            // Step 1: Download the conversation
            console.log('📝 Step 1: Downloading conversation...');
            
            // Inject and run conversation scraper
            const conversationScript = document.createElement('script');
            conversationScript.src = chrome.runtime.getURL('scripts/claude-conversation-only.js');
            document.head.appendChild(conversationScript);
            
            // Wait for conversation download
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Step 2: Download artifacts
            console.log('\n📦 Step 2: Downloading artifacts...');
            
            // Inject and run artifacts scraper
            const artifactsScript = document.createElement('script');
            artifactsScript.src = chrome.runtime.getURL('scripts/claude-artifacts-only.js');
            document.head.appendChild(artifactsScript);
            
            // Wait for artifacts to download
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            console.log('\n✅ All done! Check your downloads folder.');
            
        } catch (error) {
            console.error('Error in main scraper:', error);
        }
    }
    
    // For direct execution (when not called from extension)
    if (typeof chrome === 'undefined' || !chrome.runtime) {
        console.log('Running in direct mode - executing sub-scripts inline\n');
        
        // Run conversation scraper inline
        eval(`(${claude-conversation-only.js})()`);
        
        setTimeout(() => {
            // Run artifacts scraper inline
            eval(`(${claude-artifacts-only.js})()`);
        }, 2000);
    } else {
        // Run from extension
        runFullScrape();
    }
    
})();