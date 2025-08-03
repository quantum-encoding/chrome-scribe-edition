// ChatGPT Debug Scraper - Helps identify role patterns
(function() {
    'use strict';
    
    console.log('🔍 ChatGPT Debug Scraper Starting...');
    
    const conversationContainer = document.querySelector('div[class*="thread"]');
    const articles = conversationContainer.querySelectorAll('article');
    
    console.log(`Found ${articles.length} messages`);
    
    articles.forEach((article, index) => {
        // Extract text for analysis
        const fullText = article.textContent || '';
        const firstChars = fullText.substring(0, 100);
        
        // Look for various indicators
        const hasYou = fullText.includes('You');
        const hasChatGPT = fullText.includes('ChatGPT');
        const hasUser = fullText.toLowerCase().includes('user');
        const hasAssistant = fullText.toLowerCase().includes('assistant');
        
        // Check for specific attributes
        const dataTestIds = Array.from(article.querySelectorAll('[data-testid]')).map(el => el.getAttribute('data-testid'));
        const imgAlts = Array.from(article.querySelectorAll('img')).map(img => img.getAttribute('alt'));
        
        // Check parent/sibling elements for role indicators
        const parentClasses = article.parentElement ? article.parentElement.className : '';
        
        console.log(`\n=== Message ${index} ===`);
        console.log('First 100 chars:', firstChars.replace(/\n/g, ' '));
        console.log('Indicators:', {
            hasYou,
            hasChatGPT,
            hasUser,
            hasAssistant,
            dataTestIds,
            imgAlts,
            parentClasses: parentClasses.substring(0, 100)
        });
        console.log('Index:', index, 'Expected role (if alternating):', index % 2 === 0 ? 'user' : 'assistant');
    });
    
    // Auto-download debug info as text file
    console.log('\n📥 Auto-saving debug output...');
    
    let debugText = 'ChatGPT Role Detection Debug Output\n';
    debugText += '===================================\n\n';
    debugText += `Total messages found: ${articles.length}\n\n`;
    
    articles.forEach((article, index) => {
        const fullText = article.textContent || '';
        const firstChars = fullText.substring(0, 100).replace(/\n/g, ' ');
        
        debugText += `=== Message ${index} ===\n`;
        debugText += `First 100 chars: ${firstChars}\n`;
        debugText += `Has "You": ${fullText.includes('You')}\n`;
        debugText += `Has "ChatGPT": ${fullText.includes('ChatGPT')}\n`;
        debugText += `Expected role (alternating): ${index % 2 === 0 ? 'user' : 'assistant'}\n`;
        debugText += '\n';
    });
    
    const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(debugText);
    const exportLink = document.createElement('a');
    exportLink.setAttribute('href', dataUri);
    exportLink.setAttribute('download', `chatgpt-debug-${Date.now()}.txt`);
    document.body.appendChild(exportLink);
    exportLink.click();
    document.body.removeChild(exportLink);
    
    console.log('✅ Debug file downloaded!');
})();