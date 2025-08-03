// Claude Artifact Downloader - Debug Version
// Enhanced logging to diagnose download link detection

(async function() {
    'use strict';
    
    console.log('🔍 Claude Artifact Downloader - Debug Version');
    console.log('=' .repeat(60));
    
    // Configuration
    const config = {
        artifactButtonSelector: 'button[aria-label="Preview contents"]',
        panelSelector: '[class*="basis-0"]',
        dropdownButtonIndex: 1, // Second button (after Copy)
        waitTimes: {
            afterArtifactClick: 1500,
            afterDropdownClick: 800, // Increased wait time
            afterDownload: 300,
            betweenArtifacts: 500
        }
    };
    
    // Helper: Wait
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    // Helper: Debug DOM state
    function debugDOMState(label) {
        console.log(`\n🔍 ${label}:`);
        
        // Count various elements
        const bodyDivCount = document.querySelectorAll('body > div').length;
        const blobLinks = document.querySelectorAll('a[href^="blob:"]').length;
        const downloadLinks = document.querySelectorAll('a[download]').length;
        const allLinks = document.querySelectorAll('a').length;
        
        console.log(`  body > div count: ${bodyDivCount}`);
        console.log(`  blob links: ${blobLinks}`);
        console.log(`  download links: ${downloadLinks}`);
        console.log(`  total links: ${allLinks}`);
        
        // Check last few body divs
        const bodyDivs = document.querySelectorAll('body > div');
        for (let i = Math.max(0, bodyDivs.length - 5); i < bodyDivs.length; i++) {
            const div = bodyDivs[i];
            const links = div.querySelectorAll('a');
            if (links.length > 0) {
                console.log(`  body > div[${i + 1}] has ${links.length} links`);
                links.forEach(link => {
                    console.log(`    - "${link.textContent.trim()}" ${link.download ? `(download: ${link.download})` : ''}`);
                });
            }
        }
    }
    
    // Helper: Find download link with detailed logging
    function findDownloadLink() {
        console.log('\n🔎 Searching for download link...');
        
        // Method 1: Links with blob href AND download attribute
        const blobDownloadLinks = document.querySelectorAll('a[href^="blob:"][download]');
        console.log(`  Found ${blobDownloadLinks.length} blob links with download attribute`);
        
        if (blobDownloadLinks.length > 0) {
            const link = blobDownloadLinks[blobDownloadLinks.length - 1];
            console.log(`  ✅ Using blob download link: "${link.textContent.trim()}"`);
            return link;
        }
        
        // Method 2: Any link with download attribute
        const downloadLinks = document.querySelectorAll('a[download]');
        console.log(`  Found ${downloadLinks.length} links with download attribute`);
        
        if (downloadLinks.length > 0) {
            const link = downloadLinks[downloadLinks.length - 1];
            console.log(`  ✅ Using download link: "${link.textContent.trim()}"`);
            return link;
        }
        
        // Method 3: Links with "Download" in text
        const allLinks = document.querySelectorAll('a');
        console.log(`  Checking ${allLinks.length} total links for "Download" text...`);
        
        for (const link of allLinks) {
            const text = link.textContent || '';
            if (text.includes('Download')) {
                console.log(`  ✅ Found link with "Download" text: "${text.trim()}"`);
                return link;
            }
        }
        
        // Method 4: Any blob links
        const blobLinks = document.querySelectorAll('a[href^="blob:"]');
        console.log(`  Found ${blobLinks.length} blob links (without download attr)`);
        
        if (blobLinks.length > 0) {
            const link = blobLinks[blobLinks.length - 1];
            console.log(`  ✅ Using blob link: "${link.textContent.trim()}"`);
            return link;
        }
        
        console.log('  ❌ No download link found by any method');
        return null;
    }
    
    // Process single artifact
    async function processArtifact(button, index, total) {
        console.log(`\n📦 Processing artifact ${index + 1}/${total}`);
        
        try {
            // Take initial snapshot
            debugDOMState('Before clicking artifact');
            
            // Click artifact button
            button.click();
            console.log('  ✅ Clicked artifact button');
            await wait(config.waitTimes.afterArtifactClick);
            
            // Find panel
            const panel = document.querySelector(config.panelSelector);
            if (!panel) {
                console.log('  ❌ Artifact panel not found');
                return { success: false, error: 'Panel not found' };
            }
            console.log('  ✅ Found artifact panel');
            
            // Get buttons
            const buttons = panel.querySelectorAll('button');
            console.log(`  Found ${buttons.length} buttons in panel`);
            
            // Log button details
            buttons.forEach((btn, i) => {
                const id = btn.id || 'no-id';
                const text = btn.textContent.trim() || 'no-text';
                const hasSvg = btn.querySelector('svg') ? 'YES' : 'NO';
                console.log(`    [${i}] id="${id}", text="${text}", svg=${hasSvg}`);
            });
            
            // Take snapshot before dropdown
            debugDOMState('Before clicking dropdown');
            
            // Click dropdown
            if (buttons.length > config.dropdownButtonIndex) {
                const dropdownBtn = buttons[config.dropdownButtonIndex];
                console.log(`\n  Clicking dropdown button at index ${config.dropdownButtonIndex}`);
                
                dropdownBtn.click();
                await wait(config.waitTimes.afterDropdownClick);
                
                // Take snapshot after dropdown
                debugDOMState('After clicking dropdown');
                
                // Find download link
                const downloadLink = findDownloadLink();
                
                if (downloadLink) {
                    const filename = downloadLink.getAttribute('download') || `artifact_${index + 1}`;
                    console.log(`\n  📥 Downloading: ${filename}`);
                    
                    downloadLink.click();
                    await wait(config.waitTimes.afterDownload);
                    
                    // Close panel
                    document.body.click();
                    
                    return { success: true, filename };
                } else {
                    // Close panel
                    document.body.click();
                    return { success: false, error: 'Download link not found' };
                }
            } else {
                return { success: false, error: 'Dropdown button not found' };
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
            console.log('No artifacts found');
            return;
        }
        
        // Process just the first artifact for debugging
        const result = await processArtifact(artifacts[0], 0, artifacts.length);
        
        console.log('\n' + '='.repeat(60));
        console.log('Debug run complete');
        console.log(`Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        if (!result.success) {
            console.log(`Error: ${result.error}`);
        }
        
        // Store result
        window.debugResult = result;
        console.log('\n💾 Result stored in window.debugResult');
    }
    
    // Start
    console.log('Starting debug run in 2 seconds...\n');
    
    setTimeout(downloadAllArtifacts, 2000);
    
})();