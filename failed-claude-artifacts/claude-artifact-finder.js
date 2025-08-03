// Claude Artifact Finder - Find all possible artifact buttons
(function() {
    'use strict';
    
    console.log('🔍 Claude Artifact Finder\n');
    
    // Method 1: aria-label="Preview contents"
    const method1 = document.querySelectorAll('button[aria-label="Preview contents"]');
    console.log(`Method 1 (aria-label="Preview contents"): ${method1.length} buttons`);
    
    // Method 2: Look for "View" buttons in Claude messages
    const claudeMessages = document.querySelectorAll('[class*="font-claude"]');
    console.log(`\nFound ${claudeMessages.length} Claude messages`);
    
    let viewButtonCount = 0;
    claudeMessages.forEach((msg, idx) => {
        const buttons = msg.querySelectorAll('button');
        const viewButtons = Array.from(buttons).filter(btn => 
            btn.textContent?.includes('View') || 
            btn.textContent?.includes('view') ||
            btn.textContent?.includes('Preview')
        );
        
        if (viewButtons.length > 0) {
            console.log(`  Message ${idx + 1}: ${viewButtons.length} view/preview buttons`);
            viewButtons.forEach(btn => {
                viewButtonCount++;
                console.log(`    Button text: "${btn.textContent?.trim()}"`);
                console.log(`    Button classes: ${btn.className}`);
                
                // Highlight the button
                btn.style.border = '2px solid green';
                btn.style.boxShadow = '0 0 10px green';
            });
        }
    });
    
    // Method 3: Look for code blocks with associated buttons
    console.log('\nLooking for code blocks with buttons...');
    const codeBlocks = document.querySelectorAll('pre, [class*="code-block"], [class*="artifact"]');
    console.log(`Found ${codeBlocks.length} code blocks`);
    
    codeBlocks.forEach((block, idx) => {
        // Look for buttons near this code block
        const parent = block.parentElement;
        const grandParent = parent?.parentElement;
        
        let nearbyButtons = [];
        if (parent) nearbyButtons = [...nearbyButtons, ...parent.querySelectorAll('button')];
        if (grandParent) nearbyButtons = [...nearbyButtons, ...grandParent.querySelectorAll('button')];
        
        if (nearbyButtons.length > 0) {
            console.log(`  Code block ${idx + 1}: ${nearbyButtons.length} nearby buttons`);
            nearbyButtons.forEach(btn => {
                if (!btn.style.border) { // Don't re-highlight
                    btn.style.border = '2px solid orange';
                    btn.style.boxShadow = '0 0 10px orange';
                }
            });
        }
    });
    
    // Method 4: Look for any button that might open artifacts
    console.log('\nAll buttons analysis:');
    const allButtons = document.querySelectorAll('button');
    const suspectButtons = [];
    
    allButtons.forEach(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
        
        // Check for artifact-related keywords
        if (text.includes('view') || text.includes('preview') || text.includes('artifact') ||
            text.includes('code') || text.includes('open') || text.includes('show') ||
            ariaLabel.includes('view') || ariaLabel.includes('preview') || ariaLabel.includes('artifact')) {
            
            suspectButtons.push({
                button: btn,
                text: btn.textContent?.trim(),
                ariaLabel: btn.getAttribute('aria-label'),
                classes: btn.className
            });
        }
    });
    
    console.log(`Found ${suspectButtons.length} suspect buttons:`);
    suspectButtons.forEach((item, idx) => {
        console.log(`  ${idx + 1}. Text: "${item.text}", Aria: "${item.ariaLabel}"`);
        if (!item.button.style.border) {
            item.button.style.border = '2px solid purple';
            item.button.style.boxShadow = '0 0 10px purple';
        }
    });
    
    console.log('\n🎨 Color coding:');
    console.log('  🟢 Green = View/Preview buttons in Claude messages');
    console.log('  🟠 Orange = Buttons near code blocks');
    console.log('  🟣 Purple = Other suspect buttons');
    
    console.log('\nTry clicking any highlighted button to see if it opens an artifact!');
    
})();