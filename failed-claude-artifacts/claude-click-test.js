// Test different ways to click the dropdown
(async function() {
    'use strict';
    
    console.log('🔍 Claude Click Test\n');
    
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
    
    // Log button details
    console.log('\nButton details:');
    console.log('  ID:', dropdownButton.id);
    console.log('  Disabled:', dropdownButton.disabled);
    console.log('  Aria-expanded:', dropdownButton.getAttribute('aria-expanded'));
    console.log('  Aria-haspopup:', dropdownButton.getAttribute('aria-haspopup'));
    
    // Try different click methods
    console.log('\n=== Method 1: Regular click() ===');
    dropdownButton.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    checkForMenu();
    
    // If no menu, try mouse event
    console.log('\n=== Method 2: Mouse event ===');
    const event = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    });
    dropdownButton.dispatchEvent(event);
    await new Promise(resolve => setTimeout(resolve, 500));
    checkForMenu();
    
    // Try pointer event
    console.log('\n=== Method 3: Pointer event ===');
    const pointerEvent = new PointerEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        pointerType: 'mouse'
    });
    dropdownButton.dispatchEvent(pointerEvent);
    await new Promise(resolve => setTimeout(resolve, 500));
    checkForMenu();
    
    // Try focusing first
    console.log('\n=== Method 4: Focus then click ===');
    dropdownButton.focus();
    await new Promise(resolve => setTimeout(resolve, 100));
    dropdownButton.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    checkForMenu();
    
    // Check if aria-expanded changed
    console.log('\nAfter all attempts:');
    console.log('  Aria-expanded:', dropdownButton.getAttribute('aria-expanded'));
    
    function checkForMenu() {
        // Check for new elements
        const newBodyCount = document.body.children.length;
        console.log(`  Body children: ${newBodyCount}`);
        
        // Check for download links
        const downloadLinks = document.querySelectorAll('a[href^="blob:"]');
        console.log(`  Blob links found: ${downloadLinks.length}`);
        
        // Check for radix content
        const radixContent = document.querySelectorAll('[id^="radix-"][id$="-content-"]');
        console.log(`  Radix content elements: ${radixContent.length}`);
        
        // Check if any element contains "Download as"
        const allElements = document.querySelectorAll('*');
        let downloadElements = 0;
        for (const el of allElements) {
            if (el.textContent && el.textContent.includes('Download as') && 
                !el.textContent.includes('Downloaded')) {
                downloadElements++;
            }
        }
        console.log(`  Elements with "Download as": ${downloadElements}`);
    }
    
})();