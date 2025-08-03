// Claude Debug Scraper - Analyze DOM structure
(function() {
    'use strict';
    
    console.log('🔍 Claude Debug Scraper Starting...');
    
    // Find the main container based on your XPath
    const mainXPath = '/html/body/div[4]/div[2]/div/div[1]/div/div/div[1]';
    const mainResult = document.evaluate(mainXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const mainContainer = mainResult.singleNodeValue;
    
    if (mainContainer) {
        console.log('✅ Found main container:', mainContainer);
        console.log('Classes:', mainContainer.className);
        console.log('Children:', mainContainer.children.length);
    }
    
    // Look for conversation messages - common patterns
    const possibleSelectors = [
        '[data-testid*="message"]',
        '[data-testid*="conversation"]',
        '[role="article"]',
        '[class*="message"]',
        '[class*="conversation"]',
        '[class*="chat"]',
        'div[class*="Human"]',
        'div[class*="Assistant"]',
        'div[class*="human"]',
        'div[class*="assistant"]'
    ];
    
    console.log('\n🔎 Searching for message elements...');
    
    possibleSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            console.log(`\nFound ${elements.length} elements with selector: ${selector}`);
            // Sample first element
            if (elements[0]) {
                console.log('First element:', elements[0]);
                console.log('Text preview:', elements[0].textContent.substring(0, 100));
                console.log('Classes:', elements[0].className);
            }
        }
    });
    
    // Look for role indicators
    console.log('\n🔎 Looking for role indicators...');
    const allText = document.body.innerText;
    const hasHuman = allText.includes('Human:') || allText.includes('You:');
    const hasAssistant = allText.includes('Assistant:') || allText.includes('Claude:');
    console.log('Has "Human:" or "You:":', hasHuman);
    console.log('Has "Assistant:" or "Claude:":', hasAssistant);
    
    // Check button from your XPath
    const buttonXPath = '/html/body/div[4]/div[2]/div/div[1]/div/div/div[1]/div[2]/div/div/div[1]/div[1]/button/div[1]/div/span';
    const buttonResult = document.evaluate(buttonXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const button = buttonResult.singleNodeValue;
    
    if (button) {
        console.log('\n✅ Found button element:', button.textContent);
        console.log('Button parent classes:', button.parentElement?.parentElement?.className);
    }
    
    // Look for conversation list
    console.log('\n🔎 Looking for conversation list...');
    const lists = document.querySelectorAll('[role="list"], [class*="list"], [class*="sidebar"]');
    lists.forEach((list, i) => {
        const items = list.querySelectorAll('button, a, [role="listitem"]');
        if (items.length > 1) {
            console.log(`\nFound list ${i + 1} with ${items.length} items`);
            console.log('First item text:', items[0].textContent.substring(0, 50));
        }
    });
    
    // Output useful info about the page structure
    console.log('\n📊 Page Structure Summary:');
    console.log('Total DIVs:', document.querySelectorAll('div').length);
    console.log('Total buttons:', document.querySelectorAll('button').length);
    console.log('Page title:', document.title);
    console.log('URL:', window.location.href);
})();