// Background service worker for AI Chronicle

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('[AI Chronicle] Extension installed');
});

// Handle any background tasks if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[AI Chronicle] Background received message:', request);
  
  // Could add features like:
  // - Saving conversations to chrome.storage
  // - Batch processing multiple tabs
  // - Integration with external APIs
  
  return true;
});