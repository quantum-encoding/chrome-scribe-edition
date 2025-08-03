// Debug what happens after clicking dropdown
(async function() {
    'use strict';
    
    console.log('🔍 Claude Dropdown Menu Debug\n');
    
    // Find and click first artifact
    const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
    if (artifactButtons.length === 0) {
        console.log('No artifacts found');
        return;
    }
    
    console.log('Clicking first artifact...');
    artifactButtons[0].click();
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Find panel
    const panel = document.querySelector('[class*="basis-0"]') || 
                 document.evaluate('/html/body/div[4]/div[2]/div/div[3]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    
    if (!panel) {
        console.log('❌ Panel not found');
        return;
    }
    
    // Find dropdown button by SVG path
    const buttons = panel.querySelectorAll('button[id^="radix-"]');
    let dropdownButton = null;
    
    for (const btn of buttons) {
        const svg = btn.querySelector('svg');
        if (svg) {
            const path = svg.querySelector('path');
            if (path && path.getAttribute('d') && path.getAttribute('d').includes('M14.128 7.16482')) {
                dropdownButton = btn;
                console.log(`Found dropdown button: ${btn.id}`);
                break;
            }
        }
    }
    
    if (!dropdownButton) {
        console.log('❌ Dropdown button not found');
        return;
    }
    
    // Take snapshot before clicking
    console.log('\n=== BEFORE CLICK ===');
    console.log('Body children count:', document.body.children.length);
    console.log('Last 3 body children IDs:', Array.from(document.body.children).slice(-3).map(el => el.id || 'no-id'));
    
    // Click dropdown
    console.log('\nClicking dropdown...');
    dropdownButton.click();
    
    // Monitor changes over time
    for (let i = 1; i <= 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log(`\n=== After ${i * 100}ms ===`);
        
        // Check body children
        const bodyChildren = document.body.children;
        console.log('Body children count:', bodyChildren.length);
        
        // Check last few elements
        const lastElements = Array.from(bodyChildren).slice(-5);
        lastElements.forEach((el, idx) => {
            const links = el.querySelectorAll('a');
            if (links.length > 0) {
                console.log(`\nbody > div[${bodyChildren.length - 5 + idx}]:`, el.id || 'no-id');
                links.forEach(link => {
                    console.log(`  Link: "${link.textContent?.trim()}"`);
                    console.log(`  href: ${link.href?.substring(0, 50)}...`);
                    console.log(`  download: ${link.getAttribute('download')}`);
                });
            }
        });
        
        // Check for radix content
        const radixContent = document.querySelectorAll('[id^="radix-"][id$="-content-"]');
        if (radixContent.length > 0) {
            console.log(`\nFound ${radixContent.length} radix content elements`);
            radixContent.forEach(el => {
                const links = el.querySelectorAll('a');
                if (links.length > 0) {
                    console.log(`  ${el.id} has ${links.length} links`);
                }
            });
        }
        
        // Direct check for download link
        const downloadLink = document.querySelector('a[href^="blob:"]');
        if (downloadLink) {
            console.log('\n🎯 FOUND DOWNLOAD LINK!');
            console.log(`Text: "${downloadLink.textContent}"`);
            console.log(`Parent chain: ${getParentChain(downloadLink)}`);
            break;
        }
    }
    
    function getParentChain(element) {
        let chain = [];
        let el = element;
        for (let i = 0; i < 5 && el; i++) {
            if (el.tagName) {
                let desc = el.tagName.toLowerCase();
                if (el.id) desc += `#${el.id}`;
                if (el.className && typeof el.className === 'string') {
                    desc += '.' + el.className.split(' ').slice(0, 2).join('.');
                }
                chain.push(desc);
            }
            el = el.parentElement;
        }
        return chain.join(' > ');
    }
    
})();