// Claude Artifact Downloader - Final Version
// Based on confirmed DOM structure from live testing

(async function() {
    'use strict';
    
    console.log('🚀 Claude Artifact Downloader - Final Version');
    console.log('=' .repeat(60));
    
    // Configuration based on confirmed findings
    const config = {
        artifactButtonSelector: 'button[aria-label="Preview contents"]',
        panelSelector: '[class*="basis-0"]',
        dropdownButtonIndex: 1, // Second button (after Copy)
        waitTimes: {
            afterArtifactClick: 1500,
            afterDropdownClick: 500,
            afterDownload: 300,
            betweenArtifacts: 500
        }
    };
    
    // Helper: Wait
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    // Helper: Find download link after dropdown opens
    function findDownloadLink() {
        // The download link appears in a new DIV added to body
        // Look for links with blob: href and download attribute
        const links = document.querySelectorAll('a[href^="blob:"][download]');
        
        if (links.length > 0) {
            // Get the most recent one (likely the one we just opened)
            const link = links[links.length - 1];
            return link;
        }
        
        // Fallback: look for any link with "Download" text
        const allLinks = document.querySelectorAll('a');
        for (const link of allLinks) {
            if (link.textContent.includes('Download') && link.href?.includes('blob:')) {
                return link;
            }
        }
        
        return null;
    }
    
    // Process single artifact
    async function processArtifact(button, index, total) {
        console.log(`\n📦 Processing artifact ${index + 1}/${total}`);
        
        try {
            // Click artifact button to open panel
            button.click();
            console.log('  ✅ Clicked artifact button');
            await wait(config.waitTimes.afterArtifactClick);
            
            // Find the artifact panel
            const panel = document.querySelector(config.panelSelector);
            if (!panel) {
                console.log('  ❌ Artifact panel not found');
                return { success: false, error: 'Panel not found' };
            }
            console.log('  ✅ Found artifact panel');
            
            // Get all buttons in the panel
            const buttons = panel.querySelectorAll('button');
            console.log(`  Found ${buttons.length} buttons in panel`);
            
            // Click the dropdown button (usually second button with SVG)
            if (buttons.length > config.dropdownButtonIndex) {
                const dropdownBtn = buttons[config.dropdownButtonIndex];
                const btnId = dropdownBtn.id || 'no-id';
                console.log(`  Clicking dropdown button: ${btnId}`);
                
                dropdownBtn.click();
                await wait(config.waitTimes.afterDropdownClick);
                
                // Find and click the download link
                const downloadLink = findDownloadLink();
                if (downloadLink) {
                    const filename = downloadLink.getAttribute('download') || `artifact_${index + 1}`;
                    console.log(`  ✅ Found download link: "${downloadLink.textContent.trim()}"`);
                    console.log(`  📥 Downloading: ${filename}`);
                    
                    downloadLink.click();
                    await wait(config.waitTimes.afterDownload);
                    
                    // Close panel
                    const closeBtn = panel.querySelector('button[aria-label="Close"]');
                    if (closeBtn) {
                        closeBtn.click();
                    } else {
                        // Click outside to close
                        document.body.click();
                    }
                    
                    return { success: true, filename };
                } else {
                    console.log('  ❌ Download link not found');
                    
                    // Close panel anyway
                    document.body.click();
                    
                    return { success: false, error: 'Download link not found' };
                }
            } else {
                console.log(`  ❌ Dropdown button not found at index ${config.dropdownButtonIndex}`);
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
            console.log('No artifacts found in this conversation');
            return;
        }
        
        const results = {
            total: artifacts.length,
            successful: 0,
            failed: 0,
            downloads: []
        };
        
        // Process each artifact
        for (let i = 0; i < artifacts.length; i++) {
            const result = await processArtifact(artifacts[i], i, artifacts.length);
            
            if (result.success) {
                results.successful++;
                results.downloads.push(result.filename);
            } else {
                results.failed++;
            }
            
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
        
        if (results.successful > 0) {
            console.log('\n📥 Downloaded files:');
            results.downloads.forEach(file => console.log(`   - ${file}`));
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