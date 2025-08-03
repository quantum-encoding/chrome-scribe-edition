// Claude Artifact Debug - Let's see what's actually happening
// Paste this in F12 to debug the artifact download process

(async function() {
    'use strict';
    
    console.log('🔍 Claude Artifact Debug Tool');
    console.log('=' .repeat(60));
    
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    // Test on first artifact only
    const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
    console.log(`Found ${artifactButtons.length} artifact buttons`);
    
    if (artifactButtons.length === 0) {
        console.log('No artifacts found');
        return;
    }
    
    console.log('\n🎯 Testing first artifact...');
    
    // Click first artifact
    artifactButtons[0].click();
    await wait(1500);
    
    // Find panel
    const panel = document.querySelector('[class*="basis-0"]');
    if (!panel) {
        console.log('❌ Panel not found');
        return;
    }
    console.log('✅ Panel found');
    
    // List ALL buttons in panel
    const allButtons = panel.querySelectorAll('button');
    console.log(`\n📋 All buttons in panel (${allButtons.length} total):`);
    
    allButtons.forEach((btn, i) => {
        const id = btn.id || 'no-id';
        const text = btn.textContent.trim() || 'no-text';
        const aria = btn.getAttribute('aria-label') || 'no-aria';
        const hasSvg = btn.querySelector('svg') ? 'YES' : 'NO';
        const svgPath = btn.querySelector('svg path')?.getAttribute('d')?.substring(0, 30) || 'no-path';
        
        console.log(`[${i}] id="${id}", text="${text}", aria="${aria}", svg=${hasSvg}, path="${svgPath}..."`);
    });
    
    // Find radix buttons specifically
    const radixButtons = panel.querySelectorAll('button[id^="radix-"]');
    console.log(`\n🎯 Radix buttons found: ${radixButtons.length}`);
    
    // Try clicking each radix button to see what happens
    for (let i = 0; i < radixButtons.length; i++) {
        const btn = radixButtons[i];
        console.log(`\n🔽 Clicking radix button ${i}: ${btn.id}`);
        
        // Record DOM state before click
        const beforeLinks = document.querySelectorAll('a').length;
        const beforeDivs = document.querySelectorAll('body > div').length;
        
        // Click
        btn.click();
        await wait(1000);
        
        // Check DOM changes
        const afterLinks = document.querySelectorAll('a').length;
        const afterDivs = document.querySelectorAll('body > div').length;
        
        console.log(`   Links: ${beforeLinks} → ${afterLinks} (${afterLinks - beforeLinks} new)`);
        console.log(`   Body divs: ${beforeDivs} → ${afterDivs} (${afterDivs - beforeDivs} new)`);
        
        // Look for new links
        if (afterLinks > beforeLinks) {
            console.log('   ✅ New links appeared!');
            
            // Find all links and check for download
            const allLinks = document.querySelectorAll('a');
            let foundDownload = false;
            
            for (const link of allLinks) {
                const text = link.textContent.trim();
                const href = link.href || '';
                const download = link.getAttribute('download') || '';
                
                if (text.includes('Download') || download || href.includes('blob:')) {
                    console.log(`   🎯 FOUND DOWNLOAD LINK: "${text}"`);
                    console.log(`      href: ${href.substring(0, 50)}...`);
                    console.log(`      download: "${download}"`);
                    console.log(`      parent: ${link.parentElement.tagName}`);
                    console.log(`      location: ${getElementPath(link)}`);
                    foundDownload = true;
                    
                    // Store reference
                    window.debugDownloadLink = link;
                    console.log('      💾 Stored in window.debugDownloadLink');
                }
            }
            
            if (!foundDownload) {
                console.log('   ❌ No download links in new links');
            }
        }
        
        // Click again to close dropdown
        btn.click();
        await wait(500);
    }
    
    // Helper to get element path
    function getElementPath(elem) {
        const path = [];
        let current = elem;
        
        while (current && current !== document.body) {
            let selector = current.tagName.toLowerCase();
            if (current.id) {
                selector += `#${current.id}`;
            }
            path.unshift(selector);
            current = current.parentElement;
        }
        
        return 'body > ' + path.join(' > ');
    }
    
    console.log('\n💡 Debug complete. Check window.debugDownloadLink if found');
    
})();