// Claude Artifacts Downloader - Downloads all artifacts from current conversation
// Single responsibility: Download artifact files only

(async function() {
    'use strict';
    
    console.log('📦 Claude Artifacts Downloader');
    console.log('Downloads all artifacts from current conversation');
    console.log('=' .repeat(50));
    
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
        console.log(`  [${index + 1}/${total}] Processing artifact...`);
        
        try {
            // Click artifact button
            button.click();
            await wait(config.waitTimes.afterArtifactClick);
            
            // Find panel
            const panel = document.querySelector(config.panelSelector);
            if (!panel) {
                throw new Error('Panel not found');
            }
            
            // Find dropdown button (radix button with SVG)
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
            
            if (!dropdownButton) {
                throw new Error('Dropdown button not found');
            }
            
            // Click dropdown
            dropdownButton.click();
            await wait(config.waitTimes.afterDropdownClick);
            
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
            
            if (!downloadLink) {
                throw new Error('Download link not found');
            }
            
            // Get filename and download
            const filename = downloadLink.getAttribute('download') || `artifact_${index + 1}`;
            console.log(`    ✅ Downloading: ${filename}`);
            downloadLink.click();
            
            // Close panel
            await wait(config.waitTimes.afterDownload);
            document.body.click();
            await wait(config.waitTimes.betweenArtifacts);
            
            return {
                success: true,
                filename: filename
            };
            
        } catch (error) {
            console.log(`    ❌ Error: ${error.message}`);
            // Ensure panel is closed
            document.body.click();
            await wait(config.waitTimes.betweenArtifacts);
            
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Main function
    async function downloadAllArtifacts() {
        const artifactButtons = document.querySelectorAll(config.artifactButtonSelector);
        console.log(`Found ${artifactButtons.length} artifacts`);
        
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
        
        // Process each artifact
        for (let i = 0; i < artifactButtons.length; i++) {
            const result = await downloadSingleArtifact(artifactButtons[i], i, artifactButtons.length);
            
            if (result.success) {
                results.downloaded.push(result.filename);
            } else {
                results.failed.push({
                    index: i + 1,
                    error: result.error
                });
            }
        }
        
        // Summary
        console.log('\n📊 Summary:');
        console.log(`  Total artifacts: ${results.total}`);
        console.log(`  ✅ Downloaded: ${results.downloaded.length}`);
        console.log(`  ❌ Failed: ${results.failed.length}`);
        
        if (results.failed.length > 0) {
            results.success = false;
        }
        
        return results;
    }
    
    // Execute
    const result = await downloadAllArtifacts();
    window.lastArtifactsResult = result;
    
    console.log('\n💾 Result stored in window.lastArtifactsResult');
    
    // Return for wrapper scripts
    return result;
    
})();