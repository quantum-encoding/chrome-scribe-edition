// Content script for AI Chronicle - Runs on AI chat pages

// Platform-specific selectors
const PLATFORM_CONFIGS = {
  'aistudio.google.com': {
    name: 'Google AI Studio',
    selectors: {
      container: [
        '[class*="styles__ChatContainer"]',
        '[class*="styles__MessagesContainer"]',
        '[class*="scrollHeight"]',
        'div[style*="overflow"]',
        '.conversation-container',
        'main[role="main"]'
      ],
      messageBlock: [
        '[class*="styles__Message"]',
        '[class*="styles__Turn"]',
        'div[class*="message"]',
        'div[class*="turn"]',
        '.message-wrapper'
      ],
      userMessage: [
        '[class*="styles__UserMessage"]',
        '[class*="user"]',
        '.user-message',
        '[data-sender="user"]'
      ],
      aiMessage: [
        '[class*="styles__ModelMessage"]',
        '[class*="assistant"]',
        '[class*="model"]',
        '.model-message',
        '[data-sender="model"]'
      ],
      messageContent: [
        '[class*="styles__MessageContent"]',
        '[class*="styles__Content"]',
        '.message-content',
        'div[class*="content"] > div',
        'pre',
        'p'
      ]
    }
  },
  'chat.openai.com': {
    name: 'ChatGPT',
    selectors: {
      container: ['.flex.flex-col.pb-9'],
      messageBlock: ['.group.w-full'],
      userMessage: ['.dark\\:bg-gray-800'],
      aiMessage: ['.bg-gray-50.dark\\:bg-\\[\\#444654\\]'],
      messageContent: ['.prose', '.markdown']
    }
  },
  'claude.ai': {
    name: 'Claude',
    selectors: {
      container: ['.flex.flex-col.pb-4'],
      messageBlock: ['.group'],
      userMessage: ['[data-testid="user-message"]'],
      aiMessage: ['[data-testid="assistant-message"]'],
      messageContent: ['.prose']
    }
  }
};

// Get current platform config
function getPlatformConfig() {
  const hostname = window.location.hostname;
  for (const [domain, config] of Object.entries(PLATFORM_CONFIGS)) {
    if (hostname.includes(domain)) {
      return config;
    }
  }
  return null;
}

// Try multiple selectors until one works
function trySelectors(container, selectors) {
  for (const selector of selectors) {
    try {
      const element = container.querySelector(selector);
      if (element) return element;
    } catch (e) {
      console.log(`Selector failed: ${selector}`, e);
    }
  }
  return null;
}

// Extract text content from element
function extractText(element) {
  if (!element) return '';
  
  // Clone to avoid modifying the original
  const clone = element.cloneNode(true);
  
  // Remove any buttons, icons, etc.
  clone.querySelectorAll('button, svg, .copy-button').forEach(el => el.remove());
  
  // Get text content
  let text = clone.innerText || clone.textContent || '';
  
  // Clean up excessive whitespace
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  
  return text;
}

// Main scraping function
function scrapeConversation() {
  console.log('[AI Chronicle] Starting conversation scrape...');
  
  const config = getPlatformConfig();
  if (!config) {
    console.error('[AI Chronicle] Platform not supported');
    return { error: 'Platform not supported', messages: [] };
  }
  
  console.log(`[AI Chronicle] Detected platform: ${config.name}`);
  
  // Find container
  let container = null;
  for (const selector of config.selectors.container) {
    container = document.querySelector(selector);
    if (container) {
      console.log(`[AI Chronicle] Found container: ${selector}`);
      break;
    }
  }
  
  if (!container) {
    console.error('[AI Chronicle] Could not find conversation container');
    return { error: 'Could not find conversation container', messages: [] };
  }
  
  // Find all message blocks
  const messages = [];
  let messageElements = [];
  
  for (const selector of config.selectors.messageBlock) {
    messageElements = container.querySelectorAll(selector);
    if (messageElements.length > 0) {
      console.log(`[AI Chronicle] Found ${messageElements.length} messages with selector: ${selector}`);
      break;
    }
  }
  
  if (messageElements.length === 0) {
    console.warn('[AI Chronicle] No messages found, trying alternative approach...');
    // Fallback: get all divs with substantial text content
    const allDivs = container.querySelectorAll('div');
    const potentialMessages = [];
    
    allDivs.forEach(div => {
      const text = div.innerText?.trim();
      // Look for divs with reasonable text length and not too many children
      if (text && text.length > 20 && text.length < 50000 && div.children.length < 10) {
        // Check if this div contains other message divs (avoid containers)
        const hasMessageChildren = Array.from(div.children).some(child => 
          child.innerText && child.innerText.length > 20
        );
        if (!hasMessageChildren) {
          potentialMessages.push(div);
        }
      }
    });
    
    messageElements = potentialMessages;
    console.log(`[AI Chronicle] Found ${messageElements.length} potential messages via fallback`);
  }
  
  // Process each message
  messageElements.forEach((element, index) => {
    let role = 'unknown';
    let content = '';
    
    // Determine if user or AI message
    const isUser = config.selectors.userMessage.some(sel => {
      try {
        return element.matches(sel) || element.querySelector(sel);
      } catch (e) {
        return false;
      }
    });
    
    const isAI = config.selectors.aiMessage.some(sel => {
      try {
        return element.matches(sel) || element.querySelector(sel);
      } catch (e) {
        return false;
      }
    });
    
    if (isUser) {
      role = 'user';
    } else if (isAI) {
      role = 'assistant';
    }
    
    // Extract content
    const contentElement = trySelectors(element, config.selectors.messageContent);
    if (contentElement) {
      content = extractText(contentElement);
    } else {
      // Fallback to full element text
      content = extractText(element);
    }
    
    // Only add if we have meaningful content
    if (content && content.length > 0) {
      messages.push({
        role,
        content,
        timestamp: new Date().toISOString(),
        index
      });
    }
  });
  
  console.log(`[AI Chronicle] Scraped ${messages.length} messages`);
  return { 
    messages, 
    platform: config.name,
    url: window.location.href,
    timestamp: new Date().toISOString()
  };
}

// Auto-scroll function for long conversations
async function autoScrollAndScrape() {
  console.log('[AI Chronicle] Starting auto-scroll scrape...');
  
  // Scroll to top first
  window.scrollTo(0, 0);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  let lastHeight = 0;
  let sameHeightCount = 0;
  
  while (sameHeightCount < 3) {
    const currentHeight = document.documentElement.scrollHeight;
    
    if (currentHeight === lastHeight) {
      sameHeightCount++;
    } else {
      sameHeightCount = 0;
      lastHeight = currentHeight;
    }
    
    // Scroll down
    window.scrollTo(0, currentHeight);
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // Now scrape everything
  return scrapeConversation();
}

// Debug function to analyze the page structure
function debugDOMStructure() {
  console.log('[AI Chronicle] === DOM DEBUG MODE ===');
  
  // Log all elements with common class patterns
  const patterns = ['message', 'chat', 'turn', 'conversation', 'response', 'user', 'assistant', 'model'];
  
  patterns.forEach(pattern => {
    const elements = document.querySelectorAll(`[class*="${pattern}"]`);
    if (elements.length > 0) {
      console.log(`[AI Chronicle] Found ${elements.length} elements with "${pattern}" in class:`);
      elements.forEach((el, i) => {
        if (i < 3) { // Only log first 3 to avoid spam
          console.log(`  - ${el.className}`);
          console.log(`    Tag: ${el.tagName}, Text preview: "${el.innerText?.substring(0, 50)}..."`);
        }
      });
    }
  });
  
  // Also check for custom elements
  const customElements = document.querySelectorAll('*');
  const customTags = new Set();
  customElements.forEach(el => {
    if (el.tagName.includes('-')) {
      customTags.add(el.tagName);
    }
  });
  
  if (customTags.size > 0) {
    console.log('[AI Chronicle] Found custom elements:', Array.from(customTags));
  }
  
  // Check for shadow DOM
  const elementsWithShadow = [];
  document.querySelectorAll('*').forEach(el => {
    if (el.shadowRoot) {
      elementsWithShadow.push(el);
    }
  });
  
  if (elementsWithShadow.length > 0) {
    console.log('[AI Chronicle] Found elements with shadow DOM:', elementsWithShadow);
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[AI Chronicle] Received message:', request);
  
  if (request.action === 'debug') {
    debugDOMStructure();
    sendResponse({ status: 'Debug info logged to console' });
  } else if (request.action === 'scrape') {
    const result = scrapeConversation();
    sendResponse(result);
  } else if (request.action === 'autoScrollScrape') {
    autoScrollAndScrape().then(result => {
      sendResponse(result);
    });
    return true; // Keep message channel open for async response
  }
});

// Log that content script is loaded
console.log('[AI Chronicle] Content script loaded on', window.location.hostname);