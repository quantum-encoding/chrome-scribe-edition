// Popup script for AI Chronicle

let scrapedData = null;

// Update UI elements
const statusEl = document.getElementById('status');
const statusTextEl = document.getElementById('status-text');
const resultsEl = document.getElementById('results');
const messageCountEl = document.getElementById('messageCount');
const charCountEl = document.getElementById('charCount');
const scriptSelectEl = document.getElementById('scriptSelect');

// Buttons
const scrapeBtn = document.getElementById('scrapeBtn');
const autoScrollBtn = document.getElementById('autoScrollBtn');
const debugBtn = document.getElementById('debugBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');

// Update status
function updateStatus(text, type = 'normal') {
  statusTextEl.textContent = text;
  statusEl.className = `status ${type}`;
}

// Format conversation based on selected format
function formatConversation(data, format) {
  const { messages, platform, url, timestamp } = data;
  
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }
  
  let output = '';
  
  if (format === 'md') {
    output += `# AI Conversation Log\n\n`;
    output += `**Platform:** ${platform}\n`;
    output += `**URL:** ${url}\n`;
    output += `**Scraped:** ${new Date(timestamp).toLocaleString()}\n`;
    output += `**Messages:** ${messages.length}\n\n`;
    output += `---\n\n`;
    
    messages.forEach((msg, i) => {
      const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
      output += `## ${role}\n\n`;
      output += `${msg.content}\n\n`;
      if (i < messages.length - 1) {
        output += `---\n\n`;
      }
    });
  } else {
    // Plain text format
    output += `AI Conversation Log\n`;
    output += `Platform: ${platform}\n`;
    output += `URL: ${url}\n`;
    output += `Scraped: ${new Date(timestamp).toLocaleString()}\n`;
    output += `Messages: ${messages.length}\n\n`;
    output += `${'='.repeat(50)}\n\n`;
    
    messages.forEach((msg, i) => {
      const role = msg.role.toUpperCase();
      output += `${role}:\n${msg.content}\n\n`;
      if (i < messages.length - 1) {
        output += `${'-'.repeat(50)}\n\n`;
      }
    });
  }
  
  return output;
}

// Scrape conversation
async function scrapeConversation(autoScroll = false) {
  updateStatus('Starting capture...', 'scraping');
  scrapeBtn.disabled = true;
  autoScrollBtn.disabled = true;
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const selectedScript = scriptSelectEl.value;
    
    // Check if this is Google AI Studio and Gemini is selected
    if (tab.url.includes('aistudio.google.com') && selectedScript === 'gemini') {
      // Use the Gemini DOM scraper for Google AI Studio
      updateStatus('Using Gemini DOM scraper...', 'scraping');
      
      // Get the selected format
      const format = document.querySelector('input[name="format"]:checked').value;
      
      // First inject the script, then send a message with the format
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (selectedFormat) => {
          window.__AI_CHRONICLE_FORMAT__ = selectedFormat;
        },
        args: [format]
      });
      
      // Now inject and execute the appropriate scraper
      const scraperFile = autoScroll ? 'scripts/gemini-turbo-scraper.js' : 'scripts/gemini-dom-scraper.js';
      console.log(`Using scraper: ${scraperFile}`);
      
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [scraperFile]
      });
      
      // The scraper will return the data
      if (result && result.result) {
        scrapedData = result.result;
        const charCount = scrapedData.output.length;
        messageCountEl.textContent = scrapedData.stats.messages;
        charCountEl.textContent = charCount.toLocaleString();
        resultsEl.style.display = 'block';
        updateStatus('Capture complete!', 'success');
      } else {
        updateStatus('Capture complete! Check your downloads folder.', 'success');
        resultsEl.style.display = 'none';
      }
      
    } else {
      // Use the original content script for other platforms
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: autoScroll ? 'autoScrollScrape' : 'scrape'
      });
      
      if (response.error) {
        updateStatus(`Error: ${response.error}`, 'error');
        return;
      }
      
      scrapedData = response;
      
      // Update UI with results
      const charCount = response.messages.reduce((sum, msg) => sum + msg.content.length, 0);
      messageCountEl.textContent = response.messages.length;
      charCountEl.textContent = charCount.toLocaleString();
      
      resultsEl.style.display = 'block';
      updateStatus('Scraping complete!', 'success');
    }
    
  } catch (error) {
    console.error('Scraping error:', error);
    updateStatus('Failed to scrape conversation', 'error');
  } finally {
    scrapeBtn.disabled = false;
    autoScrollBtn.disabled = false;
  }
}

// Copy to clipboard
async function copyToClipboard() {
  if (!scrapedData) return;
  
  const format = document.querySelector('input[name="format"]:checked').value;
  const formatted = formatConversation(scrapedData, format);
  
  try {
    await navigator.clipboard.writeText(formatted);
    updateStatus('Copied to clipboard!', 'success');
  } catch (error) {
    console.error('Copy error:', error);
    updateStatus('Failed to copy', 'error');
  }
}

// Download file
function downloadFile() {
  if (!scrapedData) return;
  
  const format = document.querySelector('input[name="format"]:checked').value;
  const formatted = formatConversation(scrapedData, format);
  
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `ai-conversation-${timestamp}.${format}`;
  
  const blob = new Blob([formatted], { 
    type: format === 'json' ? 'application/json' : 'text/plain' 
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  
  updateStatus('Downloaded successfully!', 'success');
}

// Debug DOM structure
async function debugDOM() {
  updateStatus('Analyzing DOM structure...', 'scraping');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'debug'
    });
    
    updateStatus('Debug info logged to DevTools console', 'success');
    
  } catch (error) {
    console.error('Debug error:', error);
    updateStatus('Failed to debug DOM', 'error');
  }
}

// Event listeners
scrapeBtn.addEventListener('click', () => scrapeConversation(false));
autoScrollBtn.addEventListener('click', () => scrapeConversation(true));
debugBtn.addEventListener('click', debugDOM);
copyBtn.addEventListener('click', copyToClipboard);
downloadBtn.addEventListener('click', downloadFile);

// Check if we're on a supported site and update dropdown
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0].url;
  
  // Auto-select the appropriate script based on URL
  if (url.includes('aistudio.google.com')) {
    scriptSelectEl.value = 'gemini';
    scrapeBtn.disabled = false;
    autoScrollBtn.disabled = false;
  } else if (url.includes('chat.openai.com')) {
    scriptSelectEl.value = 'gpt';
    updateStatus('ChatGPT support coming soon', 'error');
    scrapeBtn.disabled = true;
    autoScrollBtn.disabled = true;
  } else if (url.includes('claude.ai')) {
    scriptSelectEl.value = 'claude';
    updateStatus('Claude support coming soon', 'error');
    scrapeBtn.disabled = true;
    autoScrollBtn.disabled = true;
  } else {
    updateStatus('Navigate to an AI chat to scrape', 'error');
    scrapeBtn.disabled = true;
    autoScrollBtn.disabled = true;
  }
});

// Handle script selection changes
scriptSelectEl.addEventListener('change', () => {
  const selectedScript = scriptSelectEl.value;
  if (selectedScript === 'gpt' || selectedScript === 'claude') {
    updateStatus(`${selectedScript.toUpperCase()} support coming soon`, 'error');
    scrapeBtn.disabled = true;
    autoScrollBtn.disabled = true;
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0].url;
      if (url.includes('aistudio.google.com') && selectedScript === 'gemini') {
        updateStatus('Ready to scrape', 'normal');
        scrapeBtn.disabled = false;
        autoScrollBtn.disabled = false;
      }
    });
  }
});