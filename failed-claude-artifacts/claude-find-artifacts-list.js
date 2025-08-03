// Claude Find Artifacts List Debug Script
// Search for the artifacts list in the DOM

(function() {
    'use strict';
    
    console.log('🔍 Finding Claude Artifacts List\n');
    
    // Method 1: Look for UL elements that might be artifact lists
    console.log('=== SEARCHING FOR UL ELEMENTS ===');
    const allULs = document.querySelectorAll('ul');
    console.log(`Found ${allULs.length} <ul> elements\n`);
    
    allULs.forEach((ul, index) => {
        const listItems = ul.querySelectorAll('li');
        if (listItems.length > 0 && listItems.length < 20) { // Reasonable number for artifacts
            console.log(`UL ${index}: ${listItems.length} items`);
            
            // Check first item text
            const firstText = listItems[0].textContent.trim();
            if (firstText.length > 10 && firstText.length < 200) {
                console.log(`  First item: "${firstText.substring(0, 50)}..."`);
                console.log(`  Parent classes: ${ul.parentElement?.className || 'none'}`);
                
                // Get XPath
                function getXPath(element) {
                    if (element.id !== '') return `//*[@id="${element.id}"]`;
                    if (element === document.body) return '/html/body';
                    
                    const siblings = element.parentNode.childNodes;
                    let count = 0;
                    for (let i = 0; i < siblings.length; i++) {
                        const sibling = siblings[i];
                        if (sibling === element) {
                            return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (count + 1) + ']';
                        }
                        if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
                            count++;
                        }
                    }
                }
                
                console.log(`  XPath: ${getXPath(ul)}`);
                console.log('');
            }
        }
    });
    
    // Method 2: Look in the right panel area
    console.log('\n=== SEARCHING RIGHT PANEL ===');
    const rightPanel = document.querySelector('div[class*="md:basis-0"]');
    if (rightPanel) {
        console.log('Found right panel');
        
        // Look for lists in this panel
        const listsInPanel = rightPanel.querySelectorAll('ul');
        console.log(`Lists in right panel: ${listsInPanel.length}`);
        
        listsInPanel.forEach((ul, i) => {
            const items = ul.querySelectorAll('li');
            console.log(`\nList ${i}: ${items.length} items`);
            if (items.length > 0) {
                console.log(`First item: "${items[0].textContent.trim().substring(0, 50)}..."`);
            }
        });
    }
    
    // Method 3: Look for elements containing artifact names
    console.log('\n\n=== SEARCHING FOR ARTIFACT TEXT ===');
    const possibleArtifactTexts = [
        'Code',
        'artifact',
        'Interactive',
        '.js',
        '.py',
        '.html',
        '.json'
    ];
    
    possibleArtifactTexts.forEach(searchText => {
        const elements = Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent.includes(searchText) && 
            el.children.length < 5 &&
            el.textContent.length < 200
        );
        
        if (elements.length > 0 && elements.length < 20) {
            console.log(`\nElements containing "${searchText}": ${elements.length}`);
            elements.slice(0, 3).forEach(el => {
                console.log(`  <${el.tagName}> "${el.textContent.trim().substring(0, 50)}..."`);
                if (el.parentElement?.parentElement?.tagName === 'LI') {
                    console.log('    ^^^ This is inside an LI element!');
                }
            });
        }
    });
    
    // Method 4: Interactive exploration
    console.log('\n\n=== INTERACTIVE EXPLORATION ===');
    
    window.explorePanel = {
        showPanelStructure: function() {
            const panel = document.querySelector('div[class*="md:basis-0"]');
            if (panel) {
                console.log('\nPanel structure:');
                
                function showStructure(element, depth = 0) {
                    const indent = '  '.repeat(depth);
                    const tag = element.tagName;
                    const classes = element.className ? `.${element.className.split(' ').join('.')}` : '';
                    const text = element.textContent.trim().substring(0, 30);
                    
                    console.log(`${indent}<${tag}${classes}> "${text}..."`);
                    
                    if (depth < 5 && element.children.length < 10) {
                        Array.from(element.children).forEach(child => {
                            showStructure(child, depth + 1);
                        });
                    }
                }
                
                showStructure(panel);
            }
        },
        
        findByText: function(text) {
            const elements = Array.from(document.querySelectorAll('*')).filter(el => 
                el.textContent.includes(text) && el.textContent.length < 500
            );
            
            console.log(`\nFound ${elements.length} elements containing "${text}"`);
            elements.slice(0, 5).forEach((el, i) => {
                console.log(`${i}: <${el.tagName}> ${el.className}`);
                console.log(`   Text: "${el.textContent.trim().substring(0, 100)}..."`);
            });
        },
        
        checkArtifactButton: function() {
            // Check if we need to open artifacts first
            const artifactButton = document.querySelector('button[aria-label*="artifact"], button:has(svg):has(+ span:contains("Artifacts"))');
            if (artifactButton) {
                console.log('Found artifacts button, clicking...');
                artifactButton.click();
            } else {
                console.log('No artifacts button found');
            }
        }
    };
    
    console.log('\nTry these commands:');
    console.log('1. explorePanel.showPanelStructure() - Show right panel structure');
    console.log('2. explorePanel.findByText("your artifact name") - Find elements by text');
    console.log('3. explorePanel.checkArtifactButton() - Try to open artifacts panel');
    
})();