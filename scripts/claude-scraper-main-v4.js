// Claude Main Scraper V4 - Fixed version using exact V3 approach
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
            dropdown: 1000,
            download: 1000,
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
    
    // Process artifacts using exact V3 approach
    async function processArtifacts() {
        console.log('📋 Looking for artifacts in conversation...');
        
        // Find all artifact preview buttons
        const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
        console.log(`Found ${artifactButtons.length} artifact buttons`);
        
        const artifactsList = [];
        let downloadCount = 0;
        
        // Process each artifact
        for (let i = 0; i < artifactButtons.length; i++) {
            console.log(`\nProcessing artifact ${i + 1}/${artifactButtons.length}`);
            
            // Click the artifact button to open the preview
            artifactButtons[i].click();
            await wait(1500);
            
            // Find the dropdown arrow button next to the copy button
            // Look for a button that contains an SVG and is in a radix component
            const panel = document.querySelector('div[class*="md:basis-0"]') || 
                         document.evaluate('/html/body/div[4]/div[2]/div/div[3]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            
            if (!panel) {
                console.log('  ❌ Artifact panel not found');
                continue;
            }
            
            // Find buttons in the panel
            const buttons = panel.querySelectorAll('button');
            let dropdownButton = null;
            
            // Look for the dropdown arrow button (usually has an SVG with chevron/arrow)
            for (const btn of buttons) {
                const svg = btn.querySelector('svg');
                if (svg && btn.id && btn.id.startsWith('radix-')) {
                    // Check if this button is next to a Copy button
                    const prevSibling = btn.previousElementSibling;
                    const nextSibling = btn.nextElementSibling;
                    const parentButtons = btn.parentElement?.querySelectorAll('button');
                    
                    if (parentButtons && parentButtons.length >= 2) {
                        // This is likely our dropdown button
                        dropdownButton = btn;
                        console.log(`  Found dropdown button: ${btn.id}`);
                        break;
                    }
                }
            }
            
            if (!dropdownButton) {
                console.log('  ❌ Dropdown button not found');
                continue;
            }
            
            // Click the dropdown arrow
            dropdownButton.click();
            console.log('  Clicked dropdown arrow');
            
            // Wait longer for menu to appear
            await wait(1000);
            
            // Now look for the Radix menu that appeared
            // Try multiple selectors to find the menu
            let radixMenus = document.querySelectorAll('[id^="radix-"]:has(a)');
            
            // If :has is not supported, use alternative
            if (radixMenus.length === 0) {
                radixMenus = [];
                const allRadix = document.querySelectorAll('[id^="radix-"]');
                for (const elem of allRadix) {
                    if (elem.querySelector('a')) {
                        radixMenus.push(elem);
                    }
                }
            }
            
            let downloadLink = null;
            
            for (const menu of radixMenus) {
                const links = menu.querySelectorAll('a');
                for (const link of links) {
                    const text = link.textContent || '';
                    const href = link.getAttribute('href') || '';
                    const downloadAttr = link.getAttribute('download') || '';
                    
                    // Check if this is a download link
                    // Look for "Download as" text OR blob URLs with download attribute
                    if (text.includes('Download as') || 
                        (href.includes('blob:') && downloadAttr)) {
                        downloadLink = link;
                        console.log(`  ✅ Found download link: "${text}"`);
                        break;
                    }
                }
                if (downloadLink) break;
            }
            
            // Alternative: Look for any new links that appeared
            if (!downloadLink) {
                // Try a broader search for download links
                const allLinks = document.querySelectorAll('a');
                for (const link of allLinks) {
                    const text = link.textContent || '';
                    const href = link.getAttribute('href') || '';
                    // Look for "Download as" text pattern or blob URLs
                    if (text.includes('Download as') || 
                        (href.includes('blob:') && link.hasAttribute('download'))) {
                        downloadLink = link;
                        console.log(`  ✅ Found download link (alt method): "${text}"`);
                        break;
                    }
                }
            }
            
            // Last resort: click dropdown again if no link found
            if (!downloadLink && dropdownButton) {
                console.log('  Trying to click dropdown again...');
                dropdownButton.click();
                await wait(800);
                
                // Search one more time
                const finalSearch = document.querySelectorAll('a');
                for (const link of finalSearch) {
                    const text = link.textContent || '';
                    if (text.includes('Download as')) {
                        downloadLink = link;
                        console.log(`  ✅ Found download link (retry): "${text}"`);
                        break;
                    }
                }
            }
            
            if (downloadLink) {
                // Get artifact details
                const filename = downloadLink.getAttribute('download') || `artifact_${i + 1}`;
                const fileType = downloadLink.textContent.match(/Download as (\w+)/)?.[1] || 'unknown';
                
                artifactsList.push({
                    index: i + 1,
                    filename: filename,
                    type: fileType,
                    downloaded: true
                });
                
                // Click the download link
                downloadLink.click();
                downloadCount++;
                console.log('  📥 Download triggered!');
                await wait(1000);
            } else {
                console.log('  ❌ No download link found');
                
                artifactsList.push({
                    index: i + 1,
                    filename: `artifact_${i + 1}`,
                    type: 'unknown',
                    downloaded: false
                });
            }
            
            // Close the panel by clicking outside or close button
            const closeButton = panel.querySelector('button[aria-label="Close"]');
            if (closeButton) {
                closeButton.click();
            } else {
                // Click outside
                document.body.click();
            }
            await wait(500);
        }
        
        return { downloadCount, artifactsList };
    }
    
    // Create markdown content
    function createMarkdown(name, messages, artifactData) {
        const lines = [
            `# ${name}`,
            '',
            `> **URL:** ${window.location.href}`,
            `> **Exported:** ${new Date().toLocaleString()}`,
            `> **Messages:** ${messages.length}`,
            `> **Artifacts:** ${artifactData.artifactsList.length}`,
            ''
        ];
        
        if (artifactData.artifactsList.length > 0) {
            lines.push('## Downloaded Artifacts', '');
            artifactData.artifactsList.forEach((artifact) => {
                const status = artifact.downloaded ? '✅' : '❌';
                lines.push(`${artifact.index}. ${status} **${artifact.filename}** (${artifact.type})`);
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
        const artifactData = await processArtifacts();
        
        // Step 3: Create and download markdown
        console.log('\n📄 Creating markdown file...');
        const markdown = createMarkdown(conversationName, messages, artifactData);
        const filename = sanitizeFilename(conversationName) + '.md';
        downloadFile(markdown, filename);
        
        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('✅ Download Complete!');
        console.log(`   Conversation: ${filename}`);
        console.log(`   Messages: ${messages.length}`);
        console.log(`   Artifacts downloaded: ${artifactData.downloadCount}/${artifactData.artifactsList.length}`);
        console.log('\n💡 Check your downloads folder');
        
        // Return result for extension
        return {
            success: true,
            filename: filename,
            messages: messages.length,
            artifacts: artifactData.downloadCount
        };
        
    } catch (error) {
        console.error('❌ Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
    
})();