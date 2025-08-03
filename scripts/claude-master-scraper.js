// Claude Master Scraper - Complete solution for downloading all conversations
// Includes conversation text + all artifacts

(async function() {
    'use strict';
    
    console.log('🎯 Claude Master Scraper v1.0');
    console.log('Complete backup solution for Claude conversations');
    console.log('=' .repeat(60));
    
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    // === CONFIGURATION ===
    const config = {
        selectors: {
            conversationList: 'a[href^="/chat/"]',
            conversationName: '/html/body/div[4]/div[2]/div/div[1]/header/div[2]/div[1]/div/button/div[1]/div',
            conversationContainer: '/html/body/div[4]/div[2]/div/div[1]/div/div/div[1]',
            artifactButton: 'button[aria-label="Preview contents"]',
            artifactPanel: '[class*="basis-0"]',
            dropdownButton: 'button[id^="radix-"]'
        },
        waitTimes: {
            pageLoad: 4000,
            artifactPanel: 1500,
            dropdown: 800,
            betweenArtifacts: 500,
            betweenConversations: 2000
        },
        mode: 'single' // 'single' or 'bulk'
    };
    
    // === CORE FUNCTIONS ===
    
    // Get conversation name
    function getConversationName() {
        // Try XPath first
        const nameResult = document.evaluate(
            config.selectors.conversationName, 
            document, 
            null, 
            XPathResult.FIRST_ORDERED_NODE_TYPE, 
            null
        );
        const nameElement = nameResult.singleNodeValue;
        
        if (nameElement?.textContent) {
            return nameElement.textContent.trim();
        }
        
        // Fallback to title
        const title = document.querySelector('title')?.textContent;
        if (title && title !== 'Claude') {
            return title.replace(' - Claude', '').trim();
        }
        
        // Default name with timestamp
        return `Claude_Conversation_${new Date().toISOString().slice(0,19).replace(/[:-]/g,'')}`;
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
    
    // Extract conversation messages
    function extractConversation() {
        const messages = [];
        const container = document.evaluate(
            config.selectors.conversationContainer,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        ).singleNodeValue;
        
        if (!container) {
            console.warn('Conversation container not found');
            return messages;
        }
        
        // Process each message block
        Array.from(container.children).forEach((block, index) => {
            try {
                const messageEl = block.querySelector('[class*="font-"][class*="-message"], .whitespace-pre-wrap');
                if (!messageEl) return;
                
                const content = messageEl.textContent.trim();
                if (!content) return;
                
                // Determine role
                const isUser = block.querySelector('.font-user-message') !== null;
                const role = isUser ? 'user' : 'assistant';
                
                // Check for thinking block
                let thinking = '';
                const thinkingEl = block.querySelector('details summary');
                if (thinkingEl && thinkingEl.textContent.includes('thinking')) {
                    const thinkingContent = block.querySelector('details > div');
                    if (thinkingContent) {
                        thinking = thinkingContent.textContent.trim();
                    }
                }
                
                messages.push({
                    index: messages.length + 1,
                    role,
                    content,
                    thinking
                });
                
            } catch (error) {
                console.warn(`Error processing message ${index}:`, error);
            }
        });
        
        return messages;
    }
    
    // Download single artifact
    async function downloadArtifact(button, index, total) {
        console.log(`  📦 Artifact ${index + 1}/${total}`);
        
        try {
            // Click to open panel
            button.click();
            await wait(config.waitTimes.artifactPanel);
            
            // Find panel
            const panel = document.querySelector(config.selectors.artifactPanel);
            if (!panel) {
                throw new Error('Panel not found');
            }
            
            // Find dropdown button
            const dropdownButtons = panel.querySelectorAll(config.selectors.dropdownButton);
            let dropdownBtn = null;
            
            for (const btn of dropdownButtons) {
                if (btn.querySelector('svg') && !btn.getAttribute('aria-label')?.includes('Close')) {
                    dropdownBtn = btn;
                    break;
                }
            }
            
            if (!dropdownBtn) {
                throw new Error('Dropdown button not found');
            }
            
            // Click dropdown
            dropdownBtn.click();
            await wait(config.waitTimes.dropdown);
            
            // Find download link
            const links = document.querySelectorAll('a');
            let downloadLink = null;
            
            for (const link of links) {
                if (link.textContent?.includes('Download as')) {
                    downloadLink = link;
                    break;
                }
            }
            
            if (!downloadLink) {
                throw new Error('Download link not found');
            }
            
            // Get filename and download
            const filename = downloadLink.getAttribute('download') || `artifact_${index + 1}`;
            console.log(`    ✅ ${filename}`);
            downloadLink.click();
            
            // Close panel
            await wait(300);
            document.body.click();
            await wait(config.waitTimes.betweenArtifacts);
            
            return filename;
            
        } catch (error) {
            console.log(`    ❌ ${error.message}`);
            // Ensure panel is closed
            document.body.click();
            await wait(config.waitTimes.betweenArtifacts);
            return null;
        }
    }
    
    // Download all artifacts
    async function downloadAllArtifacts() {
        const buttons = document.querySelectorAll(config.selectors.artifactButton);
        if (buttons.length === 0) return [];
        
        console.log(`\n📥 Downloading ${buttons.length} artifacts...`);
        const downloaded = [];
        
        for (let i = 0; i < buttons.length; i++) {
            const filename = await downloadArtifact(buttons[i], i, buttons.length);
            if (filename) downloaded.push(filename);
        }
        
        return downloaded;
    }
    
    // Create markdown file
    function createMarkdown(name, messages, artifactCount, artifacts) {
        const lines = [
            `# ${name}`,
            '',
            `> **URL:** ${window.location.href}`,
            `> **Exported:** ${new Date().toLocaleString()}`,
            `> **Messages:** ${messages.length}`,
            `> **Artifacts:** ${artifactCount} found, ${artifacts.length} downloaded`,
            ''
        ];
        
        if (artifacts.length > 0) {
            lines.push('## Downloaded Artifacts', '');
            artifacts.forEach((file, i) => {
                lines.push(`${i + 1}. \`${file}\``);
            });
            lines.push('');
        }
        
        lines.push('---', '', '## Conversation', '');
        
        messages.forEach(msg => {
            const icon = msg.role === 'user' ? '👤' : '🤖';
            const label = msg.role === 'user' ? 'Human' : 'Claude';
            
            lines.push(`### ${icon} ${label}`, '');
            
            if (msg.thinking) {
                lines.push('<details>');
                lines.push('<summary>💭 Thinking Process</summary>');
                lines.push('');
                lines.push(msg.thinking);
                lines.push('');
                lines.push('</details>', '');
            }
            
            lines.push(msg.content, '', '---', '');
        });
        
        return lines.join('\n');
    }
    
    // Download markdown file
    function downloadMarkdown(content, filename) {
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    // === MAIN FUNCTIONS ===
    
    // Download current conversation
    async function downloadCurrentConversation() {
        console.log('\n🚀 Downloading current conversation...\n');
        
        try {
            // Get conversation details
            const name = getConversationName();
            const filename = sanitizeFilename(name);
            console.log(`📄 Conversation: "${name}"`);
            
            // Extract messages
            const messages = extractConversation();
            console.log(`💬 Messages: ${messages.length}`);
            
            // Count artifacts
            const artifactCount = document.querySelectorAll(config.selectors.artifactButton).length;
            console.log(`📦 Artifacts: ${artifactCount}`);
            
            // Download artifacts
            const artifacts = await downloadAllArtifacts();
            
            // Create and download markdown
            const markdown = createMarkdown(name, messages, artifactCount, artifacts);
            downloadMarkdown(markdown, filename);
            
            console.log(`\n✅ Downloaded: ${filename}.md`);
            console.log(`   Messages: ${messages.length}`);
            console.log(`   Artifacts: ${artifacts.length}/${artifactCount}`);
            
            return {
                success: true,
                filename: `${filename}.md`,
                messages: messages.length,
                artifactsTotal: artifactCount,
                artifactsDownloaded: artifacts.length
            };
            
        } catch (error) {
            console.error('❌ Error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Get all conversations
    function getAllConversations() {
        const links = document.querySelectorAll(config.selectors.conversationList);
        return Array.from(links).map(link => ({
            title: link.querySelector('.truncate')?.textContent.trim() || 'Untitled',
            url: `https://claude.ai${link.getAttribute('href')}`,
            href: link.getAttribute('href')
        }));
    }
    
    // Download all conversations
    async function downloadAllConversations() {
        const conversations = getAllConversations();
        console.log(`\n🚀 Found ${conversations.length} conversations to download\n`);
        
        const results = {
            total: conversations.length,
            successful: [],
            failed: []
        };
        
        for (let i = 0; i < conversations.length; i++) {
            const conv = conversations[i];
            console.log(`\n[${i + 1}/${conversations.length}] Processing: "${conv.title}"`);
            
            // Navigate to conversation
            window.location.href = conv.url;
            await wait(config.waitTimes.pageLoad);
            
            // Download
            const result = await downloadCurrentConversation();
            
            if (result.success) {
                results.successful.push({ ...conv, ...result });
            } else {
                results.failed.push({ ...conv, ...result });
            }
            
            // Wait before next
            if (i < conversations.length - 1) {
                await wait(config.waitTimes.betweenConversations);
            }
        }
        
        // Show summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 DOWNLOAD COMPLETE');
        console.log('='.repeat(60));
        console.log(`Total: ${results.total}`);
        console.log(`✅ Successful: ${results.successful.length}`);
        console.log(`❌ Failed: ${results.failed.length}`);
        
        return results;
    }
    
    // === INTERFACE ===
    
    window.claudeScraper = {
        // Download current conversation
        downloadCurrent: downloadCurrentConversation,
        
        // Download all conversations (from list page)
        downloadAll: downloadAllConversations,
        
        // Get conversation list
        listConversations: getAllConversations,
        
        // Configuration
        config: config,
        
        // Manual artifact download
        downloadArtifacts: downloadAllArtifacts
    };
    
    // Auto-detect page and show appropriate options
    const isConversationPage = window.location.pathname.startsWith('/chat/');
    const isListPage = window.location.pathname === '/chats' || 
                      document.querySelector(config.selectors.conversationList);
    
    console.log('\n📋 Available Commands:');
    
    if (isConversationPage) {
        console.log('✅ claudeScraper.downloadCurrent() - Download this conversation');
        console.log('📦 claudeScraper.downloadArtifacts() - Download only artifacts');
    }
    
    if (isListPage) {
        const count = getAllConversations().length;
        console.log(`📚 claudeScraper.downloadAll() - Download all ${count} conversations`);
        console.log('📋 claudeScraper.listConversations() - List all conversations');
    }
    
    console.log('\n💡 Tip: Check console for progress and your downloads folder for files');
    
})();