// Gemini TURBO Scraper - Optimized for MASSIVE conversations (855k+ tokens)
// Uses aggressive scrolling like a real human would

(async function() {
  console.log('=== AI Chronicle TURBO Scraper - ENGAGED ===');
  console.log('Built for speed - handling massive conversations!');
  
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
  
  // TURBO expand - click all buttons instantly
  async function turboExpandThoughts() {
    const thoughtChunks = document.querySelectorAll('MS-THOUGHT-CHUNK');
    const buttons = [];
    
    thoughtChunks.forEach(chunk => {
      const chevron = chunk.querySelector('.material-symbols-outlined');
      if (chevron && chevron.textContent.trim() === 'chevron_right') {
        const button = chevron.closest('button');
        if (button) buttons.push(button);
      }
    });
    
    // Click all at once - no waiting
    buttons.forEach(btn => btn.click());
    
    // Minimal wait only if we clicked something
    if (buttons.length > 0) {
      await new Promise(r => setTimeout(r, 100));
    }
    
    return buttons.length;
  }
  
  // Process chat turn (same as before but optimized)
  function processChatTurn(turn) {
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
  
  // TURBO capture - process everything instantly
  function turboCaptureAll() {
    const chatTurns = document.querySelectorAll('MS-CHAT-TURN');
    let captured = 0;
    
    chatTurns.forEach(turn => {
      const results = processChatTurn(turn);
      if (results) captured += results.length;
    });
    
    return captured;
  }
  
  // TURBO SCROLL - Like a human on caffeine!
  async function turboScroll() {
    const scrollEl = findScrollContainer();
    
    console.log('🚀 TURBO MODE: Going to start...');
    scrollEl.scrollTop = 0;
    await new Promise(r => setTimeout(r, 1000));
    
    let lastCaptureCount = 0;
    let noNewMessagesCount = 0;
    let lastScrollPos = 0;
    let stuckCount = 0;
    let turboMode = false;
    
    while (true) {
      const currentScroll = scrollEl.scrollTop;
      const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
      const progress = Math.round((currentScroll / maxScroll) * 100);
      
      // Turbo expand
      await turboExpandThoughts();
      
      // Turbo capture
      const newItems = turboCaptureAll();
      
      const currentCount = capturedMessages.size;
      if (currentCount > lastCaptureCount) {
        const newCount = currentCount - lastCaptureCount;
        console.log(`🔥 TURBO Progress: ${progress}% | +${newCount} new (Total: ${currentCount})`);
        lastCaptureCount = currentCount;
        noNewMessagesCount = 0;
      } else {
        noNewMessagesCount++;
      }
      
      // Check if stuck
      if (Math.abs(currentScroll - lastScrollPos) < 10) {
        stuckCount++;
      } else {
        stuckCount = 0;
      }
      lastScrollPos = currentScroll;
      
      // Exit conditions
      if (currentScroll >= maxScroll - 10) {
        console.log('✅ Reached end!');
        break;
      }
      
      if (noNewMessagesCount > 15 && progress > 95) {
        console.log('✅ No new messages near end');
        break;
      }
      
      if (stuckCount > 5) {
        console.log('⚡ TURBO BOOST - Breaking through!');
        scrollEl.scrollTop = currentScroll + 5000;
        stuckCount = 0;
      }
      
      // TURBO SCROLLING LOGIC
      let scrollStep;
      
      // Check message density
      const visibleTurns = document.querySelectorAll('MS-CHAT-TURN');
      const viewportHeight = window.innerHeight;
      
      if (visibleTurns.length === 0) {
        // No messages visible - MAXIMUM SPEED
        scrollStep = 10000;
        turboMode = true;
      } else if (visibleTurns.length === 1) {
        // Single huge message - jump through it
        const turn = visibleTurns[0];
        const rect = turn.getBoundingClientRect();
        scrollStep = Math.min(8000, rect.height * 0.8);
        turboMode = true;
      } else if (visibleTurns.length < 3) {
        // Few large messages
        scrollStep = 5000;
        turboMode = true;
      } else {
        // Multiple messages - still fast but more careful
        scrollStep = 2500;
        turboMode = false;
      }
      
      // Human-like mouse wheel simulation
      if (turboMode) {
        console.log(`⚡ TURBO JUMP: ${scrollStep}px`);
      }
      
      // Scroll like a human would - fast swipes
      scrollEl.scrollTop = Math.min(currentScroll + scrollStep, maxScroll);
      
      // Very short pause - just enough to load
      await new Promise(r => setTimeout(r, turboMode ? 200 : 300));
      
      // Extra progress indicator for massive conversations
      if (currentCount % 100 === 0 && currentCount > 0) {
        const estimatedTotal = Math.round(currentCount / (progress / 100));
        console.log(`📊 Milestone: ${currentCount} messages captured (~${estimatedTotal} total estimated)`);
      }
    }
    
    // Final sweep
    console.log('🔍 Final capture sweep...');
    await new Promise(r => setTimeout(r, 500));
    turboCaptureAll();
  }
  
  // Format output (optimized)
  function formatOutput(entries, stats, format) {
    const timestamp = new Date().toISOString();
    
    if (format === 'json') {
      return JSON.stringify({
        timestamp,
        platform: 'Google AI Studio (Gemini)',
        stats,
        entries,
        method: 'turbo-scraper'
      }, null, 2);
    } else if (format === 'txt') {
      let output = 'Gemini Conversation Archive (TURBO)\n';
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
      // Markdown
      let output = '# Gemini Conversation Archive (TURBO)\n\n';
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
  
  // Turbo download
  async function turboDownload(content, filename, mimeType) {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    } catch (error) {
      console.error('Download error:', error);
      return false;
    }
  }
  
  // MAIN TURBO EXECUTION
  try {
    console.log('🚀 Starting TURBO capture for massive conversation...');
    const startTime = Date.now();
    
    await turboScroll();
    
    const entries = Array.from(capturedMessages.values());
    entries.sort((a, b) => a.order - b.order);
    
    const stats = {
      total: entries.length,
      messages: entries.filter(e => e.type === 'MESSAGE').length,
      thoughts: entries.filter(e => e.type === 'THOUGHTS').length
    };
    
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✅ TURBO Capture complete in ${elapsed} seconds!`);
    console.log('📊 Statistics:', stats);
    
    // Format output
    const output = formatOutput(entries, stats, format);
    
    // File details
    let extension = format === 'json' ? 'json' : (format === 'md' ? 'md' : 'txt');
    let mimeType = format === 'json' ? 'application/json' : 
                   (format === 'md' ? 'text/markdown' : 'text/plain');
    
    const date = new Date().toISOString().split('T')[0];
    const filename = `gemini-turbo-${date}.${extension}`;
    
    // Download
    const downloadSuccess = await turboDownload(output, filename, mimeType);
    
    if (downloadSuccess) {
      console.log(`📄 Downloaded: ${filename}`);
      console.log(`📏 Size: ${(output.length / 1024 / 1024).toFixed(2)} MB`);
    }
    
    // Try clipboard as backup
    try {
      await navigator.clipboard.writeText(output);
      console.log('📋 Also copied to clipboard!');
    } catch (e) {
      console.log('📋 Clipboard not available for large content');
    }
    
    // Debug info
    window.turboConversationData = {
      entries,
      stats,
      output,
      format,
      elapsed
    };
    
    console.log('\n💡 Debug: window.turboConversationData');
    console.log(`⚡ Messages per second: ${(stats.total / elapsed).toFixed(1)}`);
    
    return {
      stats,
      output,
      format,
      success: true,
      elapsed
    };
    
  } catch (error) {
    console.error('❌ TURBO Error:', error);
    console.error(error.stack);
    return {
      error: error.message,
      success: false
    };
  }
})();