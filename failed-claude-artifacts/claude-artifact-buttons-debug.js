// Claude Artifact Buttons Debug Script
// Find and test clicking artifact buttons

(function() {
    'use strict';
    
    console.log('🔍 Claude Artifact Buttons Debug\n');
    
    // Method 1: Look for buttons with specific text
    console.log('=== METHOD 1: Button Text Search ===');
    const allButtons = document.querySelectorAll('button');
    const artifactButtons = [];
    
    allButtons.forEach((button, index) => {
        const text = button.textContent || '';
        const ariaLabel = button.getAttribute('aria-label') || '';
        
        // Look for artifact-related text
        if (text.toLowerCase().includes('view') || 
            text.toLowerCase().includes('artifact') ||
            text.toLowerCase().includes('copy') ||
            text.toLowerCase().includes('download') ||
            ariaLabel.toLowerCase().includes('artifact')) {
            
            console.log(`\nButton ${index}:`);
            console.log('  Text:', text.trim());
            console.log('  Aria-label:', ariaLabel);
            console.log('  Classes:', button.className);
            
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
            
            console.log('  XPath:', getXPath(button));
            
            artifactButtons.push({
                button: button,
                text: text.trim(),
                index: index
            });
        }
    });
    
    console.log(`\nFound ${artifactButtons.length} potential artifact buttons`);
    
    // Method 2: Look near code blocks
    console.log('\n\n=== METHOD 2: Buttons Near Code Blocks ===');
    const codeBlocks = document.querySelectorAll('pre');
    
    codeBlocks.forEach((pre, index) => {
        console.log(`\nCode block ${index + 1}:`);
        
        // Look for buttons in the parent chain
        let current = pre;
        const nearbyButtons = [];
        
        for (let i = 0; i < 5; i++) {
            current = current.parentElement;
            if (!current) break;
            
            const buttons = current.querySelectorAll('button');
            buttons.forEach(btn => {
                const btnText = btn.textContent?.trim() || '';
                if (btnText && !nearbyButtons.find(b => b.text === btnText)) {
                    nearbyButtons.push({
                        text: btnText,
                        button: btn
                    });
                }
            });
        }
        
        if (nearbyButtons.length > 0) {
            console.log('  Nearby buttons:', nearbyButtons.map(b => b.text));
        }
    });
    
    // Method 3: Look for artifact panels
    console.log('\n\n=== METHOD 3: Artifact Panels ===');
    
    // Common artifact panel selectors
    const panelSelectors = [
        '[class*="artifact"]',
        '[data-artifact]',
        '[aria-label*="artifact"]',
        'div[class*="code-artifact"]',
        'div[class*="artifact-container"]'
    ];
    
    panelSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            console.log(`\nSelector "${selector}" found ${elements.length} elements`);
        }
    });
    
    // Method 4: Interactive test
    console.log('\n\n=== INTERACTIVE TEST ===');
    if (artifactButtons.length > 0) {
        console.log('Ready to test clicking artifact buttons.');
        console.log('Run this to click the first button:');
        console.log('  window.testArtifactClick(0)');
        
        window.testArtifactClick = function(index) {
            if (index < artifactButtons.length) {
                console.log(`\nClicking button ${index}: "${artifactButtons[index].text}"`);
                artifactButtons[index].button.click();
                
                // Wait and check for changes
                setTimeout(() => {
                    console.log('Checking for artifact panel...');
                    
                    // Look for new elements that might be the artifact
                    const possiblePanels = document.querySelectorAll('[class*="panel"], [class*="modal"], [class*="drawer"]');
                    console.log(`Found ${possiblePanels.length} possible panels`);
                    
                    // Look for download buttons
                    const downloadButtons = document.querySelectorAll('button');
                    const newDownloadButtons = Array.from(downloadButtons).filter(btn => {
                        const text = btn.textContent || '';
                        return text.toLowerCase().includes('download') || 
                               text.toLowerCase().includes('save') ||
                               text.toLowerCase().includes('copy');
                    });
                    
                    if (newDownloadButtons.length > 0) {
                        console.log('Found download options:', newDownloadButtons.map(b => b.textContent));
                    }
                }, 1000);
            } else {
                console.log('Invalid button index');
            }
        };
    }
    
    // Save data
    window.artifactButtonsDebug = artifactButtons;
    console.log('\n💾 Artifact buttons saved to window.artifactButtonsDebug');
    
})();