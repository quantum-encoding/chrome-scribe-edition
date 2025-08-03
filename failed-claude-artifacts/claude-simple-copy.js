// Claude Simple Copy - Direct approach using Copy button
(async function() {
    'use strict';
    
    console.log('🚀 Claude Simple Copy Script\n');
    
    // Get conversation name
    const conversationName = document.querySelector('title')?.textContent?.replace(' - Claude', '').trim() || 'Claude_Conversation';
    console.log(`Processing: ${conversationName}`);
    
    // Find all artifact preview buttons
    const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
    console.log(`Found ${artifactButtons.length} artifact buttons`);
    
    const artifacts = [];
    
    // Process each artifact
    for (let i = 0; i < artifactButtons.length; i++) {
        console.log(`\n📦 Processing artifact ${i + 1}/${artifactButtons.length}`);
        
        // Click to open artifact
        artifactButtons[i].click();
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Find the Copy button - it should be in the opened panel
        let copyButton = null;
        
        // Try different methods to find Copy button
        // Method 1: Direct text match
        const allButtons = document.querySelectorAll('button');
        for (const btn of allButtons) {
            if (btn.textContent?.trim() === 'Copy') {
                copyButton = btn;
                break;
            }
        }
        
        // Method 2: Check button with div containing Copy
        if (!copyButton) {
            for (const btn of allButtons) {
                const div = btn.querySelector('div');
                if (div && div.textContent?.trim() === 'Copy') {
                    copyButton = btn;
                    break;
                }
            }
        }
        
        if (copyButton) {
            // Get artifact title from the panel
            const panel = copyButton.closest('[class*="basis-0"]') || copyButton.closest('[role="dialog"]');
            const titleElement = panel?.querySelector('h1, h2, h3, [class*="font-bold"], [class*="font-semibold"]');
            const title = titleElement?.textContent?.trim() || `artifact_${i + 1}`;
            
            console.log(`  Title: ${title}`);
            console.log('  Clicking Copy button...');
            
            // Click copy
            copyButton.click();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            try {
                // Read from clipboard
                const content = await navigator.clipboard.readText();
                
                if (content) {
                    console.log(`  ✅ Got content (${content.length} chars)`);
                    
                    // Determine file extension
                    let ext = 'txt';
                    if (content.includes('def ') || content.includes('import ')) ext = 'py';
                    else if (content.includes('function ') || content.includes('const ')) ext = 'js';
                    else if (content.includes('# ') && content.includes('## ')) ext = 'md';
                    else if (content.includes('<!DOCTYPE') || content.includes('<html')) ext = 'html';
                    
                    artifacts.push({
                        title: title,
                        filename: `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`,
                        content: content
                    });
                } else {
                    console.log('  ❌ Clipboard was empty');
                }
            } catch (err) {
                console.log('  ❌ Clipboard error:', err.message);
                console.log('  💡 Make sure to allow clipboard access when prompted');
            }
        } else {
            console.log('  ❌ Copy button not found');
        }
        
        // Close the panel
        const closeButton = document.querySelector('button[aria-label="Close"]');
        if (closeButton) {
            closeButton.click();
        } else {
            // Click outside to close
            document.body.click();
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Download all artifacts
    if (artifacts.length > 0) {
        console.log(`\n✅ Captured ${artifacts.length} artifacts`);
        
        // Create a markdown file with all artifacts
        let markdown = `# ${conversationName} - Artifacts\n\n`;
        markdown += `> **Exported:** ${new Date().toLocaleString()}\n`;
        markdown += `> **Artifacts:** ${artifacts.length}\n\n`;
        
        artifacts.forEach((artifact, idx) => {
            markdown += `## ${idx + 1}. ${artifact.title}\n\n`;
            markdown += `**File:** \`${artifact.filename}\`\n\n`;
            markdown += '```' + artifact.filename.split('.').pop() + '\n';
            markdown += artifact.content + '\n';
            markdown += '```\n\n---\n\n';
        });
        
        // Download
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${conversationName.replace(/[^a-zA-Z0-9_-]/g, '_')}_artifacts.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ Downloaded artifacts file');
    } else {
        console.log('\n❌ No artifacts captured');
    }
    
})();