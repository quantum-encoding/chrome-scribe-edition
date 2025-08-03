// Claude Menu Text Debug - Find what text is in the dropdown menu
// Run this AFTER manually clicking an artifact dropdown

(function() {
    'use strict';
    
    console.log('🔍 Claude Menu Text Debug\n');
    
    // Method 1: Find all links and show their text
    console.log('=== ALL LINKS IN DOCUMENT ===');
    const allLinks = document.querySelectorAll('a');
    const menuLinks = [];
    
    allLinks.forEach((link, i) => {
        const text = link.textContent.trim();
        // Filter for links that might be in a dropdown menu
        if (text && !text.includes('chat') && !text.includes('New') && text.length < 50) {
            const inRadix = link.closest('[id^="radix-"]');
            const inMenu = link.closest('[role="menu"]');
            const parent = link.parentElement;
            
            if (inRadix || inMenu || (parent && parent.querySelectorAll('a').length < 10)) {
                menuLinks.push({
                    text: text,
                    href: link.getAttribute('href') || 'none',
                    download: link.getAttribute('download') || 'none',
                    inRadix: !!inRadix,
                    inMenu: !!inMenu,
                    element: link
                });
            }
        }
    });
    
    console.log(`Found ${menuLinks.length} potential menu links:\n`);
    menuLinks.forEach((item, i) => {
        console.log(`${i}: "${item.text}"`);
        console.log(`   In Radix: ${item.inRadix}, In Menu: ${item.inMenu}`);
        console.log(`   Href: ${item.href}`);
        if (item.download !== 'none') {
            console.log(`   Download: ${item.download}`);
        }
        console.log('');
    });
    
    // Method 2: Find elements that might contain "Save as"
    console.log('\n=== SEARCHING FOR "SAVE" TEXT ===');
    const allElements = document.querySelectorAll('*');
    const saveElements = [];
    
    allElements.forEach(el => {
        const text = el.textContent || '';
        if (text.includes('Save as') && el.children.length < 3) {
            saveElements.push({
                tag: el.tagName,
                text: text.trim(),
                element: el
            });
        }
    });
    
    console.log(`Found ${saveElements.length} elements with "Save as":`);
    saveElements.forEach((item, i) => {
        console.log(`${i}: <${item.tag}> "${item.text.substring(0, 100)}..."`);
    });
    
    // Method 3: Check specific Radix menu
    console.log('\n=== CHECKING SPECIFIC RADIX MENU ===');
    const radixMenu = document.getElementById('radix-_r_u8_');
    if (radixMenu) {
        console.log('Found radix-_r_u8_!');
        console.log('Tag:', radixMenu.tagName);
        console.log('Children:', radixMenu.children.length);
        
        // Get all text content
        const allText = radixMenu.innerText || radixMenu.textContent || '';
        console.log('Full text content:', allText);
        
        // Find links
        const links = radixMenu.querySelectorAll('a');
        console.log(`\nLinks in menu: ${links.length}`);
        links.forEach((link, i) => {
            console.log(`Link ${i}: "${link.textContent.trim()}"`);
        });
    } else {
        console.log('radix-_r_u8_ not found');
    }
    
    // Interactive test
    window.testDropdown = async function() {
        console.log('\n\n=== INTERACTIVE DROPDOWN TEST ===');
        
        // Find the first artifact button
        const artifactBtn = document.querySelector('button[aria-label="Preview contents"]');
        if (!artifactBtn) {
            console.log('No artifact button found');
            return;
        }
        
        console.log('1. Clicking artifact...');
        artifactBtn.click();
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Find dropdown button - look for button with SVG in the panel
        const panel = document.querySelector('[class*="basis-0"]');
        if (!panel) {
            console.log('Panel not found');
            return;
        }
        
        const buttons = panel.querySelectorAll('button:has(svg)');
        console.log(`Found ${buttons.length} buttons with SVG in panel`);
        
        // Usually the dropdown is the last button or second-to-last
        let dropdownBtn = null;
        for (let i = buttons.length - 1; i >= 0; i--) {
            const btn = buttons[i];
            // Skip close button
            if (btn.getAttribute('aria-label') !== 'Close') {
                dropdownBtn = btn;
                break;
            }
        }
        
        if (!dropdownBtn) {
            console.log('Dropdown button not found');
            return;
        }
        
        console.log('2. Clicking dropdown...');
        dropdownBtn.click();
        
        // Wait and capture what appears
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('\n3. Looking for new elements...');
        
        // Find all elements with role="menu" or containing links
        const menus = document.querySelectorAll('[role="menu"], [id^="radix-"]:has(a)');
        console.log(`Found ${menus.length} potential menus`);
        
        menus.forEach((menu, i) => {
            console.log(`\nMenu ${i}:`);
            console.log('  ID:', menu.id || 'none');
            console.log('  Role:', menu.getAttribute('role') || 'none');
            
            // Get all text
            const text = menu.innerText || menu.textContent || '';
            console.log('  Full text:', text.substring(0, 200));
            
            // Get links
            const links = menu.querySelectorAll('a');
            links.forEach((link, j) => {
                console.log(`  Link ${j}: "${link.textContent.trim()}"`);
            });
        });
    };
    
    console.log('\n\nRun testDropdown() to test the dropdown interactively');
    
})();