// Claude Artifacts Downloader - Just downloads artifacts
// Opens artifacts panel and downloads all artifacts

(function() {
    'use strict';
    
    console.log('📦 Claude Artifacts Downloader Starting...');
    
    // Main function to download all artifacts
    async function downloadAllArtifacts() {
        // First check if artifacts panel is already open
        let artifactsPanel = document.evaluate('/html/body/div[4]/div[2]/div/div[3]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        
        if (!artifactsPanel) {
            console.log('Opening artifacts panel...');
            // Click the artifacts button in header to open panel
            const artifactsButton = document.querySelector('button[aria-label*="artifact"], button:has(svg):has(+ span:contains("Artifacts"))');
            if (artifactsButton) {
                artifactsButton.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                artifactsPanel = document.evaluate('/html/body/div[4]/div[2]/div/div[3]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            }
        }
        
        if (!artifactsPanel) {
            console.log('❌ Could not open artifacts panel');
            return 0;
        }
        
        // Find all artifact items in the list
        const artifactListXPath = '/html/body/div[4]/div[2]/div/div[3]/div/div[2]/div/div/div[1]/div[1]/ul';
        const listResult = document.evaluate(artifactListXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const listElement = listResult.singleNodeValue;
        
        if (!listElement) {
            console.log('❌ No artifacts list found');
            return 0;
        }
        
        const listItems = listElement.querySelectorAll('li');
        console.log(`Found ${listItems.length} artifacts to download`);
        
        let downloadCount = 0;
        
        // Process each artifact
        for (let i = 0; i < listItems.length; i++) {
            console.log(`\nProcessing artifact ${i + 1}/${listItems.length}`);
            
            // Click on the artifact to select it
            const artifactItem = listItems[i].querySelector('div > div');
            if (artifactItem) {
                artifactItem.click();
                await new Promise(resolve => setTimeout(resolve, 800));
            }
            
            // Find the dropdown button (it's the button with SVG after the Copy button)
            const buttons = artifactsPanel.querySelectorAll('button');
            let dropdownButton = null;
            
            for (const btn of buttons) {
                if (btn.id && btn.id.startsWith('radix-') && btn.querySelector('svg')) {
                    const parentButtons = btn.parentElement?.querySelectorAll('button');
                    if (parentButtons && parentButtons.length >= 2) {
                        dropdownButton = btn;
                        break;
                    }
                }
            }
            
            if (!dropdownButton) {
                console.log('  ❌ Dropdown button not found');
                continue;
            }
            
            // Click dropdown
            dropdownButton.click();
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Find and click download link
            const downloadLink = document.querySelector('a[download][href^="blob:"]');
            
            if (downloadLink) {
                const filename = downloadLink.getAttribute('download') || `artifact_${i + 1}`;
                console.log(`  ✅ Downloading: ${filename}`);
                downloadLink.click();
                downloadCount++;
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                console.log('  ❌ Download link not found');
            }
            
            // Click outside to close dropdown
            document.body.click();
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        return downloadCount;
    }
    
    // Run the downloader
    downloadAllArtifacts().then(count => {
        console.log(`\n✅ Complete! Downloaded ${count} artifacts`);
        console.log('💡 Check your downloads folder');
    });
    
})();