// Claude Artifact Downloader - Fixed Dropdown Detection
// Properly identifies the dropdown button with SVG arrow

(async function() {
    'use strict';
    
    console.log('🎯 Claude Artifact Downloader - Dropdown Fix');
    console.log('=' .repeat(60));
    
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    async function downloadArtifact(artifactButton, index) {
        console.log(`\n📦 Artifact ${index + 1}:`);
        
        // Step 1: Click artifact button
        artifactButton.click();
        console.log('  ✅ Opened artifact panel');
        await wait(1500);
        
        // Step 2: Find panel
        const panel = document.querySelector('[class*="basis-0"]');
        if (!panel) {
            console.log('  ❌ Panel not found');
            return false;
        }
        
        // Step 3: Find dropdown button - it's the button with radix ID that contains SVG
        const buttons = panel.querySelectorAll('button[id^="radix-"]');
        let dropdownButton = null;
        
        console.log(`  Found ${buttons.length} radix buttons`);
        
        for (const button of buttons) {
            // Check if this button contains an SVG (dropdown arrow)
            const svg = button.querySelector('svg');
            if (svg) {
                // Check if it's NOT a close button or other icon
                const ariaLabel = button.getAttribute('aria-label');
                if (!ariaLabel || !ariaLabel.includes('Close')) {
                    dropdownButton = button;
                    console.log(`  ✅ Found dropdown button: ${button.id}`);
                    break;
                }
            }
        }
        
        if (!dropdownButton) {
            // Fallback: Try the specific XPath you provided
            const xpathResult = document.evaluate(
                '/html/body/div[4]/div[2]/div/div[3]/div/div[2]/div/div/div[1]/div[2]/div/button[2]',
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            );
            dropdownButton = xpathResult.singleNodeValue;
            
            if (dropdownButton) {
                console.log('  ✅ Found dropdown button via XPath');
            } else {
                console.log('  ❌ Dropdown button not found');
                return false;
            }
        }
        
        // Step 4: Click dropdown
        dropdownButton.click();
        console.log('  ✅ Clicked dropdown');
        await wait(800); // Give dropdown time to appear
        
        // Step 5: Find download link
        // Check all links in the document for "Download as"
        const allLinks = document.querySelectorAll('a');
        let downloadLink = null;
        
        for (const link of allLinks) {
            const text = link.textContent || '';
            if (text.includes('Download as')) {
                downloadLink = link;
                console.log(`  ✅ Found download link: "${text.trim()}"`);
                const filename = link.getAttribute('download');
                if (filename) {
                    console.log(`  📥 Filename: ${filename}`);
                }
                break;
            }
        }
        
        if (downloadLink) {
            downloadLink.click();
            console.log('  ✅ Download triggered');
        } else {
            console.log('  ❌ Download link not found');
            console.log('  Debug: Checking last 5 body > div elements...');
            
            // Debug: Check what appeared
            const bodyDivs = document.querySelectorAll('body > div');
            for (let i = Math.max(0, bodyDivs.length - 5); i < bodyDivs.length; i++) {
                const div = bodyDivs[i];
                const links = div.querySelectorAll('a');
                if (links.length > 0) {
                    console.log(`    body > div[${i + 1}] has ${links.length} links:`);
                    links.forEach(link => {
                        console.log(`      - "${link.textContent.trim()}"`);
                    });
                }
            }
        }
        
        // Step 6: Close panel
        await wait(500);
        document.body.click();
        console.log('  ✅ Closed panel');
        
        return !!downloadLink;
    }
    
    // Main
    async function main() {
        const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
        console.log(`Found ${artifactButtons.length} artifacts`);
        
        if (artifactButtons.length === 0) {
            console.log('No artifacts found');
            return;
        }
        
        let successCount = 0;
        
        for (let i = 0; i < artifactButtons.length; i++) {
            const success = await downloadArtifact(artifactButtons[i], i);
            if (success) successCount++;
            await wait(1000);
        }
        
        console.log('\n' + '='.repeat(60));
        console.log(`✅ Downloaded ${successCount}/${artifactButtons.length} artifacts`);
        console.log('💡 Check your downloads folder');
    }
    
    console.log('Starting in 2 seconds...\n');
    setTimeout(main, 2000);
    
})();