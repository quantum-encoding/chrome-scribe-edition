// Debug script to understand artifact download process
(async function() {
    'use strict';
    
    console.log('🔍 Claude Artifact Download Debug\n');
    
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
    console.log(`Found ${buttons.length} buttons in panel`);
    
    let dropdownButton = null;
    for (let i = 0; i < buttons.length; i++) {
        const btn = buttons[i];
        console.log(`Button ${i}: id="${btn.id}", aria-label="${btn.getAttribute('aria-label')}", has SVG: ${!!btn.querySelector('svg')}`);
        
        if (btn.id && btn.id.startsWith('radix-') && btn.querySelector('svg')) {
            const parentButtons = btn.parentElement?.querySelectorAll('button');
            if (parentButtons && parentButtons.length >= 2) {
                dropdownButton = btn;
                console.log(`✅ Found dropdown button at index ${i}`);
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
    
    // Wait and check for changes
    for (let wait = 0; wait <= 1000; wait += 100) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log(`\n=== After ${wait}ms ===`);
        
        // Check for download links
        const downloadLinks = document.querySelectorAll('a[download][href^="blob:"]');
        console.log(`Direct selector found ${downloadLinks.length} download links`);
        
        // Check for radix menus
        const radixMenus = document.querySelectorAll('div[id^="radix-"][id$="-content-"]');
        console.log(`Found ${radixMenus.length} radix menus`);
        
        // Check for any new elements with "Download"
        const allElements = document.querySelectorAll('*');
        const downloadElements = Array.from(allElements).filter(el => 
            el.textContent && el.textContent.includes('Download') && 
            !el.textContent.includes('Downloaded')
        );
        console.log(`Found ${downloadElements.length} elements with "Download" text`);
        
        if (downloadElements.length > 0) {
            downloadElements.forEach((el, i) => {
                console.log(`  Element ${i}: ${el.tagName}, text: "${el.textContent.trim().substring(0, 50)}..."`);
                if (el.tagName === 'A') {
                    console.log(`    href: ${el.getAttribute('href')}`);
                    console.log(`    download: ${el.getAttribute('download')}`);
                }
            });
        }
        
        // Check body > div elements (common for dropdown menus)
        const bodyDivs = document.querySelectorAll('body > div');
        const newDivs = Array.from(bodyDivs).filter(div => 
            div.querySelector('a[href^="blob:"]') || 
            (div.textContent && div.textContent.includes('Download'))
        );
        console.log(`Found ${newDivs.length} body > div elements with download content`);
        
        if (downloadLinks.length > 0 || newDivs.length > 0) {
            console.log('\n🎯 FOUND DOWNLOAD OPTION!');
            break;
        }
    }
    
    console.log('\n=== Final check ===');
    
    // Try to find any download link
    const finalLink = document.querySelector('a[download][href^="blob:"]') || 
                     document.querySelector('a:has-text("Download")') ||
                     Array.from(document.querySelectorAll('a')).find(a => a.textContent && a.textContent.includes('Download'));
    
    if (finalLink) {
        console.log('✅ Final link found:');
        console.log(`  Text: "${finalLink.textContent}"`);
        console.log(`  href: ${finalLink.getAttribute('href')}`);
        console.log(`  download: ${finalLink.getAttribute('download')}`);
    } else {
        console.log('❌ No download link found after all checks');
    }
    
})();