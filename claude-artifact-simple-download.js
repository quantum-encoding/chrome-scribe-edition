// Claude Artifact Simple Downloader
// Step by step: Open artifact → Click dropdown → Click download

(async function() {
    'use strict';
    
    console.log('🎯 Claude Artifact Simple Downloader');
    console.log('=' .repeat(60));
    
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    async function downloadArtifact(artifactButton, index) {
        console.log(`\n📦 Artifact ${index + 1}:`);
        
        // Step 1: Click artifact button
        artifactButton.click();
        console.log('  ✅ Opened artifact panel');
        await wait(1500);
        
        // Step 2: Find and click dropdown (button with radix ID)
        const panel = document.querySelector('[class*="basis-0"]');
        if (!panel) {
            console.log('  ❌ Panel not found');
            return false;
        }
        
        const buttons = panel.querySelectorAll('button');
        let dropdownButton = null;
        
        // Find the button with radix ID (usually index 1)
        for (let i = 0; i < buttons.length; i++) {
            if (buttons[i].id && buttons[i].id.startsWith('radix-')) {
                dropdownButton = buttons[i];
                console.log(`  ✅ Found dropdown button: ${buttons[i].id}`);
                break;
            }
        }
        
        if (!dropdownButton) {
            console.log('  ❌ Dropdown button not found');
            return false;
        }
        
        // Step 3: Click dropdown
        dropdownButton.click();
        console.log('  ✅ Clicked dropdown');
        await wait(500);
        
        // Step 4: Find and click "Download as" link
        // It appears in a new element added to body
        const downloadLinks = document.querySelectorAll('a');
        let found = false;
        
        for (const link of downloadLinks) {
            if (link.textContent.includes('Download as')) {
                console.log(`  ✅ Found download link: "${link.textContent.trim()}"`);
                console.log(`  📥 Downloading: ${link.getAttribute('download')}`);
                link.click();
                found = true;
                break;
            }
        }
        
        if (!found) {
            console.log('  ❌ Download link not found');
        }
        
        // Step 5: Close panel
        await wait(500);
        document.body.click();
        console.log('  ✅ Closed panel');
        
        return found;
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
            await wait(1000); // Wait between artifacts
        }
        
        console.log('\n' + '='.repeat(60));
        console.log(`✅ Downloaded ${successCount}/${artifactButtons.length} artifacts`);
        console.log('💡 Check your downloads folder');
    }
    
    console.log('Starting in 2 seconds...\n');
    setTimeout(main, 2000);
    
})();