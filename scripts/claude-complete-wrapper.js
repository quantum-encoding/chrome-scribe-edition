// Claude Complete Wrapper - Runs both conversation and artifact scrapers
// Coordinates the download of conversation + artifacts

(async function() {
    'use strict';
    
    console.log('🎯 Claude Complete Download Wrapper');
    console.log('Downloads conversation + all artifacts');
    console.log('=' .repeat(50));
    
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    // Load and execute a script
    async function loadScript(scriptContent) {
        return new Promise((resolve) => {
            try {
                const result = eval(`(${scriptContent})`);
                resolve(result);
            } catch (error) {
                console.error('Script execution error:', error);
                resolve({ success: false, error: error.message });
            }
        });
    }
    
    // Conversation scraper code
    const conversationScraperCode = `
(function() {
    'use strict';
    
    // Get conversation name
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
        
        return 'Claude_Conversation_' + new Date().toISOString().slice(0,19).replace(/[:-]/g,'');
    }
    
    // Sanitize filename
    function sanitizeFilename(filename) {
        return filename
            .replace(/[<>:"/\\\\|?*]/g, '_')
            .replace(/\\s+/g, '_')
            .replace(/_{2,}/g, '_')
            .trim()
            .substring(0, 180);
    }
    
    // Extract conversation messages
    function extractConversation() {
        const baseXPath = '/html/body/div[4]/div[2]/div/div[1]/div/div/div[1]';
        const containerResult = document.evaluate(baseXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const container = containerResult.singleNodeValue;
        
        if (!container) {
            console.error('Could not find conversation container');
            return [];
        }
        
        const conversation = [];
        let messageCount = 0;
        
        // Process all message blocks
        for (let i = 0; i < container.children.length; i++) {
            try {
                const block = container.children[i];
                const messageEl = block.querySelector('[class*="whitespace-pre-wrap"]');
                if (!messageEl || !messageEl.textContent.trim()) continue;
                
                messageCount++;
                
                // Determine role
                const isUser = block.querySelector('.font-user-message') !== null;
                const role = isUser ? 'user' : 'assistant';
                
                // Extract thinking if present
                let thinking = '';
                const thinkingEl = block.querySelector('details');
                if (thinkingEl) {
                    const thinkingContent = thinkingEl.querySelector('div[class*="prose"]');
                    if (thinkingContent) {
                        thinking = thinkingContent.textContent.trim();
                    }
                }
                
                conversation.push({
                    index: messageCount,
                    role: role,
                    content: messageEl.textContent.trim(),
                    thinking: thinking
                });
            } catch (error) {
                continue;
            }
        }
        
        return conversation;
    }
    
    // Create markdown content
    function createMarkdown(conversationName, conversation) {
        let markdown = '# ' + conversationName + '\\n\\n';
        markdown += '> **URL:** ' + window.location.href + '\\n';
        markdown += '> **Exported:** ' + new Date().toLocaleString() + '\\n';
        markdown += '> **Messages:** ' + conversation.length + '\\n';
        markdown += '> **Artifacts:** ' + document.querySelectorAll('button[aria-label="Preview contents"]').length + '\\n\\n';
        markdown += '---\\n\\n';
        
        conversation.forEach(msg => {
            const roleEmoji = msg.role === 'user' ? '👤' : '🤖';
            markdown += '## ' + roleEmoji + ' ' + (msg.role === 'user' ? 'Human' : 'Claude') + '\\n\\n';
            
            if (msg.thinking && msg.role === 'assistant') {
                markdown += '<details>\\n<summary>💭 Claude\\'s Thinking</summary>\\n\\n';
                markdown += msg.thinking + '\\n\\n';
                markdown += '</details>\\n\\n';
            }
            
            markdown += msg.content + '\\n\\n';
            markdown += '---\\n\\n';
        });
        
        return markdown;
    }
    
    // Main function
    try {
        const conversationName = getConversationName();
        const conversation = extractConversation();
        const markdown = createMarkdown(conversationName, conversation);
        const filename = sanitizeFilename(conversationName);
        
        // Download
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename + '.md';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        return {
            success: true,
            filename: filename + '.md',
            messages: conversation.length
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
})()
    `;
    
    // Artifacts downloader code
    const artifactsDownloaderCode = `
(async function() {
    'use strict';
    
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    // Configuration
    const config = {
        artifactButtonSelector: 'button[aria-label="Preview contents"]',
        panelSelector: '[class*="basis-0"]',
        dropdownButtonSelector: 'button[id^="radix-"]',
        waitTimes: {
            afterArtifactClick: 1500,
            afterDropdownClick: 800,
            afterDownload: 300,
            betweenArtifacts: 500
        }
    };
    
    // Download single artifact
    async function downloadSingleArtifact(button, index, total) {
        try {
            button.click();
            await wait(config.waitTimes.afterArtifactClick);
            
            const panel = document.querySelector(config.panelSelector);
            if (!panel) throw new Error('Panel not found');
            
            const buttons = panel.querySelectorAll(config.dropdownButtonSelector);
            let dropdownButton = null;
            
            for (const btn of buttons) {
                if (btn.querySelector('svg')) {
                    const ariaLabel = btn.getAttribute('aria-label');
                    if (!ariaLabel || !ariaLabel.includes('Close')) {
                        dropdownButton = btn;
                        break;
                    }
                }
            }
            
            if (!dropdownButton) throw new Error('Dropdown button not found');
            
            dropdownButton.click();
            await wait(config.waitTimes.afterDropdownClick);
            
            const allLinks = document.querySelectorAll('a');
            let downloadLink = null;
            
            for (const link of allLinks) {
                const text = link.textContent || '';
                if (text.includes('Download as')) {
                    downloadLink = link;
                    break;
                }
            }
            
            if (!downloadLink) throw new Error('Download link not found');
            
            const filename = downloadLink.getAttribute('download') || 'artifact_' + (index + 1);
            downloadLink.click();
            
            await wait(config.waitTimes.afterDownload);
            document.body.click();
            await wait(config.waitTimes.betweenArtifacts);
            
            return { success: true, filename: filename };
            
        } catch (error) {
            document.body.click();
            await wait(config.waitTimes.betweenArtifacts);
            return { success: false, error: error.message };
        }
    }
    
    // Main function
    const artifactButtons = document.querySelectorAll(config.artifactButtonSelector);
    
    if (artifactButtons.length === 0) {
        return {
            success: true,
            total: 0,
            downloaded: [],
            failed: []
        };
    }
    
    const results = {
        success: true,
        total: artifactButtons.length,
        downloaded: [],
        failed: []
    };
    
    for (let i = 0; i < artifactButtons.length; i++) {
        const result = await downloadSingleArtifact(artifactButtons[i], i, artifactButtons.length);
        
        if (result.success) {
            results.downloaded.push(result.filename);
        } else {
            results.failed.push({ index: i + 1, error: result.error });
        }
    }
    
    if (results.failed.length > 0) {
        results.success = false;
    }
    
    return results;
})()
    `;
    
    // Main execution
    try {
        console.log('\n📝 Step 1: Downloading conversation...');
        const conversationResult = await loadScript(conversationScraperCode);
        
        if (conversationResult.success) {
            console.log(`✅ Downloaded: ${conversationResult.filename}`);
            console.log(`   Messages: ${conversationResult.messages}`);
        } else {
            console.log(`❌ Failed: ${conversationResult.error}`);
        }
        
        console.log('\n📦 Step 2: Downloading artifacts...');
        const artifactsResult = await loadScript(artifactsDownloaderCode);
        
        if (artifactsResult.total > 0) {
            console.log(`✅ Downloaded ${artifactsResult.downloaded.length}/${artifactsResult.total} artifacts`);
            
            if (artifactsResult.failed.length > 0) {
                console.log('❌ Failed artifacts:');
                artifactsResult.failed.forEach(f => {
                    console.log(`   Artifact ${f.index}: ${f.error}`);
                });
            }
        } else {
            console.log('ℹ️  No artifacts found');
        }
        
        // Combined result
        const finalResult = {
            success: conversationResult.success && artifactsResult.success,
            conversation: conversationResult,
            artifacts: artifactsResult,
            timestamp: new Date().toISOString()
        };
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ Complete download finished');
        console.log(`   Conversation: ${conversationResult.success ? 'Success' : 'Failed'}`);
        console.log(`   Artifacts: ${artifactsResult.downloaded.length}/${artifactsResult.total}`);
        
        // Store result
        window.lastCompleteResult = finalResult;
        console.log('\n💾 Result stored in window.lastCompleteResult');
        
        return finalResult;
        
    } catch (error) {
        console.error('❌ Wrapper error:', error);
        return {
            success: false,
            error: error.message
        };
    }
    
})();