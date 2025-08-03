// Claude Artifact List Downloader - Downloads all artifacts from the dropdown list

(async function() {
    'use strict';
    
    console.log('📋 Claude Artifact List Downloader');
    console.log('=' .repeat(60));
    
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    // Step 1: Find and click the artifact list button
    console.log('🔍 Looking for artifact list button...');
    
    // Find the button that opens the artifact list (with the specific SVG)
    let listButton = null;
    const buttons = document.querySelectorAll('button[id^="radix-"]');
    
    for (const btn of buttons) {
        const svg = btn.querySelector('svg');
        if (svg) {
            // Check if this might be the list button
            const path = btn.querySelector('svg path');
            if (path) {
                const d = path.getAttribute('d') || '';
                // You mentioned radix-_r_1ge_ has the list
                if (btn.id && (btn.id.includes('1ge') || d.includes('M4.25 14.25'))) {
                    listButton = btn;
                    console.log(`✅ Found list button: ${btn.id}`);
                    break;
                }
            }
        }
    }
    
    if (!listButton) {
        console.log('❌ Could not find artifact list button');
        return;
    }
    
    // Click to open the list
    listButton.click();
    console.log('📂 Opened artifact list');
    await wait(1000);
    
    // Step 2: Find the list container
    // Looking for something like radix-_r_1gf_ based on your selectors
    let listContainer = null;
    const possibleContainers = document.querySelectorAll('[id^="radix-"][id$="_"]');
    
    for (const container of possibleContainers) {
        // Check if it has list items
        const listItems = container.querySelectorAll('li');
        if (listItems.length > 0) {
            listContainer = container;
            console.log(`✅ Found list container: ${container.id} with ${listItems.length} items`);
            break;
        }
    }
    
    if (!listContainer) {
        console.log('❌ Could not find artifact list container');
        return;
    }
    
    // Step 3: Process each artifact in the list
    const listItems = listContainer.querySelectorAll('li');
    console.log(`\n📦 Processing ${listItems.length} artifacts...\n`);
    
    for (let i = 0; i < listItems.length; i++) {
        const item = listItems[i];
        console.log(`[${i + 1}/${listItems.length}] Processing artifact...`);
        
        // Get artifact name
        const nameElement = item.querySelector('span, div');
        const artifactName = nameElement ? nameElement.textContent.trim() : `Artifact ${i + 1}`;
        console.log(`  Name: ${artifactName}`);
        
        // Click on the artifact to select/open it
        item.click();
        await wait(1000);
        
        // Now look for the download button in the opened artifact panel
        // Find the dropdown button with the download arrow (M14.128 7.16482...)
        const panelButtons = document.querySelectorAll('button');
        let downloadDropdown = null;
        
        for (const btn of panelButtons) {
            const path = btn.querySelector('svg path');
            if (path) {
                const d = path.getAttribute('d') || '';
                if (d.startsWith('M14.128 7.16482')) {
                    downloadDropdown = btn;
                    console.log(`  Found download dropdown: ${btn.id || 'button'}`);
                    break;
                }
            }
        }
        
        if (downloadDropdown) {
            // Click dropdown
            downloadDropdown.click();
            await wait(500);
            
            // Look for download link
            const downloadLinks = document.querySelectorAll('a');
            let found = false;
            
            for (const link of downloadLinks) {
                const text = link.textContent || '';
                if (text.includes('Download as')) {
                    console.log(`  ✅ Downloading: ${link.getAttribute('download') || artifactName}`);
                    link.click();
                    found = true;
                    await wait(500);
                    break;
                }
            }
            
            if (!found) {
                console.log('  ❌ Download link not found');
            }
            
            // Close dropdown by clicking elsewhere
            document.body.click();
            await wait(500);
        } else {
            console.log('  ❌ Download dropdown not found');
        }
        
        // Small delay before next artifact
        await wait(1000);
    }
    
    console.log('\n✅ Artifact processing complete!');
    console.log('💡 Check your downloads folder');
    
})();