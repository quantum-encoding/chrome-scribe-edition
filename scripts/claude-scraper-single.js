// Claude Single Conversation Scraper - Content Script
// Triggered by extension button to download current conversation + artifacts

(async function() {
    'use strict';
    
    // Only run if not already running
    if (window.claudeScraperRunning) return;
    window.claudeScraperRunning = true;
    
    console.log('🚀 Claude Single Conversation Scraper Started');
    
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    // Configuration
    const config = {
        selectors: {
            conversationName: '/html/body/div[4]/div[2]/div/div[1]/header/div[2]/div[1]/div/button/div[1]/div',
            conversationContainer: '/html/body/div[4]/div[2]/div/div[1]/div/div/div[1]',
            artifactButton: 'button[aria-label="Preview contents"]',
            artifactPanel: '[class*="basis-0"]',
            dropdownButton: 'button[id^="radix-"]'
        },
        waitTimes: {
            artifactPanel: 1500,
            dropdown: 800,
            download: 300,
            betweenArtifacts: 500
        }
    };
    
    // Get conversation name
    function getConversationName() {
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
        
        const title = document.querySelector('title')?.textContent;
        if (title && title !== 'Claude') {
            return title.replace(' - Claude', '').trim();
        }
        
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
    
    // Extract messages
    function extractMessages() {
        const messages = [];
        const container = document.evaluate(
            config.selectors.conversationContainer,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        ).singleNodeValue;
        
        if (!container) {
            console.warn('Container not found');
            return messages;
        }
        
        Array.from(container.children).forEach((block, index) => {
            try {
                const messageEl = block.querySelector('[class*="whitespace-pre-wrap"]');
                if (!messageEl || !messageEl.textContent.trim()) return;
                
                // Determine role
                const isUser = block.querySelector('.font-user-message') !== null;
                const role = isUser ? 'user' : 'assistant';
                
                // Check for thinking
                let thinking = '';
                const thinkingEl = block.querySelector('details');
                if (thinkingEl) {
                    const thinkingContent = thinkingEl.querySelector('div[class*="prose"]');
                    if (thinkingContent) {
                        thinking = thinkingContent.textContent.trim();
                    }
                }
                
                messages.push({
                    index: messages.length + 1,
                    role,
                    content: messageEl.textContent.trim(),
                    thinking
                });
                
            } catch (error) {
                console.warn(`Error processing message ${index}:`, error);
            }
        });
        
        return messages;
    }
    
    // Download artifact
    async function downloadArtifact(button, index, total) {
        console.log(`  📦 Artifact ${index + 1}/${total}`);
        
        try {
            // Click artifact
            button.click();
            await wait(config.waitTimes.artifactPanel);
            
            // Find panel
            const panel = document.querySelector(config.selectors.artifactPanel);
            if (!panel) throw new Error('Panel not found');
            
            // Find dropdown button
            const buttons = panel.querySelectorAll(config.selectors.dropdownButton);
            let dropdownBtn = null;
            
            for (const btn of buttons) {
                if (btn.querySelector('svg') && !btn.getAttribute('aria-label')?.includes('Close')) {
                    dropdownBtn = btn;
                    break;
                }
            }
            
            if (!dropdownBtn) throw new Error('Dropdown not found');
            
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
            
            if (!downloadLink) throw new Error('Download link not found');
            
            // Download
            const filename = downloadLink.getAttribute('download') || `artifact_${index + 1}`;
            console.log(`    ✅ ${filename}`);
            downloadLink.click();
            
            // Close panel
            await wait(config.waitTimes.download);
            document.body.click();
            await wait(config.waitTimes.betweenArtifacts);
            
            return filename;
            
        } catch (error) {
            console.log(`    ❌ ${error.message}`);
            document.body.click();
            await wait(config.waitTimes.betweenArtifacts);
            return null;
        }
    }
    
    // Create markdown
    function createMarkdown(name, messages, artifacts) {
        const lines = [
            `# ${name}`,
            '',
            `> **URL:** ${window.location.href}`,
            `> **Exported:** ${new Date().toLocaleString()}`,
            `> **Messages:** ${messages.length}`,
            `> **Artifacts:** ${artifacts.length}`,
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
    
    // Download file
    function downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    // Main process
    try {
        // Extract conversation
        console.log('📝 Extracting conversation...');
        const name = getConversationName();
        const messages = extractMessages();
        console.log(`✅ Found ${messages.length} messages`);
        
        // Download artifacts
        const artifactButtons = document.querySelectorAll(config.selectors.artifactButton);
        console.log(`📦 Found ${artifactButtons.length} artifacts`);
        
        const artifacts = [];
        for (let i = 0; i < artifactButtons.length; i++) {
            const filename = await downloadArtifact(artifactButtons[i], i, artifactButtons.length);
            if (filename) artifacts.push(filename);
        }
        
        // Create and download markdown
        console.log('📄 Creating markdown...');
        const markdown = createMarkdown(name, messages, artifacts);
        const filename = sanitizeFilename(name) + '.md';
        downloadFile(markdown, filename);
        
        console.log(`✅ Complete! Downloaded ${filename}`);
        
        // Send success message back to popup
        chrome.runtime.sendMessage({
            action: 'scrapingComplete',
            type: 'single',
            success: true,
            filename: filename,
            messages: messages.length,
            artifacts: artifacts.length
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        
        // Send error message back to popup
        chrome.runtime.sendMessage({
            action: 'scrapingComplete',
            type: 'single',
            success: false,
            error: error.message
        });
    }
    
    // Clean up
    window.claudeScraperRunning = false;
    
})();