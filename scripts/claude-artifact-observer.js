// Claude Artifact Observer - Watch for DOM changes when dropdown is clicked

(async function() {
    'use strict';
    
    console.log('👁️ Claude Artifact DOM Observer');
    console.log('=' .repeat(60));
    
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    // Open first artifact
    const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
    if (artifactButtons.length === 0) {
        console.log('No artifacts found');
        return;
    }
    
    console.log(`Found ${artifactButtons.length} artifacts`);
    console.log('Opening first artifact...');
    
    artifactButtons[0].click();
    await wait(1500);
    
    const panel = document.querySelector('[class*="basis-0"]');
    if (!panel) {
        console.log('Panel not found');
        return;
    }
    
    // Find the dropdown button (second radix button based on your output)
    const radixButtons = panel.querySelectorAll('button[id^="radix-"]');
    if (radixButtons.length < 2) {
        console.log('Not enough radix buttons');
        return;
    }
    
    const dropdownBtn = radixButtons[1]; // radix-_r_1gs_ from your output
    console.log(`\n🎯 Found dropdown button: ${dropdownBtn.id}`);
    
    // Set up mutation observer BEFORE clicking
    let capturedLinks = [];
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Check this node and all its descendants for links
                        const links = node.querySelectorAll ? node.querySelectorAll('a') : [];
                        if (node.tagName === 'A') {
                            links.push(node);
                        }
                        
                        links.forEach(link => {
                            const text = link.textContent.trim();
                            const href = link.href || link.getAttribute('href') || '';
                            const download = link.getAttribute('download') || '';
                            
                            if (text || href || download) {
                                capturedLinks.push({
                                    text,
                                    href: href.substring(0, 100),
                                    download,
                                    timestamp: Date.now(),
                                    parent: link.parentElement?.tagName,
                                    path: getPath(link)
                                });
                                
                                console.log(`🎯 CAPTURED LINK: "${text}"`);
                                if (download) console.log(`   Download: ${download}`);
                                
                                // Store the actual element
                                window.capturedDownloadLink = link;
                            }
                        });
                    }
                });
            }
        });
    });
    
    // Start observing BEFORE click
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('Observer active. Clicking dropdown in 1 second...');
    await wait(1000);
    
    // Click and wait
    console.log('\n🖱️ Clicking dropdown...');
    dropdownBtn.click();
    
    // Wait and keep observing
    await wait(2000);
    
    // Stop observing
    observer.disconnect();
    
    console.log('\n📊 Observer stopped. Results:');
    console.log(`Captured ${capturedLinks.length} links`);
    
    if (capturedLinks.length > 0) {
        console.log('\n📎 Captured links:');
        capturedLinks.forEach((link, i) => {
            console.log(`\n[${i}] "${link.text}"`);
            console.log(`    href: ${link.href}`);
            console.log(`    download: ${link.download}`);
            console.log(`    path: ${link.path}`);
        });
        
        console.log('\n💡 Check window.capturedDownloadLink for the actual element');
        
        // Try clicking it
        if (window.capturedDownloadLink) {
            console.log('\n🎯 Attempting to click the captured link...');
            try {
                window.capturedDownloadLink.click();
                console.log('✅ Click successful!');
            } catch (e) {
                console.log('❌ Click failed:', e.message);
            }
        }
    } else {
        console.log('\n❌ No links were captured');
        console.log('The dropdown might be using a different mechanism');
        
        // Let's check what's currently in the DOM
        console.log('\n🔍 Current state check:');
        const currentLinks = document.querySelectorAll('a');
        console.log(`Total links in page: ${currentLinks.length}`);
        
        // Check for any download-related text
        currentLinks.forEach(link => {
            const text = link.textContent.trim().toLowerCase();
            if (text.includes('download') || text.includes('save') || text.includes('export')) {
                console.log(`Found potential download link: "${link.textContent.trim()}"`);
            }
        });
    }
    
    function getPath(elem) {
        const path = [];
        let current = elem;
        while (current && current !== document.body) {
            const tag = current.tagName.toLowerCase();
            const id = current.id ? `#${current.id}` : '';
            path.unshift(tag + id);
            current = current.parentElement;
        }
        return path.join(' > ');
    }
    
})();