// Claude Menu Capture - Captures what appears after clicking dropdown
// This will help us understand the exact DOM structure

(function() {
    'use strict';
    
    console.log('🎯 Claude Menu Capture Tool\n');
    
    window.captureMenu = async function() {
        console.log('Starting menu capture...\n');
        
        // Step 1: Click first artifact
        const artifactBtn = document.querySelector('button[aria-label="Preview contents"]');
        if (!artifactBtn) {
            console.log('No artifact button found');
            return;
        }
        
        console.log('1. Clicking artifact...');
        artifactBtn.click();
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Step 2: Find dropdown button
        const panel = document.querySelector('[class*="basis-0"]') || 
                     document.evaluate('/html/body/div[4]/div[2]/div/div[3]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        
        if (!panel) {
            console.log('Panel not found');
            return;
        }
        
        const buttons = panel.querySelectorAll('button');
        let dropdownBtn = null;
        
        for (const btn of buttons) {
            if (btn.id && btn.id.startsWith('radix-') && btn.querySelector('svg')) {
                const parentButtons = btn.parentElement?.querySelectorAll('button');
                if (parentButtons && parentButtons.length >= 2) {
                    dropdownBtn = btn;
                    break;
                }
            }
        }
        
        if (!dropdownBtn) {
            console.log('Dropdown not found');
            return;
        }
        
        console.log(`2. Found dropdown: ${dropdownBtn.id}`);
        
        // Capture DOM before click
        const divsBefore = document.querySelectorAll('body > div').length;
        const beforeSnapshot = Array.from(document.querySelectorAll('[id^="radix-"]')).map(el => ({
            id: el.id,
            tag: el.tagName,
            hasLinks: el.querySelectorAll('a').length
        }));
        
        // Click dropdown
        console.log('3. Clicking dropdown...');
        dropdownBtn.click();
        
        // Wait and capture changes
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const divsAfter = document.querySelectorAll('body > div').length;
        console.log(`\nDivs before: ${divsBefore}, after: ${divsAfter}`);
        
        // Find new radix elements
        const afterSnapshot = Array.from(document.querySelectorAll('[id^="radix-"]')).map(el => ({
            id: el.id,
            tag: el.tagName,
            hasLinks: el.querySelectorAll('a').length
        }));
        
        console.log('\n=== NEW RADIX ELEMENTS ===');
        afterSnapshot.forEach(item => {
            const existed = beforeSnapshot.find(b => b.id === item.id);
            if (!existed) {
                console.log(`NEW: ${item.id} (${item.tag}) - ${item.hasLinks} links`);
                
                // If it has links, show them
                if (item.hasLinks > 0) {
                    const element = document.getElementById(item.id);
                    const links = element.querySelectorAll('a');
                    links.forEach((link, i) => {
                        console.log(`  Link ${i}: "${link.textContent.trim()}"`);
                        console.log(`    href: ${link.getAttribute('href') || 'none'}`);
                        console.log(`    download: ${link.getAttribute('download') || 'none'}`);
                    });
                }
            }
        });
        
        // Look for any element containing "Download as"
        console.log('\n=== ELEMENTS WITH "DOWNLOAD AS" ===');
        const allElements = document.querySelectorAll('*');
        let foundCount = 0;
        
        allElements.forEach(el => {
            if (el.textContent && el.textContent.includes('Download as') && el.children.length < 2) {
                foundCount++;
                console.log(`\nFound in <${el.tagName}>:`);
                console.log(`  ID: ${el.id || 'none'}`);
                console.log(`  Classes: ${el.className || 'none'}`);
                console.log(`  Text: "${el.textContent.trim()}"`);
                
                // Get parent info
                if (el.parentElement) {
                    console.log(`  Parent: <${el.parentElement.tagName}> id="${el.parentElement.id || 'none'}"`);
                }
                
                // If it's a link
                if (el.tagName === 'A') {
                    console.log(`  href: ${el.getAttribute('href') || 'none'}`);
                    console.log(`  download: ${el.getAttribute('download') || 'none'}`);
                }
            }
        });
        
        if (foundCount === 0) {
            console.log('No "Download as" text found anywhere');
        }
        
        // Final check: All links in any radix element
        console.log('\n=== ALL LINKS IN RADIX ELEMENTS ===');
        const radixElements = document.querySelectorAll('[id^="radix-"]');
        radixElements.forEach(el => {
            const links = el.querySelectorAll('a');
            if (links.length > 0) {
                console.log(`\n${el.id} has ${links.length} links:`);
                links.forEach((link, i) => {
                    console.log(`  ${i}: "${link.textContent.trim()}"`);
                });
            }
        });
    };
    
    console.log('Run captureMenu() to analyze the dropdown menu');
    
})();