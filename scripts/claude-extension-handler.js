// Claude Extension Handler - Background script handler for auto-capture
// This runs in the background script to coordinate auto-capture

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startClaudeAutoCapture') {
        // Start auto-capture session
        startAutoCapture(sender.tab.id);
        sendResponse({ status: 'started' });
    } else if (request.action === 'claudeConversationScraped') {
        // Handle completion of single conversation scrape
        handleScrapedConversation(request.data, sender.tab.id);
        sendResponse({ status: 'received' });
    }
    return true;
});

// Auto-capture state
const autoCaptureState = {
    active: false,
    tabId: null,
    conversations: [],
    currentIndex: 0,
    results: []
};

async function startAutoCapture(tabId) {
    autoCaptureState.active = true;
    autoCaptureState.tabId = tabId;
    autoCaptureState.currentIndex = 0;
    autoCaptureState.results = [];
    
    // Get conversation list from the content script
    chrome.tabs.sendMessage(tabId, { action: 'getConversationList' }, (response) => {
        if (response && response.conversations) {
            autoCaptureState.conversations = response.conversations;
            console.log(`Starting auto-capture of ${response.conversations.length} conversations`);
            
            // Process first conversation
            if (autoCaptureState.conversations.length > 0) {
                processNextConversation();
            }
        }
    });
}

async function processNextConversation() {
    if (!autoCaptureState.active || autoCaptureState.currentIndex >= autoCaptureState.conversations.length) {
        // All done
        completeAutoCapture();
        return;
    }
    
    const conversation = autoCaptureState.conversations[autoCaptureState.currentIndex];
    console.log(`Processing conversation ${autoCaptureState.currentIndex + 1}/${autoCaptureState.conversations.length}: ${conversation.title}`);
    
    // Navigate to the conversation
    chrome.tabs.update(autoCaptureState.tabId, { url: conversation.url }, () => {
        // Wait for page to load, then inject scraper
        setTimeout(() => {
            chrome.scripting.executeScript({
                target: { tabId: autoCaptureState.tabId },
                files: ['scripts/claude-scraper-single.js']
            });
        }, 4000);
    });
}

function handleScrapedConversation(data, tabId) {
    if (!autoCaptureState.active || tabId !== autoCaptureState.tabId) return;
    
    // Record result
    autoCaptureState.results.push({
        ...autoCaptureState.conversations[autoCaptureState.currentIndex],
        ...data,
        timestamp: new Date().toISOString()
    });
    
    // Move to next
    autoCaptureState.currentIndex++;
    
    // Process next after a delay
    setTimeout(() => {
        processNextConversation();
    }, 2000);
}

function completeAutoCapture() {
    console.log('Auto-capture complete!');
    console.log(`Processed ${autoCaptureState.results.length} conversations`);
    
    // Send completion message to content script
    chrome.tabs.sendMessage(autoCaptureState.tabId, {
        action: 'autoCaptureComplete',
        results: autoCaptureState.results
    });
    
    // Reset state
    autoCaptureState.active = false;
    autoCaptureState.conversations = [];
    autoCaptureState.currentIndex = 0;
    autoCaptureState.results = [];
}