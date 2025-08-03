// Claude Artifact Debug - Find artifact buttons and copy buttons
(function() {
    'use strict';
    
    console.log('🔍 Claude Artifact Debug\n');
    
    // Method 1: Look for aria-label="Preview contents"
    const previewButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
    console.log(`Method 1: Found ${previewButtons.length} buttons with aria-label="Preview contents"`);
    
    // Method 2: Look for buttons containing "View" text
    const viewButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent && btn.textContent.includes('View')
    );
    console.log(`Method 2: Found ${viewButtons.length} buttons containing "View"`);
    
    // Method 3: Look in message blocks for any buttons
    const messageBlocks = document.querySelectorAll('[class*="font-claude-message"], [class*="font-claude-response"]');
    console.log(`\nFound ${messageBlocks.length} Claude message blocks`);
    
    messageBlocks.forEach((block, idx) => {
        const buttons = block.querySelectorAll('button');
        if (buttons.length > 0) {
            console.log(`  Message ${idx + 1}: ${buttons.length} buttons`);
            buttons.forEach((btn, btnIdx) => {
                const text = btn.textContent?.trim() || '';
                const ariaLabel = btn.getAttribute('aria-label') || '';
                console.log(`    Button ${btnIdx + 1}: "${text}" (aria-label: "${ariaLabel}")`);
            });
        }
    });
    
    // Method 4: Look for artifact containers
    const artifactContainers = document.querySelectorAll('[class*="artifact"], [class*="code-block"], [class*="preview"]');
    console.log(`\nFound ${artifactContainers.length} potential artifact containers`);
    
    // Method 5: Look for the actual artifact preview buttons by examining their structure
    console.log('\nSearching for artifact buttons by structure...');
    const allButtons = document.querySelectorAll('button');
    let artifactButtonCount = 0;
    
    allButtons.forEach((btn, idx) => {
        // Check if button has specific classes or attributes that indicate it's an artifact button
        const classes = btn.className;
        const parent = btn.parentElement;
        const grandParent = parent?.parentElement;
        
        // Look for buttons inside code block areas
        if (grandParent && (grandParent.className.includes('code') || grandParent.className.includes('artifact'))) {
            console.log(`  Potential artifact button #${++artifactButtonCount}:`);
            console.log(`    Classes: ${btn.className}`);
            console.log(`    Text: "${btn.textContent?.trim()}"`);
            console.log(`    Parent classes: ${parent.className}`);
        }
    });
    
    // Method 6: Click one preview button and look for Copy button
    if (previewButtons.length > 0) {
        console.log('\n📋 Clicking first artifact button to check for Copy button...');
        previewButtons[0].click();
        
        setTimeout(() => {
            // Look for Copy button in the opened panel
            const copyButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
                const text = btn.textContent?.trim() || '';
                const hasDiv = btn.querySelector('div');
                const divText = hasDiv ? hasDiv.textContent?.trim() : '';
                return text === 'Copy' || divText === 'Copy';
            });
            
            console.log(`\nFound ${copyButtons.length} Copy buttons`);
            copyButtons.forEach((btn, idx) => {
                console.log(`  Copy button ${idx + 1}:`);
                console.log(`    Full path: ${getElementPath(btn)}`);
                console.log(`    Parent structure: ${btn.parentElement?.className}`);
            });
            
            // Also look for the artifact content
            const panels = document.querySelectorAll('[class*="basis-0"], [role="dialog"]');
            console.log(`\nFound ${panels.length} potential artifact panels`);
            
            panels.forEach((panel, idx) => {
                const codeElements = panel.querySelectorAll('pre, code, [class*="code"]');
                console.log(`  Panel ${idx + 1}: ${codeElements.length} code elements`);
            });
            
        }, 1500);
    }
    
    function getElementPath(element) {
        const path = [];
        while (element && element.nodeType === Node.ELEMENT_NODE) {
            let selector = element.nodeName.toLowerCase();
            if (element.id) {
                selector += '#' + element.id;
                path.unshift(selector);
                break;
            } else if (element.className) {
                selector += '.' + element.className.split(' ').filter(c => c).join('.');
            }
            path.unshift(selector);
            element = element.parentNode;
        }
        return path.join(' > ');
    }
    
})();