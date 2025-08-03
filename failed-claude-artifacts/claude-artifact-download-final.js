// Claude Artifact Download - Final Solution
// Clicks dropdown and finds download options within the artifact panel

(function() {
    'use strict';
    
    console.log('🎯 Claude Artifact Download - Final Solution\n');
    
    // Process a single artifact
    async function processArtifact(artifactButton, index, total) {
        console.log(`\nProcessing artifact ${index + 1}/${total}`);
        
        // Click artifact to open panel
        artifactButton.click();
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Find the artifact panel
        const panelXPath = '/html/body/div[4]/div[2]/div/div[3]';
        const panel = document.evaluate(panelXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        
        if (!panel) {
            console.log('  ❌ Artifact panel not found');
            return false;
        }
        
        // Find all buttons in the panel
        const buttons = panel.querySelectorAll('button');
        console.log(`  Found ${buttons.length} buttons in panel`);
        
        // Find the dropdown button (usually the last "..." button or button with SVG)
        let dropdownButton = null;
        
        // Method 1: Look for button with just "..." text
        for (const btn of buttons) {
            if (btn.textContent.trim() === '...') {
                dropdownButton = btn;
                console.log('  Found dropdown by "..." text');
                break;
            }
        }
        
        // Method 2: Look for the second button in the button group
        if (!dropdownButton) {
            const buttonGroups = panel.querySelectorAll('div:has(> button + button)');
            if (buttonGroups.length > 0) {
                const groupButtons = buttonGroups[0].querySelectorAll('button');
                if (groupButtons.length >= 2) {
                    dropdownButton = groupButtons[groupButtons.length - 1];
                    console.log('  Found dropdown as last button in group');
                }
            }
        }
        
        if (!dropdownButton) {
            console.log('  ❌ Dropdown button not found');
            return false;
        }
        
        // Click dropdown
        dropdownButton.click();
        console.log('  Clicked dropdown');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Now look for menu WITHIN the panel or as a sibling
        let downloadLink = null;
        
        // Method 1: Look for new elements in the panel after click
        const panelLinks = panel.querySelectorAll('a');
        console.log(`  Links in panel after dropdown: ${panelLinks.length}`);
        
        for (const link of panelLinks) {
            const text = link.textContent || '';
            const href = link.getAttribute('href') || '';
            
            // Check if this is a download link
            if (text.match(/\.(py|js|tsx|jsx|html|css|json|md|txt)$/) || 
                href.includes('download') || 
                link.hasAttribute('download')) {
                downloadLink = link;
                console.log(`  ✅ Found download link: "${text}"`);
                break;
            }
        }
        
        // Method 2: Check for menu elements anywhere in the document
        if (!downloadLink) {
            const allMenus = document.querySelectorAll('[role="menu"], [role="menuitem"], div[tabindex="-1"]:has(a)');
            console.log(`  Checking ${allMenus.length} potential menu elements`);
            
            for (const menu of allMenus) {
                const menuLinks = menu.querySelectorAll('a');
                for (const link of menuLinks) {
                    const text = link.textContent || '';
                    if (text.match(/\.(py|js|tsx|jsx|html|css|json|md|txt)$/)) {
                        downloadLink = link;
                        console.log(`  ✅ Found download link in menu: "${text}"`);
                        break;
                    }
                }
                if (downloadLink) break;
            }
        }
        
        // Method 3: Look for any new elements that appeared
        if (!downloadLink) {
            // Get all links in the document
            const allLinks = Array.from(document.querySelectorAll('a'));
            
            // Filter for download-like links
            const downloadLinks = allLinks.filter(link => {
                const text = link.textContent || '';
                const href = link.getAttribute('href') || '';
                return text.match(/\.(py|js|tsx|jsx|html|css|json|md|txt)$/) ||
                       href.includes('blob:') ||
                       link.hasAttribute('download');
            });
            
            if (downloadLinks.length > 0) {
                // Take the most recently added one (likely at the end)
                downloadLink = downloadLinks[downloadLinks.length - 1];
                console.log(`  ✅ Found download link globally: "${downloadLink.textContent}"`);
            }
        }
        
        // Click download link if found
        if (downloadLink) {
            downloadLink.click();
            console.log('  📥 Download triggered!');
            await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
            console.log('  ❌ No download link found');
            
            // Debug: Show what we did find
            console.log('  Debug - All links found:');
            const debugLinks = panel.querySelectorAll('a');
            debugLinks.forEach((link, i) => {
                if (i < 5) {
                    console.log(`    ${i}: "${link.textContent.trim().substring(0, 50)}"`);
                }
            });
        }
        
        // Close panel
        const closeButton = panel.querySelector('button[aria-label="Close"]');
        if (closeButton) {
            closeButton.click();
            await new Promise(resolve => setTimeout(resolve, 500));
        } else {
            // Click outside to close
            document.body.click();
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        return !!downloadLink;
    }
    
    // Main function
    async function downloadAllArtifacts() {
        // Find all artifact buttons
        const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
        console.log(`Found ${artifactButtons.length} artifacts to process`);
        
        if (artifactButtons.length === 0) {
            console.log('No artifacts found in this conversation');
            return;
        }
        
        let successCount = 0;
        
        // Process each artifact
        for (let i = 0; i < artifactButtons.length; i++) {
            const success = await processArtifact(artifactButtons[i], i, artifactButtons.length);
            if (success) successCount++;
            
            // Small delay between artifacts
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log(`\n✅ Complete! Downloaded ${successCount}/${artifactButtons.length} artifacts`);
        
        // Generate summary report
        const report = [
            '# Claude Artifact Download Report',
            '',
            `**URL:** ${window.location.href}`,
            `**Time:** ${new Date().toLocaleString()}`,
            '',
            '## Results',
            '',
            `- Total artifacts found: ${artifactButtons.length}`,
            `- Successfully downloaded: ${successCount}`,
            `- Failed: ${artifactButtons.length - successCount}`,
            '',
            '## Notes',
            '',
            'Check your downloads folder for the artifact files.',
            'Some artifacts may require manual download if they use a different UI pattern.',
            ''
        ].join('\n');
        
        // Save report
        const blob = new Blob([report], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `claude-artifacts-report-${new Date().toISOString().slice(0,19).replace(/[:-]/g,'')}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Start download
    console.log('Starting artifact downloads in 2 seconds...');
    setTimeout(downloadAllArtifacts, 2000);
    
})();