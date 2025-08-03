// Claude Artifact Downloader V4 - Fresh approach based on DOM analysis
// Uses discovered patterns from F12 inspection

(async function() {
    'use strict';
    
    console.log('🚀 Claude Artifact Downloader V4 - First Principles Edition');
    console.log('=' .repeat(60));
    
    // Configuration
    const config = {
        artifactButtonSelector: 'button[aria-label="Preview contents"]',
        panelSelectors: ['[class*="basis-0"]', '/html/body/div[4]/div[2]/div/div[3]'],
        waitTimes: {
            afterArtifactClick: 1500,
            afterDropdownClick: 800,
            betweenArtifacts: 500
        }
    };
    
    // Helper: Find element by multiple selectors
    function findElement(selectors) {
        for (const selector of selectors) {
            if (selector.startsWith('/')) {
                // XPath
                const result = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                if (result.singleNodeValue) return result.singleNodeValue;
            } else {
                // CSS
                const elem = document.querySelector(selector);
                if (elem) return elem;
            }
        }
        return null;
    }
    
    // Helper: Wait
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    // Find dropdown button in panel
    function findDropdownButton(panel) {
        const buttons = panel.querySelectorAll('button');
        console.log(`  Found ${buttons.length} buttons in panel`);
        
        // Strategy 1: Find button with SVG that comes after another button (Copy button)
        for (let i = 1; i < buttons.length; i++) {
            const btn = buttons[i];
            const prevBtn = buttons[i-1];
            
            // Check if this button has SVG and previous doesn't look like Close
            if (btn.querySelector('svg') && 
                !prevBtn.getAttribute('aria-label')?.includes('Close')) {
                
                const btnId = btn.id || 'no-id';
                const btnText = btn.textContent.trim() || 'no-text';
                console.log(`  Selected dropdown: [${i}] id="${btnId}", text="${btnText}"`);
                return btn;
            }
        }
        
        // Strategy 2: Look for button with specific SVG path
        for (const btn of buttons) {
            const path = btn.querySelector('svg path');
            if (path && path.getAttribute('d')?.includes('M14.128 7.16482')) {
                console.log('  Found dropdown by SVG path');
                return btn;
            }
        }
        
        return null;
    }
    
    // Find download link after dropdown click
    function findDownloadLink() {
        console.log('  Searching for download link...');
        
        // Strategy 1: Check new body > div elements
        const bodyDivs = document.querySelectorAll('body > div');
        
        // Check last 10 divs (dropdowns often appear at the end)
        for (let i = Math.max(0, bodyDivs.length - 10); i < bodyDivs.length; i++) {
            const div = bodyDivs[i];
            const links = div.querySelectorAll('a');
            
            for (const link of links) {
                const href = link.getAttribute('href') || '';
                const text = link.textContent.trim();
                const download = link.getAttribute('download') || '';
                
                // Check if this looks like a download link
                if (href.includes('blob:') || download || text.includes('Download')) {
                    console.log(`  ✅ Found download link in body > div[${i + 1}]`);
                    console.log(`     Text: "${text}"`);
                    console.log(`     Download: "${download}"`);
                    return link;
                }
            }
        }
        
        // Strategy 2: Check radix content elements
        const radixElements = document.querySelectorAll('[id^="radix-"][id*="content"]');
        for (const elem of radixElements) {
            const links = elem.querySelectorAll('a');
            for (const link of links) {
                if (link.href?.includes('blob:') || link.hasAttribute('download')) {
                    console.log(`  ✅ Found download link in ${elem.id}`);
                    return link;
                }
            }
        }
        
        // Strategy 3: Any link with download attribute or blob URL
        const allLinks = document.querySelectorAll('a[download], a[href^="blob:"]');
        if (allLinks.length > 0) {
            // Get the most recent one (likely the dropdown we just opened)
            const link = allLinks[allLinks.length - 1];
            console.log(`  ✅ Found download link (fallback search)`);
            return link;
        }
        
        return null;
    }
    
    // Process single artifact
    async function processArtifact(button, index, total) {
        console.log(`\n📦 Processing artifact ${index + 1}/${total}`);
        
        try {
            // Click artifact button
            button.click();
            await wait(config.waitTimes.afterArtifactClick);
            
            // Find panel
            const panel = findElement(config.panelSelectors);
            if (!panel) {
                console.log('  ❌ Panel not found');
                return { success: false, error: 'Panel not found' };
            }
            
            // Find dropdown button
            const dropdownBtn = findDropdownButton(panel);
            if (!dropdownBtn) {
                console.log('  ❌ Dropdown button not found');
                return { success: false, error: 'Dropdown not found' };
            }
            
            // Click dropdown
            dropdownBtn.click();
            await wait(config.waitTimes.afterDropdownClick);
            
            // Find and click download link
            const downloadLink = findDownloadLink();
            if (downloadLink) {
                const filename = downloadLink.getAttribute('download') || 
                               downloadLink.textContent.trim() || 
                               `artifact_${index + 1}`;
                
                console.log(`  📥 Downloading: ${filename}`);
                downloadLink.click();
                
                // Close panel
                await wait(300);
                const closeBtn = panel.querySelector('button[aria-label="Close"]');
                if (closeBtn) {
                    closeBtn.click();
                } else {
                    document.body.click();
                }
                
                return { success: true, filename };
            } else {
                console.log('  ❌ Download link not found');
                
                // Close panel anyway
                document.body.click();
                
                return { success: false, error: 'Download link not found' };
            }
            
        } catch (error) {
            console.error('  ❌ Error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Main function
    async function downloadAllArtifacts() {
        const artifacts = document.querySelectorAll(config.artifactButtonSelector);
        console.log(`\nFound ${artifacts.length} artifacts to download`);
        
        if (artifacts.length === 0) {
            console.log('No artifacts found in this conversation');
            return;
        }
        
        const results = {
            total: artifacts.length,
            successful: 0,
            failed: 0,
            details: []
        };
        
        // Process each artifact
        for (let i = 0; i < artifacts.length; i++) {
            const result = await processArtifact(artifacts[i], i, artifacts.length);
            
            if (result.success) {
                results.successful++;
            } else {
                results.failed++;
            }
            
            results.details.push({
                index: i + 1,
                ...result
            });
            
            // Wait between artifacts
            if (i < artifacts.length - 1) {
                await wait(config.waitTimes.betweenArtifacts);
            }
        }
        
        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 Download Summary:');
        console.log(`   Total artifacts: ${results.total}`);
        console.log(`   ✅ Successful: ${results.successful}`);
        console.log(`   ❌ Failed: ${results.failed}`);
        
        if (results.failed > 0) {
            console.log('\n❌ Failed downloads:');
            results.details
                .filter(d => !d.success)
                .forEach(d => console.log(`   Artifact ${d.index}: ${d.error}`));
        }
        
        console.log('\n💡 Check your downloads folder for the artifact files');
        
        return results;
    }
    
    // Start
    console.log('Starting in 2 seconds...');
    console.log('Make sure you\'re on a Claude conversation with artifacts\n');
    
    setTimeout(() => {
        downloadAllArtifacts().then(results => {
            // Store results for debugging
            window.artifactDownloadResults = results;
            console.log('\n💾 Results stored in window.artifactDownloadResults');
        });
    }, 2000);
    
})();