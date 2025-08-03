// Claude Complete Downloader - Downloads conversation + all artifacts
// Combines conversation scraper with artifact downloader

(async function() {
    'use strict';
    
    console.log('🚀 Claude Complete Downloader');
    console.log('Downloads conversation text + all artifacts');
    console.log('=' .repeat(60));
    
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    // === CONVERSATION DOWNLOAD FUNCTIONS ===
    
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
        const baseXPath = '/html/body/div[4]/div[2]/div/div[1]/div/div/div[1]';
        const containerResult = document.evaluate(baseXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const container = containerResult.singleNodeValue;
        
        if (!container) {
            console.error('Could not find conversation container');
            return [];
        }
        
        const conversation = [];
        let messageCount = 0;
        
        // Check for the first message
        const firstMessageXPath = `${baseXPath}/div[1]/div/div[2]/div[1]/div[2]/p`;
        const firstResult = document.evaluate(firstMessageXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const firstMessage = firstResult.singleNodeValue;
        
        if (firstMessage && firstMessage.textContent && firstMessage.textContent.trim()) {
            messageCount++;
            conversation.push({
                index: messageCount,
                role: 'user',
                content: firstMessage.textContent.trim()
            });
        }
        
        // Process other messages
        for (let i = 1; i <= container.children.length; i++) {
            try {
                const messageXPath = `${baseXPath}/div[${i}]/div/div/div[1]/div[2]`;
                const result = document.evaluate(messageXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                const messageElement = result.singleNodeValue;
                
                if (messageElement && messageElement.textContent && messageElement.textContent.trim()) {
                    messageCount++;
                    
                    // Determine role by checking CSS classes
                    let role = 'unknown';
                    const messageBlock = container.children[i - 1];
                    
                    if (messageBlock) {
                        const userElements = messageBlock.querySelectorAll('.font-user-message');
                        const claudeElements = messageBlock.querySelectorAll('.font-claude-message, .font-claude-response');
                        
                        if (userElements.length > 0) {
                            role = 'user';
                        } else if (claudeElements.length > 0) {
                            role = 'assistant';
                        }
                    }
                    
                    if (role === 'unknown') {
                        role = (messageCount % 2 === 1) ? 'user' : 'assistant';
                    }
                    
                    // Check for thinking section
                    let thinking = '';
                    const thinkingXPath = `.//div[1]/div/div/div/div/div/div/p`;
                    const thinkingResult = document.evaluate(thinkingXPath, messageElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    
                    if (thinkingResult.snapshotLength > 0) {
                        const thinkingParts = [];
                        for (let j = 0; j < thinkingResult.snapshotLength; j++) {
                            const para = thinkingResult.snapshotItem(j);
                            if (para.textContent.trim()) {
                                thinkingParts.push(para.textContent.trim());
                            }
                        }
                        if (thinkingParts.length > 0) {
                            thinking = thinkingParts.join('\n\n');
                        }
                    }
                    
                    const textContent = messageElement.innerText || messageElement.textContent || '';
                    
                    conversation.push({
                        index: messageCount,
                        role: role,
                        content: textContent.trim(),
                        thinking: thinking
                    });
                }
            } catch (error) {
                continue;
            }
        }
        
        return conversation;
    }
    
    function createMarkdown(conversationName, conversation, artifactCount, downloadedArtifacts) {
        let markdown = `# ${conversationName}\n\n`;
        markdown += `> **URL:** ${window.location.href}\n`;
        markdown += `> **Exported:** ${new Date().toLocaleString()}\n`;
        markdown += `> **Messages:** ${conversation.length}\n`;
        markdown += `> **Artifacts in conversation:** ${artifactCount}\n`;
        markdown += `> **Artifacts downloaded:** ${downloadedArtifacts.length}\n\n`;
        
        if (downloadedArtifacts.length > 0) {
            markdown += '## Downloaded Artifacts\n\n';
            downloadedArtifacts.forEach((artifact, i) => {
                markdown += `${i + 1}. ${artifact}\n`;
            });
            markdown += '\n';
        }
        
        markdown += '---\n\n';
        
        // Add conversation
        conversation.forEach(msg => {
            const roleEmoji = msg.role === 'user' ? '👤' : '🤖';
            markdown += `## ${roleEmoji} ${msg.role === 'user' ? 'Human' : 'Claude'}\n\n`;
            
            if (msg.thinking && msg.role === 'assistant') {
                markdown += `<details>\n<summary>💭 Claude's Thinking</summary>\n\n`;
                markdown += msg.thinking + '\n\n';
                markdown += `</details>\n\n`;
            }
            
            markdown += msg.content + '\n\n';
            markdown += '---\n\n';
        });
        
        return markdown;
    }
    
    // === ARTIFACT DOWNLOAD FUNCTIONS ===
    
    async function downloadSingleArtifact(artifactButton, index, total) {
        console.log(`  📦 Processing artifact ${index + 1}/${total}`);
        
        try {
            // Click artifact button
            artifactButton.click();
            await wait(1500);
            
            // Find panel
            const panel = document.querySelector('[class*="basis-0"]');
            if (!panel) {
                console.log('    ❌ Panel not found');
                return null;
            }
            
            // Find dropdown button - look for radix button with SVG
            const buttons = panel.querySelectorAll('button[id^="radix-"]');
            let dropdownButton = null;
            
            for (const button of buttons) {
                const svg = button.querySelector('svg');
                if (svg) {
                    const ariaLabel = button.getAttribute('aria-label');
                    if (!ariaLabel || !ariaLabel.includes('Close')) {
                        dropdownButton = button;
                        break;
                    }
                }
            }
            
            if (!dropdownButton) {
                console.log('    ❌ Dropdown button not found');
                document.body.click(); // Close panel
                await wait(500);
                return null;
            }
            
            // Click dropdown
            dropdownButton.click();
            await wait(800);
            
            // Find download link
            const allLinks = document.querySelectorAll('a');
            let downloadLink = null;
            
            for (const link of allLinks) {
                const text = link.textContent || '';
                if (text.includes('Download as')) {
                    downloadLink = link;
                    break;
                }
            }
            
            if (downloadLink) {
                const filename = downloadLink.getAttribute('download') || `artifact_${index + 1}`;
                console.log(`    ✅ Downloading: ${filename}`);
                downloadLink.click();
                
                // Close panel
                await wait(500);
                document.body.click();
                await wait(500);
                
                return filename;
            } else {
                console.log('    ❌ Download link not found');
                document.body.click(); // Close panel
                await wait(500);
                return null;
            }
            
        } catch (error) {
            console.error('    ❌ Error:', error.message);
            return null;
        }
    }
    
    async function downloadAllArtifacts() {
        const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
        console.log(`\n📦 Found ${artifactButtons.length} artifacts to download`);
        
        if (artifactButtons.length === 0) {
            return [];
        }
        
        const downloadedFiles = [];
        
        for (let i = 0; i < artifactButtons.length; i++) {
            const filename = await downloadSingleArtifact(artifactButtons[i], i, artifactButtons.length);
            if (filename) {
                downloadedFiles.push(filename);
            }
            
            // Wait between artifacts
            if (i < artifactButtons.length - 1) {
                await wait(500);
            }
        }
        
        console.log(`✅ Downloaded ${downloadedFiles.length}/${artifactButtons.length} artifacts`);
        return downloadedFiles;
    }
    
    // === MAIN FUNCTION ===
    
    async function downloadComplete() {
        try {
            // Step 1: Extract conversation
            console.log('\n📝 Step 1: Extracting conversation...');
            const conversationName = getConversationName();
            console.log(`Conversation: "${conversationName}"`);
            
            const conversation = extractConversation();
            console.log(`✅ Extracted ${conversation.length} messages`);
            
            // Step 2: Download artifacts
            console.log('\n📥 Step 2: Downloading artifacts...');
            const artifactCount = document.querySelectorAll('button[aria-label="Preview contents"]').length;
            const downloadedArtifacts = await downloadAllArtifacts();
            
            // Step 3: Create and download markdown
            console.log('\n📄 Step 3: Creating markdown file...');
            const markdown = createMarkdown(conversationName, conversation, artifactCount, downloadedArtifacts);
            const filename = sanitizeFilename(conversationName);
            
            const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}.md`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log(`✅ Downloaded conversation: ${filename}.md`);
            
            // Summary
            console.log('\n' + '='.repeat(60));
            console.log('✅ Download Complete!');
            console.log(`   Conversation: ${filename}.md`);
            console.log(`   Messages: ${conversation.length}`);
            console.log(`   Artifacts: ${downloadedArtifacts.length}/${artifactCount}`);
            console.log('\n💡 Check your downloads folder');
            
            return {
                success: true,
                conversationFile: `${filename}.md`,
                messageCount: conversation.length,
                artifactsDownloaded: downloadedArtifacts.length,
                artifactsTotal: artifactCount
            };
            
        } catch (error) {
            console.error('❌ Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Start
    console.log('Starting in 2 seconds...');
    console.log('Make sure you\'re on a Claude conversation\n');
    
    setTimeout(() => {
        downloadComplete().then(result => {
            window.downloadResult = result;
            console.log('\n💾 Result stored in window.downloadResult');
        });
    }, 2000);
    
})();