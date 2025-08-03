// Claude Artifact Debug Script
// This script helps identify artifact buttons and structure

(function() {
    'use strict';
    
    console.log('🔍 Claude Artifact Debug Starting...');
    
    // Debug all buttons on the page
    console.log('\n=== ALL BUTTONS ===');
    const allButtons = document.querySelectorAll('button');
    console.log(`Found ${allButtons.length} total buttons on page`);
    
    allButtons.forEach((button, index) => {
        const text = button.textContent || '';
        const classes = button.className || '';
        const ariaLabel = button.getAttribute('aria-label') || '';
        
        // Look for anything artifact-related
        if (text.toLowerCase().includes('view') || 
            text.toLowerCase().includes('artifact') ||
            text.toLowerCase().includes('download') ||
            text.toLowerCase().includes('copy') ||
            classes.includes('artifact') ||
            ariaLabel.toLowerCase().includes('artifact')) {
            
            console.log(`\nButton ${index}:`);
            console.log('  Text:', text.trim());
            console.log('  Classes:', classes);
            console.log('  Aria-label:', ariaLabel);
            console.log('  Parent classes:', button.parentElement?.className || '');
            
            // Get the XPath
            function getXPath(element) {
                if (element.id !== '') {
                    return `//*[@id="${element.id}"]`;
                }
                if (element === document.body) {
                    return '/html/body';
                }
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
        }
    });
    
    // Look for artifact containers
    console.log('\n\n=== ARTIFACT CONTAINERS ===');
    
    // Search by various patterns
    const patterns = [
        '[class*="artifact"]',
        '[data-artifact]',
        '[aria-label*="artifact"]',
        'div[class*="code"]',
        'pre',
        '[class*="CodeBlock"]',
        '[class*="code-block"]'
    ];
    
    patterns.forEach(pattern => {
        const elements = document.querySelectorAll(pattern);
        if (elements.length > 0) {
            console.log(`\nPattern "${pattern}" found ${elements.length} elements:`);
            elements.forEach((el, i) => {
                if (i < 3) { // Show first 3 only
                    console.log(`  Element ${i}:`);
                    console.log('    Tag:', el.tagName);
                    console.log('    Classes:', el.className);
                    console.log('    Text preview:', el.textContent?.substring(0, 100) + '...');
                }
            });
        }
    });
    
    // Look for specific Claude UI elements
    console.log('\n\n=== CLAUDE UI ELEMENTS ===');
    
    // Check for code blocks with special UI
    const codeBlocks = document.querySelectorAll('pre');
    console.log(`\nFound ${codeBlocks.length} <pre> elements`);
    
    codeBlocks.forEach((pre, index) => {
        // Check if this code block has associated buttons
        const parent = pre.parentElement;
        const grandparent = parent?.parentElement;
        const greatGrandparent = grandparent?.parentElement;
        
        // Look for buttons near the code block
        const nearbyButtons = [];
        [parent, grandparent, greatGrandparent].forEach(ancestor => {
            if (ancestor) {
                const buttons = ancestor.querySelectorAll('button');
                buttons.forEach(btn => {
                    const btnText = btn.textContent || '';
                    if (btnText && !nearbyButtons.includes(btnText)) {
                        nearbyButtons.push(btnText.trim());
                    }
                });
            }
        });
        
        if (nearbyButtons.length > 0) {
            console.log(`\nCode block ${index} has nearby buttons:`, nearbyButtons);
        }
    });
    
    // Look for download/view buttons in conversation
    console.log('\n\n=== CONVERSATION BUTTONS ===');
    const conversationContainer = document.querySelector('[class*="conversation"], [class*="messages"], [class*="chat"]');
    if (conversationContainer) {
        const convButtons = conversationContainer.querySelectorAll('button');
        console.log(`Found ${convButtons.length} buttons in conversation area`);
        
        convButtons.forEach((btn, i) => {
            const text = btn.textContent?.trim() || '';
            const svg = btn.querySelector('svg');
            const icon = svg ? 'Has SVG icon' : 'No icon';
            
            if (text.length > 0 && text.length < 50) {
                console.log(`  Button ${i}: "${text}" (${icon})`);
            }
        });
    }
    
    // Check for React props
    console.log('\n\n=== REACT PROPS CHECK ===');
    const reactElements = document.querySelectorAll('[class*="artifact"], button');
    reactElements.forEach((el, i) => {
        if (i < 5) {
            const reactProps = Object.keys(el).filter(key => key.startsWith('__react'));
            if (reactProps.length > 0) {
                console.log(`\nElement ${i} has React props:`, reactProps);
                
                // Try to access React fiber
                const reactKey = reactProps[0];
                const fiber = el[reactKey];
                if (fiber && fiber.memoizedProps) {
                    console.log('  Props:', fiber.memoizedProps);
                }
            }
        }
    });
    
    // Look for file-like elements
    console.log('\n\n=== FILE-LIKE ELEMENTS ===');
    const filePatterns = [
        'a[download]',
        '[class*="file"]',
        '[class*="download"]',
        '[title*="."]', // Files often have extensions in title
        'span[class*="truncate"]' // File names might be truncated
    ];
    
    filePatterns.forEach(pattern => {
        const elements = document.querySelectorAll(pattern);
        if (elements.length > 0) {
            console.log(`\nPattern "${pattern}" found ${elements.length} elements`);
            elements.forEach((el, i) => {
                if (i < 3) {
                    const text = el.textContent?.trim() || '';
                    const title = el.getAttribute('title') || '';
                    const href = el.getAttribute('href') || '';
                    
                    if (text || title) {
                        console.log(`  Element ${i}:`);
                        console.log('    Text:', text);
                        console.log('    Title:', title);
                        if (href) console.log('    Href:', href);
                    }
                }
            });
        }
    });
    
    // Final summary
    console.log('\n\n=== SUMMARY ===');
    console.log('Total buttons:', allButtons.length);
    console.log('Code blocks:', codeBlocks.length);
    console.log('\n💡 Look for patterns above to identify artifact UI elements');
    console.log('📝 Note: Claude might use different UI for artifacts vs regular code blocks');
    
})();