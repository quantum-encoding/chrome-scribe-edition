// Claude XPath Pattern Debug
(function() {
    'use strict';
    
    console.log('🔍 Claude XPath Pattern Analysis...');
    
    // Base pattern from your examples
    const baseXPath = '/html/body/div[4]/div[2]/div/div[1]/div/div/div[1]';
    
    // Try to find all message divs following the pattern
    console.log('\n📝 Checking message pattern...');
    
    for (let i = 1; i <= 20; i++) {
        const messageXPath = `${baseXPath}/div[${i}]/div/div/div[1]/div[2]`;
        const result = document.evaluate(messageXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const element = result.singleNodeValue;
        
        if (element && element.textContent && element.textContent.trim()) {
            console.log(`\n✅ Message ${i} found:`);
            console.log('Text preview:', element.textContent.substring(0, 100) + '...');
            
            // Check if there's a role indicator nearby
            const parentDiv = element.parentElement?.parentElement?.parentElement;
            if (parentDiv) {
                // Look for Human/Assistant indicators
                const fullText = parentDiv.textContent;
                if (fullText.includes('Human') || fullText.includes('You')) {
                    console.log('Role: HUMAN');
                } else if (fullText.includes('Assistant') || fullText.includes('Claude')) {
                    console.log('Role: ASSISTANT');
                } else {
                    console.log('Role: Unknown (index-based guess:', i % 2 === 0 ? 'Assistant' : 'Human', ')');
                }
            }
            
            // Check for any role-specific classes
            const classes = element.className + ' ' + (parentDiv?.className || '');
            console.log('Classes:', classes.substring(0, 100));
        }
    }
    
    // Try to find the conversation container
    console.log('\n🔎 Analyzing conversation container...');
    const containerResult = document.evaluate(baseXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const container = containerResult.singleNodeValue;
    
    if (container) {
        console.log('Container found!');
        console.log('Direct children:', container.children.length);
        console.log('Container classes:', container.className);
        
        // Count actual message divs
        let messageCount = 0;
        for (let child of container.children) {
            const messagePath = child.querySelector('div > div > div > div[2]');
            if (messagePath && messagePath.textContent.trim()) {
                messageCount++;
            }
        }
        console.log('Actual messages found:', messageCount);
    }
    
    // Look for Human/Assistant labels
    console.log('\n🏷️ Looking for role labels...');
    const humanElements = document.evaluate("//*[contains(text(), 'Human')]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    const assistantElements = document.evaluate("//*[contains(text(), 'Assistant')]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    
    console.log('Elements containing "Human":', humanElements.snapshotLength);
    console.log('Elements containing "Assistant":', assistantElements.snapshotLength);
    
    // Try a more flexible pattern
    console.log('\n🔄 Trying flexible message detection...');
    const flexibleXPath = "//div[contains(@class, 'group') or contains(@class, 'message')]/div/div/div[1]/div[2]";
    const flexibleResults = document.evaluate(flexibleXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    console.log('Messages found with flexible pattern:', flexibleResults.snapshotLength);
    
})();