// Claude Manual Mimic - Exactly replicate manual download process
(async function() {
    'use strict';
    
    console.log('🎯 Claude Manual Mimic Script\n');
    console.log('This script will show you exactly what to click\n');
    
    // Find artifact buttons
    const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
    console.log(`Found ${artifactButtons.length} artifacts to download\n`);
    
    if (artifactButtons.length === 0) {
        console.log('No artifacts found!');
        return;
    }
    
    let currentIndex = 0;
    
    async function processArtifact() {
        if (currentIndex >= artifactButtons.length) {
            console.log('\n✅ All artifacts processed!');
            return;
        }
        
        console.log(`\n📦 Artifact ${currentIndex + 1}/${artifactButtons.length}`);
        
        // Step 1: Highlight and click artifact button
        const artifactBtn = artifactButtons[currentIndex];
        artifactBtn.style.border = '3px solid blue';
        artifactBtn.style.boxShadow = '0 0 20px blue';
        console.log('1️⃣ Clicking artifact button (blue)...');
        artifactBtn.click();
        
        // Wait for panel
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Step 2: Find dropdown button
        const panel = document.querySelector('[class*="basis-0"]') || 
                     document.evaluate('/html/body/div[4]/div[2]/div/div[3]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        
        if (!panel) {
            console.log('❌ Panel not found');
            artifactBtn.style.border = '';
            artifactBtn.style.boxShadow = '';
            currentIndex++;
            processArtifact();
            return;
        }
        
        // Find dropdown button with arrow SVG
        let dropdownButton = null;
        const buttons = panel.querySelectorAll('button');
        
        for (const btn of buttons) {
            const svg = btn.querySelector('svg');
            if (svg && svg.querySelector('path[d*="M14.128 7.16482"]')) {
                dropdownButton = btn;
                break;
            }
        }
        
        if (dropdownButton) {
            // Highlight dropdown
            dropdownButton.style.border = '3px solid red';
            dropdownButton.style.boxShadow = '0 0 20px red';
            console.log('2️⃣ MANUALLY CLICK THE RED DROPDOWN BUTTON!');
            
            // Set up observer to watch for download link
            const observer = new MutationObserver((mutations) => {
                // Look for download link
                const downloadLink = document.querySelector('a[href^="blob:"][download]');
                if (downloadLink && downloadLink.textContent?.includes('Download')) {
                    console.log('3️⃣ Found download link, auto-clicking...');
                    downloadLink.click();
                    
                    // Clean up
                    observer.disconnect();
                    artifactBtn.style.border = '';
                    artifactBtn.style.boxShadow = '';
                    dropdownButton.style.border = '';
                    dropdownButton.style.boxShadow = '';
                    
                    // Close panel and continue
                    setTimeout(() => {
                        const closeBtn = panel.querySelector('button[aria-label="Close"]');
                        if (closeBtn) closeBtn.click();
                        else document.body.click();
                        
                        currentIndex++;
                        setTimeout(() => processArtifact(), 1000);
                    }, 500);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
        } else {
            console.log('❌ Dropdown button not found');
            artifactBtn.style.border = '';
            artifactBtn.style.boxShadow = '';
            currentIndex++;
            processArtifact();
        }
    }
    
    // Start processing
    console.log('Starting artifact download process...');
    console.log('You need to manually click the RED dropdown buttons!');
    processArtifact();
    
})();