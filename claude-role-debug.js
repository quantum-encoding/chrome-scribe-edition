// Claude Role Detection Debug Script
// This helps identify the correct patterns for Human vs Claude messages

(function() {
    'use strict';
    
    console.log('🔍 Claude Role Detection Debug...\n');
    
    // Base XPath for conversation container
    const baseXPath = '/html/body/div[4]/div[2]/div/div[1]/div/div/div[1]';
    const containerResult = document.evaluate(baseXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const container = containerResult.singleNodeValue;
    
    if (!container) {
        console.error('No conversation container found');
        return;
    }
    
    // Check first message separately
    console.log('=== FIRST MESSAGE ===');
    const firstMessageXPath = `${baseXPath}/div[1]/div/div[2]/div[1]/div[2]/p`;
    const firstResult = document.evaluate(firstMessageXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const firstMessage = firstResult.singleNodeValue;
    
    if (firstMessage) {
        console.log('First message found (usually Human)');
        console.log('Content preview:', firstMessage.textContent.substring(0, 50) + '...');
    }
    
    // Analyze each message container
    console.log('\n=== MESSAGE ANALYSIS ===');
    
    for (let i = 1; i <= Math.min(container.children.length, 5); i++) {
        console.log(`\n--- Message Block ${i} ---`);
        
        const messageDiv = container.children[i - 1];
        if (!messageDiv) continue;
        
        // Look for role indicators
        const allText = messageDiv.textContent || '';
        
        // Check for "Human" or "Assistant" text
        const hasHuman = allText.includes('Human');
        const hasAssistant = allText.includes('Assistant');
        const hasClaude = allText.includes('Claude');
        
        console.log(`Contains "Human": ${hasHuman}`);
        console.log(`Contains "Assistant": ${hasAssistant}`);
        console.log(`Contains "Claude": ${hasClaude}`);
        
        // Look for specific patterns
        const roleElements = messageDiv.querySelectorAll('div, span');
        roleElements.forEach(el => {
            const text = el.textContent.trim();
            if (text === 'Human' || text === 'Assistant' || text === 'Claude' || text === 'You') {
                console.log(`Found role indicator: "${text}" in ${el.tagName}`);
                console.log(`  Classes: ${el.className}`);
                console.log(`  Parent classes: ${el.parentElement?.className}`);
            }
        });
        
        // Check for message content
        const messageXPath = `${baseXPath}/div[${i}]/div/div/div[1]/div[2]`;
        const result = document.evaluate(messageXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const messageElement = result.singleNodeValue;
        
        if (messageElement) {
            console.log('Message element found');
            console.log('Classes:', messageElement.className);
            console.log('Content preview:', messageElement.textContent.substring(0, 50) + '...');
            
            // Check parent structure
            let parent = messageElement;
            for (let j = 0; j < 4; j++) {
                parent = parent.parentElement;
                if (!parent) break;
                
                // Look for role text in ancestors
                const parentText = parent.textContent;
                if (parentText.startsWith('Human') || parentText.startsWith('You')) {
                    console.log(`Parent ${j} starts with Human/You`);
                } else if (parentText.startsWith('Assistant') || parentText.startsWith('Claude')) {
                    console.log(`Parent ${j} starts with Assistant/Claude`);
                }
            }
        }
        
        // Look for visual indicators
        const avatars = messageDiv.querySelectorAll('img, svg');
        if (avatars.length > 0) {
            console.log(`Found ${avatars.length} avatar elements`);
        }
        
        // Check CSS classes for patterns
        const allElements = messageDiv.querySelectorAll('*');
        const classPatterns = new Set();
        allElements.forEach(el => {
            if (el.className && typeof el.className === 'string') {
                const classes = el.className.split(' ');
                classes.forEach(cls => {
                    if (cls.includes('user') || cls.includes('human') || cls.includes('assistant') || cls.includes('claude')) {
                        classPatterns.add(cls);
                    }
                });
            }
        });
        
        if (classPatterns.size > 0) {
            console.log('Role-related CSS classes:', Array.from(classPatterns));
        }
    }
    
    // Try alternative detection method
    console.log('\n=== ALTERNATIVE DETECTION ===');
    
    // Look for all text nodes containing role indicators
    const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                const text = node.textContent.trim();
                if (text === 'Human' || text === 'Assistant' || text === 'Claude' || text === 'You') {
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_SKIP;
            }
        }
    );
    
    let node;
    let roleNodes = [];
    while (node = walker.nextNode()) {
        roleNodes.push({
            text: node.textContent.trim(),
            parent: node.parentElement.tagName,
            parentClass: node.parentElement.className
        });
    }
    
    console.log('Found role text nodes:', roleNodes);
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log('Total message blocks:', container.children.length);
    console.log('\n💡 Look for patterns above to determine correct role detection logic');
    
})();