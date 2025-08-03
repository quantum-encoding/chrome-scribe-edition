// Claude Bulk Downloader - Extension-compatible version
// Downloads all conversations with artifacts sequentially

(async function() {
    'use strict';
    
    console.log('🚀 Claude Bulk Downloader');
    console.log('Downloads all conversations + artifacts sequentially');
    console.log('=' .repeat(60));
    
    // Import the complete downloader functions
    const completeDownloader = await import('./claude-complete-downloader.js').catch(() => null);
    
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    // Configuration
    const config = {
        conversationListSelector: 'a[href^="/chat/"]',
        waitTimes: {
            pageLoad: 4000,
            afterDownload: 2000,
            betweenConversations: 1500
        },
        batchSize: 5, // Process in batches to avoid overwhelming
        autoContinue: true
    };
    
    // State management
    const state = {
        conversations: [],
        currentIndex: 0,
        results: {
            successful: [],
            failed: [],
            skipped: []
        }
    };
    
    // Get conversation list
    function scanConversations() {
        const links = document.querySelectorAll(config.conversationListSelector);
        state.conversations = Array.from(links).map(link => {
            const href = link.getAttribute('href');
            const titleElement = link.querySelector('.truncate, .text-sm');
            const title = titleElement ? titleElement.textContent.trim() : 'Untitled';
            
            return {
                url: `https://claude.ai${href}`,
                href: href,
                title: title,
                processed: false
            };
        });
        
        console.log(`📊 Found ${state.conversations.length} conversations`);
        return state.conversations;
    }
    
    // Download current conversation
    async function downloadCurrentConversation() {
        console.log('📥 Downloading current conversation...');
        
        try {
            // Get conversation name
            const conversationName = getConversationName();
            console.log(`   Title: "${conversationName}"`);
            
            // Extract conversation
            const conversation = extractConversation();
            console.log(`   Messages: ${conversation.length}`);
            
            // Download artifacts
            const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
            console.log(`   Artifacts found: ${artifactButtons.length}`);
            
            const downloadedArtifacts = [];
            
            for (let i = 0; i < artifactButtons.length; i++) {
                const filename = await downloadSingleArtifact(artifactButtons[i], i, artifactButtons.length);
                if (filename) {
                    downloadedArtifacts.push(filename);
                }
                await wait(500);
            }
            
            // Create markdown
            const markdown = createMarkdown(conversationName, conversation, artifactButtons.length, downloadedArtifacts);
            const filename = sanitizeFilename(conversationName);
            
            // Download markdown
            const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}.md`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            return {
                success: true,
                filename: `${filename}.md`,
                messages: conversation.length,
                artifacts: downloadedArtifacts.length
            };
            
        } catch (error) {
            console.error('❌ Download error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Process single conversation
    async function processConversation(conversation) {
        console.log(`\n🔄 Processing: "${conversation.title}"`);
        
        try {
            // Navigate to conversation
            window.location.href = conversation.url;
            
            // Wait for page load
            await wait(config.waitTimes.pageLoad);
            
            // Download
            const result = await downloadCurrentConversation();
            
            if (result.success) {
                state.results.successful.push({
                    ...conversation,
                    ...result
                });
                console.log('✅ Download successful');
            } else {
                state.results.failed.push({
                    ...conversation,
                    ...result
                });
                console.log('❌ Download failed');
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Process error:', error);
            state.results.failed.push({
                ...conversation,
                error: error.message
            });
            return { success: false, error: error.message };
        }
    }
    
    // Process next conversation in queue
    async function processNext() {
        if (state.currentIndex >= state.conversations.length) {
            console.log('\n✅ All conversations processed!');
            showSummary();
            return;
        }
        
        const conversation = state.conversations[state.currentIndex];
        state.currentIndex++;
        
        await processConversation(conversation);
        
        // Continue to next
        if (config.autoContinue) {
            await wait(config.waitTimes.betweenConversations);
            await processNext();
        }
    }
    
    // Show summary
    function showSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 DOWNLOAD SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total conversations: ${state.conversations.length}`);
        console.log(`✅ Successful: ${state.results.successful.length}`);
        console.log(`❌ Failed: ${state.results.failed.length}`);
        console.log(`⏭️  Skipped: ${state.results.skipped.length}`);
        
        if (state.results.failed.length > 0) {
            console.log('\n❌ Failed downloads:');
            state.results.failed.forEach(conv => {
                console.log(`   - "${conv.title}": ${conv.error}`);
            });
        }
        
        console.log('\n💾 Results saved to window.bulkDownloadResults');
        window.bulkDownloadResults = state.results;
    }
    
    // Helper functions (copied from complete downloader)
    function getConversationName() {
        const nameXPath = '/html/body/div[4]/div[2]/div/div[1]/header/div[2]/div[1]/div/button/div[1]/div';
        const nameResult = document.evaluate(nameXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const nameElement = nameResult.singleNodeValue;
        
        if (nameElement && nameElement.textContent) {
            return nameElement.textContent.trim();
        }
        
        const titleElement = document.querySelector('title');
        if (titleElement && titleElement.textContent) {
            const title = titleElement.textContent.replace(' - Claude', '').trim();
            if (title && title !== 'Claude') {
                return title;
            }
        }
        
        return `Claude_Conversation_${new Date().toISOString().slice(0,19).replace(/[:-]/g,'')}`;
    }
    
    function sanitizeFilename(filename) {
        return filename
            .replace(/[<>:"/\\|?*]/g, '_')
            .replace(/\s+/g, '_')
            .replace(/_{2,}/g, '_')
            .trim()
            .substring(0, 180);
    }
    
    function extractConversation() {
        // ... (copy from claude-complete-downloader.js)
        return [];
    }
    
    function createMarkdown(name, conversation, artifactCount, artifacts) {
        // ... (copy from claude-complete-downloader.js)
        return '';
    }
    
    async function downloadSingleArtifact(button, index, total) {
        // ... (copy from claude-complete-downloader.js)
        return null;
    }
    
    // Control functions
    window.bulkDownloader = {
        start: async function() {
            console.log('🚀 Starting bulk download...');
            
            // Check if we're on conversation list page
            if (window.location.pathname === '/chats' || document.querySelector(config.conversationListSelector)) {
                scanConversations();
                state.currentIndex = 0;
                await processNext();
            } else {
                console.log('❌ Not on conversation list page');
                console.log('💡 Navigate to https://claude.ai/chats first');
            }
        },
        
        pause: function() {
            config.autoContinue = false;
            console.log('⏸️  Paused. Use bulkDownloader.resume() to continue');
        },
        
        resume: async function() {
            config.autoContinue = true;
            console.log('▶️  Resumed');
            await processNext();
        },
        
        status: function() {
            console.log(`Progress: ${state.currentIndex}/${state.conversations.length}`);
            console.log(`Successful: ${state.results.successful.length}`);
            console.log(`Failed: ${state.results.failed.length}`);
        },
        
        results: () => state.results,
        config: config
    };
    
    // Instructions
    console.log('\n📋 INSTRUCTIONS:');
    console.log('1. Make sure you\'re on the conversation list page');
    console.log('2. Run: bulkDownloader.start()');
    console.log('3. The script will navigate through each conversation');
    console.log('4. Downloads will be saved to your downloads folder');
    console.log('\n⏸️  Controls:');
    console.log('   bulkDownloader.pause() - Pause processing');
    console.log('   bulkDownloader.resume() - Resume processing');
    console.log('   bulkDownloader.status() - Check progress');
    console.log('\n💡 This version navigates in the same tab');
    console.log('   Your browser history will contain all visited conversations');
    
})();