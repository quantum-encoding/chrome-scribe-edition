// Gemini DOM Scraper - Optimized for large conversations
// Extracts conversations from Google AI Studio with smart scrolling

(async function() {
  console.log('=== AI Chronicle Gemini DOM Scraper (Optimized) ===');
  
  const capturedMessages = new Map();
  let messageCounter = 0;
  
  // Get format from popup (default to markdown)
  const format = window.__AI_CHRONICLE_FORMAT__ || 'md';
  console.log(`Export format: ${format}`);
  
  // Find scroll container
  function findScrollContainer() {
    const autoScroll = document.querySelector('MS-AUTOSCROLL-CONTAINER');
    if (autoScroll) return autoScroll;
    
    const elements = document.querySelectorAll('*');
    for (const el of elements) {
      const style = window.getComputedStyle(el);
      if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && 
          el.scrollHeight > el.clientHeight) {
        return el;
      }
    }
    return document.documentElement;
  }
  
  // Quick expand visible thoughts without waiting
  async function quickExpandThoughts() {
    const thoughtChunks = document.querySelectorAll('MS-THOUGHT-CHUNK');
    const buttons = [];
    
    thoughtChunks.forEach(chunk => {
      const chevron = chunk.querySelector('.material-symbols-outlined');
      if (chevron && chevron.textContent.trim() === 'chevron_right') {
        const button = chevron.closest('button');
        if (button) {
          const rect = button.getBoundingClientRect();
          if (rect.top >= -200 && rect.bottom <= window.innerHeight + 200) {
            buttons.push(button);
          }
        }
      }
    });
    
    // Click all buttons at once
    buttons.forEach(btn => btn.click());
    
    // Only wait if we actually expanded something
    if (buttons.length > 0) {
      await new Promise(r => setTimeout(r, 300));
    }
    
    return buttons.length;
  }
  
  // Process chat turn
  function processChatTurn(turn, index) {
    const textContent = turn.textContent.trim();
    if (!textContent || textContent.length < 20 || textContent === 'edit') {
      return null;
    }
    
    const hasThoughts = turn.querySelector('MS-THOUGHT-CHUNK') !== null;
    const promptChunk = turn.querySelector('MS-PROMPT-CHUNK');
    const textChunks = turn.querySelectorAll('MS-TEXT-CHUNK');
    
    const results = [];
    
    if (hasThoughts) {
      if (promptChunk) {
        const responseText = promptChunk.textContent.trim();
        const mainResponse = responseText.split('Thoughts (experimental)')[0].trim();
        
        if (mainResponse && mainResponse.length > 10) {
          const key = `msg-${mainResponse.substring(0, 100)}`;
          if (!capturedMessages.has(key)) {
            capturedMessages.set(key, {
              type: 'MESSAGE',
              text: mainResponse,
              order: messageCounter++,
              hasThoughts: true
            });
            results.push('MESSAGE');
          }
        }
      }
      
      const thoughtChunk = turn.querySelector('MS-THOUGHT-CHUNK');
      if (thoughtChunk) {
        const thoughtText = thoughtChunk.textContent.trim();
        const cleanThought = thoughtText
          .replace(/Thoughts \(experimental\)[\s\S]*?Auto/, '')
          .replace(/Collapse to hide model thoughts.*$/, '')
          .replace(/chevron_\w+/g, '')
          .trim();
        
        if (cleanThought && cleanThought.length > 20) {
          const key = `thought-${cleanThought.substring(0, 100)}`;
          if (!capturedMessages.has(key)) {
            capturedMessages.set(key, {
              type: 'THOUGHTS',
              text: cleanThought,
              order: messageCounter++,
              parentMessage: messageCounter - 1
            });
            results.push('THOUGHTS');
          }
        }
      }
    } else if (promptChunk && !hasThoughts) {
      const messageText = promptChunk.textContent.trim();
      
      if (messageText && messageText.length > 10) {
        const key = `msg-${messageText.substring(0, 100)}`;
        if (!capturedMessages.has(key)) {
          capturedMessages.set(key, {
            type: 'MESSAGE',
            text: messageText,
            order: messageCounter++,
            hasThoughts: false
          });
          results.push('MESSAGE');
        }
      }
    } else if (textChunks.length > 0) {
      let fullResponse = '';
      textChunks.forEach(chunk => {
        const text = chunk.textContent.trim();
        if (text) fullResponse += text + '\n';
      });
      
      fullResponse = fullResponse.trim();
      
      if (fullResponse && fullResponse.length > 10) {
        const key = `msg-${fullResponse.substring(0, 100)}`;
        if (!capturedMessages.has(key)) {
          capturedMessages.set(key, {
            type: 'MESSAGE',
            text: fullResponse,
            order: messageCounter++,
            hasThoughts: false
          });
          results.push('MESSAGE');
        }
      }
    }
    
    return results;
  }
  
  // Capture all visible messages quickly
  function captureAllVisible() {
    const captured = [];
    const chatTurns = document.querySelectorAll('MS-CHAT-TURN');
    
    chatTurns.forEach((turn, index) => {
      const results = processChatTurn(turn, index);
      if (results) {
        captured.push(...results);
      }
    });
    
    return captured;
  }
  
  // Smart scrolling - adapts speed based on message size
  async function smartScrollAndCapture() {
    const scrollEl = findScrollContainer();
    
    console.log('Going to beginning...');
    scrollEl.scrollTop = 0;
    await new Promise(r => setTimeout(r, 1500));
    
    let lastCaptureCount = 0;
    let noNewMessagesCount = 0;
    let lastScrollPos = 0;
    let stuckCount = 0;
    
    while (true) {
      const currentScroll = scrollEl.scrollTop;
      const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
      const progress = Math.round((currentScroll / maxScroll) * 100);
      
      // Quick expand thoughts
      await quickExpandThoughts();
      
      // Capture everything visible
      captureAllVisible();
      
      const currentCount = capturedMessages.size;
      if (currentCount > lastCaptureCount) {
        const newCount = currentCount - lastCaptureCount;
        console.log(`Progress: ${progress}% | +${newCount} new (Total: ${currentCount})`);
        lastCaptureCount = currentCount;
        noNewMessagesCount = 0;
      } else {
        noNewMessagesCount++;
      }
      
      // Check if we're stuck
      if (Math.abs(currentScroll - lastScrollPos) < 10) {
        stuckCount++;
      } else {
        stuckCount = 0;
      }
      lastScrollPos = currentScroll;
      
      // Exit conditions
      if (currentScroll >= maxScroll - 10) {
        console.log('Reached end');
        break;
      }
      
      if (noNewMessagesCount > 10 && progress > 90) {
        console.log('No new messages near end');
        break;
      }
      
      if (stuckCount > 3) {
        console.log('Scroll appears stuck, attempting recovery...');
        scrollEl.scrollTop = currentScroll + 1000;
        stuckCount = 0;
      }
      
      // Adaptive scrolling - faster for large empty areas
      let scrollStep = 600;
      
      // Check if we're in a large message area
      const visibleTurns = document.querySelectorAll('MS-CHAT-TURN');
      if (visibleTurns.length > 0) {
        const lastTurn = visibleTurns[visibleTurns.length - 1];
        const rect = lastTurn.getBoundingClientRect();
        
        // If the last message extends below viewport, scroll faster
        if (rect.bottom > window.innerHeight * 2) {
          scrollStep = Math.min(2000, rect.height / 2);
          console.log(`Large message detected, jumping ${scrollStep}px`);
        }
      }
      
      scrollEl.scrollTop = Math.min(currentScroll + scrollStep, maxScroll);
      
      // Shorter wait for faster scanning
      await new Promise(r => setTimeout(r, 500));
    }
    
    // Final capture
    await new Promise(r => setTimeout(r, 1000));
    captureAllVisible();
  }
  
  // Format output based on user selection
  function formatOutput(entries, stats, format) {
    const timestamp = new Date().toISOString();
    
    if (format === 'json') {
      return JSON.stringify({
        timestamp,
        platform: 'Google AI Studio (Gemini)',
        stats,
        entries,
        method: 'dom-scraper-optimized'
      }, null, 2);
    } else if (format === 'txt') {
      let output = 'Gemini Conversation Archive\n';
      output += `Captured: ${timestamp}\n`;
      output += `Total Blocks: ${stats.total}\n`;
      output += `Messages: ${stats.messages}\n`;
      output += `Thought Sections: ${stats.thoughts}\n\n`;
      output += '='.repeat(50) + '\n\n';
      
      entries.forEach((entry, i) => {
        if (entry.type === 'MESSAGE') {
          output += `MESSAGE ${entry.order + 1}\n\n`;
          output += `${entry.text}\n\n`;
        } else if (entry.type === 'THOUGHTS') {
          output += `THOUGHTS (Message ${entry.parentMessage + 1})\n\n`;
          output += `${entry.text}\n\n`;
        }
        
        if (i < entries.length - 1) {
          output += '-'.repeat(50) + '\n\n';
        }
      });
      
      return output;
    } else {
      // Default to markdown
      let output = '# Gemini Conversation Archive\n\n';
      output += `**Captured:** ${timestamp}\n`;
      output += `**Total Blocks:** ${stats.total}\n`;
      output += `**Messages:** ${stats.messages}\n`;
      output += `**Thought Sections:** ${stats.thoughts}\n\n`;
      output += '---\n\n';
      
      entries.forEach((entry, i) => {
        if (entry.type === 'MESSAGE') {
          output += `## Message ${entry.order + 1}\n\n`;
          output += `${entry.text}\n\n`;
        } else if (entry.type === 'THOUGHTS') {
          output += `### 💭 Model Thoughts (Message ${entry.parentMessage + 1})\n\n`;
          output += `> ${entry.text.split('\n').join('\n> ')}\n\n`;
        }
        
        if (i < entries.length - 1 && entries[i + 1].type === 'MESSAGE') {
          output += '---\n\n';
        }
      });
      
      return output;
    }
  }
  
  // Safe download with error handling
  async function safeDownload(content, filename, mimeType) {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Use programmatic click to avoid popup blockers
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      return true;
    } catch (error) {
      console.error('Download error:', error);
      return false;
    }
  }
  
  // Main execution
  try {
    console.log('Starting optimized Gemini capture...');
    
    await smartScrollAndCapture();
    
    const entries = Array.from(capturedMessages.values());
    entries.sort((a, b) => a.order - b.order);
    
    const stats = {
      total: entries.length,
      messages: entries.filter(e => e.type === 'MESSAGE').length,
      thoughts: entries.filter(e => e.type === 'THOUGHTS').length
    };
    
    console.log('\n✅ Capture complete!');
    console.log('Statistics:', stats);
    
    // Format output based on user selection
    const output = formatOutput(entries, stats, format);
    
    // Determine file extension and mime type
    let extension = format;
    let mimeType = 'text/plain';
    if (format === 'json') {
      mimeType = 'application/json';
    } else if (format === 'md') {
      extension = 'md';
      mimeType = 'text/markdown';
    }
    
    const date = new Date().toISOString().split('T')[0];
    const filename = `gemini-conversation-${date}.${extension}`;
    
    // Download the file
    const downloadSuccess = await safeDownload(output, filename, mimeType);
    
    if (downloadSuccess) {
      console.log(`📄 Downloaded: ${filename}`);
    } else {
      console.log('⚠️ Download may have been blocked');
    }
    
    // Try to copy to clipboard as backup
    try {
      await navigator.clipboard.writeText(output);
      console.log('📋 Also copied to clipboard!');
    } catch (e) {
      console.log('📋 Clipboard copy not available');
    }
    
    console.log(`📏 Total: ${output.length} characters`);
    
    // Store for debugging
    window.conversationData = {
      entries,
      stats,
      output,
      format
    };
    
    console.log('\n💡 Debug: window.conversationData');
    
    // Return data for popup
    return {
      stats,
      output,
      format,
      success: true
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
    return {
      error: error.message,
      success: false
    };
  }
})();