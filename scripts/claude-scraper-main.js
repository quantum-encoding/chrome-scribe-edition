// Claude Main Scraper - Downloads conversation + all artifacts
// Used by the extension popup button

(async function() {
    'use strict';
    
    console.log('🚀 Claude Scraper - Downloading conversation + artifacts');
    
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    // Configuration
    const config = {
        conversationNameXPath: '/html/body/div[4]/div[2]/div/div[1]/header/div[2]/div[1]/div/button/div[1]/div',
        conversationContainerXPath: '/html/body/div[4]/div[2]/div/div[1]/div/div/div[1]',
        artifactButtonSelector: 'button[aria-label="Preview contents"]',
        artifactPanelSelector: '[class*="basis-0"]',
        dropdownButtonSelector: 'button[id^="radix-"]',
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
            config.conversationNameXPath,
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
    
    // Extract conversation messages
    function extractConversation() {
        const messages = [];
        const container = document.evaluate(
            config.conversationContainerXPath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        ).singleNodeValue;
        
        if (!container) {
            console.warn('Container not found');
            return messages;
        }
        
        // Process each message block
        Array.from(container.children).forEach((block, index) => {
            try {
                // Look for message content
                const messageEl = block.querySelector('[class*="whitespace-pre-wrap"]');
                if (!messageEl || !messageEl.textContent.trim()) return;
                
                // Determine role by checking for user/assistant classes
                const isUser = block.querySelector('.font-user-message') !== null;
                const role = isUser ? 'user' : 'assistant';
                
                // Check for thinking block
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
        
        console.log(`✅ Extracted ${messages.length} messages`);
        return messages;
    }
    
    // Download single artifact
    async function downloadArtifact(button, index, total) {
        console.log(`  📦 Artifact ${index + 1}/${total}`);
        
        try {
            // Click artifact button
            button.click();
            await wait(config.waitTimes.artifactPanel);
            
            // Find panel
            const panel = document.querySelector(config.artifactPanelSelector);
            if (!panel) throw new Error('Panel not found');
            
            // Find dropdown button (radix button with SVG)
            const buttons = panel.querySelectorAll(config.dropdownButtonSelector);
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
            
            // Get filename and download
            const filename = downloadLink.getAttribute('download') || `artifact_${index + 1}`;
            console.log(`    ✅ Downloading: ${filename}`);
            downloadLink.click();
            
            // Close panel
            await wait(config.waitTimes.download);
            document.body.click();
            await wait(config.waitTimes.betweenArtifacts);
            
            return filename;
            
        } catch (error) {
            console.log(`    ❌ Error: ${error.message}`);
            // Ensure panel is closed
            document.body.click();
            await wait(config.waitTimes.betweenArtifacts);
            return null;
        }
    }
    
    // Create markdown content
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
    
    // Main execution
    try {
        // Step 1: Extract conversation
        console.log('\n📝 Extracting conversation...');
        const conversationName = getConversationName();
        const messages = extractConversation();
        
        // Step 2: Download artifacts
        console.log('\n📥 Downloading artifacts...');
        const artifactButtons = document.querySelectorAll(config.artifactButtonSelector);
        console.log(`Found ${artifactButtons.length} artifacts`);
        
        const downloadedArtifacts = [];
        for (let i = 0; i < artifactButtons.length; i++) {
            const filename = await downloadArtifact(artifactButtons[i], i, artifactButtons.length);
            if (filename) downloadedArtifacts.push(filename);
        }
        
        // Step 3: Create and download markdown
        console.log('\n📄 Creating markdown file...');
        const markdown = createMarkdown(conversationName, messages, downloadedArtifacts);
        const filename = sanitizeFilename(conversationName) + '.md';
        downloadFile(markdown, filename);
        
        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('✅ Download Complete!');
        console.log(`   Conversation: ${filename}`);
        console.log(`   Messages: ${messages.length}`);
        console.log(`   Artifacts: ${downloadedArtifacts.length}/${artifactButtons.length}`);
        console.log('\n💡 Check your downloads folder');
        
        // Return result for extension
        return {
            success: true,
            filename: filename,
            messages: messages.length,
            artifacts: downloadedArtifacts.length
        };
        
    } catch (error) {
        console.error('❌ Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
    
})();