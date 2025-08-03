// Claude Radix Menu Debug - See what's in the dropdown menu
// Run this after manually clicking an artifact and its dropdown

(function() {
    'use strict';
    
    console.log('🔍 Claude Radix Menu Debug\n');
    
    // Find all radix menus
    const radixMenus = document.querySelectorAll('[id^="radix-"][id$="_"]');
    console.log(`Found ${radixMenus.length} Radix elements\n`);
    
    radixMenus.forEach((menu, index) => {
        console.log(`\n=== Radix Element ${index}: ${menu.id} ===`);
        console.log('Tag:', menu.tagName);
        console.log('Classes:', menu.className || 'none');
        console.log('Role:', menu.getAttribute('role') || 'none');
        
        // Get all child elements
        const children = menu.querySelectorAll('*');
        console.log(`Total child elements: ${children.length}`);
        
        // Look for links
        const links = menu.querySelectorAll('a');
        console.log(`\nLinks found: ${links.length}`);
        links.forEach((link, i) => {
            console.log(`\nLink ${i}:`);
            console.log('  Text:', link.textContent.trim());
            console.log('  Href:', link.getAttribute('href') || 'none');
            console.log('  Download attr:', link.getAttribute('download') || 'none');
            console.log('  Classes:', link.className || 'none');
            console.log('  Parent tag:', link.parentElement?.tagName || 'none');
            
            // Check if it has any data attributes
            const dataAttrs = Array.from(link.attributes).filter(attr => attr.name.startsWith('data-'));
            if (dataAttrs.length > 0) {
                console.log('  Data attributes:');
                dataAttrs.forEach(attr => {
                    console.log(`    ${attr.name}: ${attr.value}`);
                });
            }
        });
        
        // Look for buttons
        const buttons = menu.querySelectorAll('button');
        if (buttons.length > 0) {
            console.log(`\nButtons found: ${buttons.length}`);
            buttons.forEach((btn, i) => {
                console.log(`  Button ${i}: "${btn.textContent.trim()}"`);
            });
        }
        
        // Show first level of DOM structure
        console.log('\nDOM Structure (first 2 levels):');
        function showStructure(element, depth = 0, maxDepth = 2) {
            if (depth > maxDepth) return;
            
            const indent = '  '.repeat(depth);
            const tag = element.tagName.toLowerCase();
            const id = element.id ? `#${element.id}` : '';
            const classes = element.className ? `.${element.className.split(' ').join('.')}` : '';
            const text = element.childNodes.length === 1 && element.childNodes[0].nodeType === 3 
                ? ` "${element.textContent.trim().substring(0, 30)}..."` 
                : '';
            
            console.log(`${indent}<${tag}${id}${classes}>${text}`);
            
            Array.from(element.children).forEach(child => {
                showStructure(child, depth + 1, maxDepth);
            });
        }
        
        showStructure(menu);
    });
    
    // Look for any download links anywhere
    console.log('\n\n=== ALL DOWNLOAD-LIKE LINKS IN DOCUMENT ===');
    const allLinks = document.querySelectorAll('a');
    const downloadLinks = Array.from(allLinks).filter(link => {
        const text = link.textContent || '';
        const href = link.getAttribute('href') || '';
        return text.includes('Save as') || 
               text.includes('Download') ||
               text.includes('.py') ||
               text.includes('.js') ||
               text.includes('.html') ||
               text.includes('.json') ||
               text.includes('.md') ||
               href.includes('blob:') ||
               link.hasAttribute('download');
    });
    
    console.log(`Found ${downloadLinks.length} potential download links`);
    downloadLinks.forEach((link, i) => {
        console.log(`\n${i}: "${link.textContent.trim()}"`);
        console.log(`   Href: ${link.getAttribute('href') || 'none'}`);
        console.log(`   In Radix menu: ${link.closest('[id^="radix-"]') ? 'YES' : 'NO'}`);
    });
    
    // Interactive function to click a specific artifact and debug
    window.debugArtifact = async function(artifactIndex = 0) {
        console.log('\n\n=== INTERACTIVE ARTIFACT DEBUG ===');
        
        // Click artifact
        const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
        if (artifactIndex >= artifactButtons.length) {
            console.log('Invalid artifact index');
            return;
        }
        
        console.log(`Clicking artifact ${artifactIndex + 1}...`);
        artifactButtons[artifactIndex].click();
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Find dropdown in panel
        const panel = document.querySelector('div[class*="md:basis-0"]') || 
                     document.evaluate('/html/body/div[4]/div[2]/div/div[3]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        
        if (!panel) {
            console.log('Panel not found');
            return;
        }
        
        // Find dropdown button
        const buttons = panel.querySelectorAll('button');
        let dropdownButton = null;
        
        for (const btn of buttons) {
            if (btn.id && btn.id.startsWith('radix-') && btn.querySelector('svg')) {
                dropdownButton = btn;
                break;
            }
        }
        
        if (!dropdownButton) {
            console.log('Dropdown button not found');
            return;
        }
        
        console.log(`Found dropdown: ${dropdownButton.id}`);
        dropdownButton.click();
        console.log('Clicked dropdown');
        
        // Wait and analyze
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Find the menu that appeared
        const newMenus = document.querySelectorAll('[id^="radix-"][id$="_"]:has(a)');
        console.log(`\nMenus after click: ${newMenus.length}`);
        
        newMenus.forEach(menu => {
            const links = menu.querySelectorAll('a');
            console.log(`\nMenu ${menu.id}:`);
            links.forEach(link => {
                console.log(`  Link: "${link.textContent.trim()}"`);
            });
        });
    };
    
    console.log('\n\nRun debugArtifact(0) to test first artifact interactively');
    
})();