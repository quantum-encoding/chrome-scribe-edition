// Debug script to find download link after clicking dropdown
(async function() {
    'use strict';
    
    console.log('🔍 Claude Artifact Download Debug V2\n');
    
    // Find artifact buttons
    const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
    console.log(`Found ${artifactButtons.length} artifact buttons`);
    
    if (artifactButtons.length === 0) {
        console.log('No artifacts found');
        return;
    }
    
    // Click first artifact
    console.log('\nClicking first artifact...');
    artifactButtons[0].click();
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Find panel
    const panel = document.querySelector('[class*="basis-0"]') || 
                 document.evaluate('/html/body/div[4]/div[2]/div/div[3]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    
    if (!panel) {
        console.log('❌ Panel not found');
        return;
    }
    
    console.log('✅ Panel found');
    
    // Find dropdown button
    const buttons = panel.querySelectorAll('button');
    let dropdownButton = null;
    
    for (let i = 0; i < buttons.length; i++) {
        const btn = buttons[i];
        if (btn.id && btn.id.startsWith('radix-') && btn.querySelector('svg')) {
            const parentButtons = btn.parentElement?.querySelectorAll('button');
            if (parentButtons && parentButtons.length >= 2) {
                dropdownButton = btn;
                console.log(`✅ Found dropdown button: ${btn.id}`);
                break;
            }
        }
    }
    
    if (!dropdownButton) {
        console.log('❌ Dropdown button not found');
        return;
    }
    
    // Click dropdown
    console.log('\nClicking dropdown...');
    dropdownButton.click();
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('\n=== Searching for download link ===');
    
    // Method 1: Direct selector
    let downloadLink = document.querySelector('a[download][href^="blob:"]');
    if (downloadLink) {
        console.log('✅ Found via direct selector');
    }
    
    // Method 2: Search all links
    if (!downloadLink) {
        const allLinks = document.querySelectorAll('a');
        console.log(`Checking ${allLinks.length} links...`);
        
        for (const link of allLinks) {
            const text = link.textContent || '';
            const href = link.getAttribute('href') || '';
            const download = link.getAttribute('download') || '';
            
            // Log links that might be download links
            if (href.includes('blob:') || download || text.includes('Download')) {
                console.log(`\nPotential download link:`);
                console.log(`  Text: "${text.trim()}"`);
                console.log(`  href: ${href.substring(0, 50)}...`);
                console.log(`  download: ${download}`);
                console.log(`  Parent: ${link.parentElement?.tagName}`);
                
                if (text.includes('Download as') || (href.includes('blob:') && download)) {
                    downloadLink = link;
                    console.log('  ✅ This is our download link!');
                    break;
                }
            }
        }
    }
    
    // Method 3: Check new body > div elements
    if (!downloadLink) {
        console.log('\nChecking body > div elements...');
        const bodyDivs = document.querySelectorAll('body > div');
        
        for (let i = bodyDivs.length - 1; i >= Math.max(0, bodyDivs.length - 5); i--) {
            const div = bodyDivs[i];
            const links = div.querySelectorAll('a');
            if (links.length > 0) {
                console.log(`\nbody > div[${i}] has ${links.length} links`);
                for (const link of links) {
                    const text = link.textContent || '';
                    if (text.includes('Download')) {
                        console.log(`  Found: "${text}"`);
                        downloadLink = link;
                        break;
                    }
                }
            }
        }
    }
    
    // Method 4: Check for radix content
    if (!downloadLink) {
        console.log('\nChecking radix content...');
        const radixElements = document.querySelectorAll('[id^="radix-"][id$="-content-"]');
        console.log(`Found ${radixElements.length} radix content elements`);
        
        for (const elem of radixElements) {
            const links = elem.querySelectorAll('a');
            if (links.length > 0) {
                console.log(`  Radix element ${elem.id} has ${links.length} links`);
                for (const link of links) {
                    console.log(`    Link: "${link.textContent?.trim()}"`);
                    if (link.getAttribute('href')?.includes('blob:')) {
                        downloadLink = link;
                        console.log('    ✅ Found blob link!');
                        break;
                    }
                }
            }
        }
    }
    
    // Final result
    console.log('\n=== FINAL RESULT ===');
    if (downloadLink) {
        console.log('✅ Download link found!');
        console.log(`  Text: "${downloadLink.textContent}"`);
        console.log(`  href: ${downloadLink.getAttribute('href')}`);
        console.log(`  download: ${downloadLink.getAttribute('download')}`);
        
        // Try clicking it
        console.log('\nClicking download link...');
        downloadLink.click();
        console.log('✅ Click sent!');
    } else {
        console.log('❌ No download link found');
        
        // Debug: Show what we see in the dropdown area
        console.log('\nDebug - Dropdown button parent HTML:');
        console.log(dropdownButton.parentElement?.outerHTML.substring(0, 200) + '...');
        
        console.log('\nDebug - Last 5 body > div elements:');
        const bodyDivs = document.querySelectorAll('body > div');
        for (let i = Math.max(0, bodyDivs.length - 5); i < bodyDivs.length; i++) {
            const div = bodyDivs[i];
            console.log(`  div[${i}]: ${div.id || 'no-id'}, children: ${div.children.length}`);
        }
    }
    
})();