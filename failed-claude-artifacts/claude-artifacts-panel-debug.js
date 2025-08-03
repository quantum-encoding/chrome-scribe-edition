// Claude Artifacts Panel Debug Script
// Analyze the DOM structure when artifacts panel is open

(function() {
    'use strict';
    
    console.log('🔍 Claude Artifacts Panel Debug\n');
    
    // First, let's see if artifacts panel is open
    console.log('=== CHECKING ARTIFACTS PANEL ===');
    
    // Check common panel locations
    const panelSelectors = [
        '/html/body/div[4]/div[2]/div/div[3]',
        'div[class*="artifacts-panel"]',
        'div[class*="artifact-list"]',
        'div[role="complementary"]'
    ];
    
    panelSelectors.forEach(selector => {
        let element;
        if (selector.startsWith('/')) {
            // XPath
            const result = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            element = result.singleNodeValue;
        } else {
            // CSS selector
            element = document.querySelector(selector);
        }
        
        if (element) {
            console.log(`Found panel with selector: ${selector}`);
            console.log('Classes:', element.className);
            console.log('Children count:', element.children.length);
        }
    });
    
    // Look for the artifacts list
    console.log('\n=== ARTIFACTS LIST STRUCTURE ===');
    
    const listXPath = '/html/body/div[4]/div[2]/div/div[3]/div/div[2]/div/div/div[1]/div[1]/ul';
    const listResult = document.evaluate(listXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const listElement = listResult.singleNodeValue;
    
    if (listElement) {
        console.log('Found artifacts list!');
        const listItems = listElement.querySelectorAll('li');
        console.log(`Number of artifacts: ${listItems.length}`);
        
        // Analyze first artifact structure
        if (listItems.length > 0) {
            console.log('\n--- First Artifact Structure ---');
            const firstItem = listItems[0];
            console.log('Tag:', firstItem.tagName);
            console.log('Classes:', firstItem.className);
            console.log('Text:', firstItem.textContent.trim());
            
            // Find clickable elements
            const clickables = firstItem.querySelectorAll('div, button, a');
            console.log(`\nClickable elements in first artifact: ${clickables.length}`);
            clickables.forEach((el, i) => {
                console.log(`  ${i}: <${el.tagName}> "${el.textContent.trim().substring(0, 30)}..."`);
                console.log(`     Classes: ${el.className}`);
            });
        }
    } else {
        console.log('No artifacts list found at expected XPath');
    }
    
    // Look for dropdown button when artifact is selected
    console.log('\n=== DROPDOWN BUTTON LOCATION ===');
    
    const dropdownXPath = '/html/body/div[4]/div[2]/div/div[3]/div/div[2]/div/div/div[1]/div[2]/div/button[2]';
    const dropdownResult = document.evaluate(dropdownXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const dropdownButton = dropdownResult.singleNodeValue;
    
    if (dropdownButton) {
        console.log('Found dropdown button!');
        console.log('Tag:', dropdownButton.tagName);
        console.log('Classes:', dropdownButton.className);
        console.log('Has SVG:', dropdownButton.querySelector('svg') !== null);
        
        // Check siblings
        const parent = dropdownButton.parentElement;
        if (parent) {
            console.log('\nDropdown button siblings:');
            Array.from(parent.children).forEach((child, i) => {
                console.log(`  ${i}: <${child.tagName}> ${child.className}`);
            });
        }
    } else {
        console.log('No dropdown button found at expected location');
        
        // Try to find any dropdown-like buttons
        const allButtons = document.querySelectorAll('button');
        const dropdownCandidates = [];
        
        allButtons.forEach(btn => {
            const svg = btn.querySelector('svg');
            if (svg && (btn.innerHTML.includes('chevron') || btn.innerHTML.includes('arrow'))) {
                dropdownCandidates.push(btn);
            }
        });
        
        if (dropdownCandidates.length > 0) {
            console.log(`\nFound ${dropdownCandidates.length} potential dropdown buttons`);
        }
    }
    
    // Look for menu structure when dropdown is clicked
    console.log('\n=== MENU STRUCTURE (if visible) ===');
    
    const menuSelectors = [
        'div[role="menu"]',
        'div[tabindex="-1"]',
        '/html/body/div[6]'
    ];
    
    menuSelectors.forEach(selector => {
        let element;
        if (selector.startsWith('/')) {
            const result = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            element = result.singleNodeValue;
        } else {
            element = document.querySelector(selector);
        }
        
        if (element) {
            console.log(`\nFound menu with selector: ${selector}`);
            
            // Find links in menu
            const links = element.querySelectorAll('a');
            console.log(`Links in menu: ${links.length}`);
            links.forEach((link, i) => {
                console.log(`  ${i}: "${link.textContent.trim()}"`);
                console.log(`     href: ${link.getAttribute('href') || 'none'}`);
            });
        }
    });
    
    // Interactive test function
    console.log('\n\n=== INTERACTIVE TESTS ===');
    
    window.artifactTest = {
        clickFirstArtifact: function() {
            const listXPath = '/html/body/div[4]/div[2]/div/div[3]/div/div[2]/div/div/div[1]/div[1]/ul/li[1]/div/div';
            const result = document.evaluate(listXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const element = result.singleNodeValue;
            
            if (element) {
                console.log('Clicking first artifact...');
                element.click();
                return true;
            } else {
                console.log('Could not find first artifact');
                return false;
            }
        },
        
        clickDropdown: function() {
            const dropdownXPath = '/html/body/div[4]/div[2]/div/div[3]/div/div[2]/div/div/div[1]/div[2]/div/button[2]';
            const result = document.evaluate(dropdownXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const button = result.singleNodeValue;
            
            if (button) {
                console.log('Clicking dropdown...');
                button.click();
                return true;
            } else {
                console.log('Could not find dropdown button');
                return false;
            }
        },
        
        findMenuOptions: function() {
            setTimeout(() => {
                const menuSelectors = ['div[role="menu"]', 'div[tabindex="-1"]', '/html/body/div[6]'];
                
                for (const selector of menuSelectors) {
                    let element;
                    if (selector.startsWith('/')) {
                        const result = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                        element = result.singleNodeValue;
                    } else {
                        element = document.querySelector(selector);
                    }
                    
                    if (element) {
                        const links = element.querySelectorAll('a');
                        console.log(`\nMenu found with ${links.length} options:`);
                        links.forEach((link, i) => {
                            console.log(`  ${i}: "${link.textContent.trim()}"`);
                        });
                        return;
                    }
                }
                
                console.log('No menu found');
            }, 500);
        }
    };
    
    console.log('\nRun these tests:');
    console.log('1. artifactTest.clickFirstArtifact()');
    console.log('2. artifactTest.clickDropdown()');
    console.log('3. artifactTest.findMenuOptions()');
    
})();