// AI Studio Numbered Message Scraper
// Simply numbers messages in order without trying to identify speakers

(async function() {
  console.log('=== AI Chronicle Numbered Message Scraper ===');
  console.log('Capturing messages in numbered blocks...');
  
  const capturedMessages = new Map();
  let messageCounter = 0;
  
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
  
  // Expand visible thoughts
  async function expandVisibleThoughts() {
    let expanded = 0;
    const thoughtChunks = document.querySelectorAll('MS-THOUGHT-CHUNK');
    
    for (const chunk of thoughtChunks) {
      const chevron = chunk.querySelector('.material-symbols-outlined');
      if (chevron && chevron.textContent.trim() === 'chevron_right') {
        const button = chevron.closest('button');
        if (button) {
          const rect = button.getBoundingClientRect();
          if (rect.top >= -100 && rect.bottom <= window.innerHeight + 100) {
            console.log('Expanding thoughts...');
            button.click();
            expanded++;
            await new Promise(r => setTimeout(r, 500));
          }
        }
      }
    }
    
    return expanded;
  }
  
  // Process a chat turn
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
      // Message with thoughts
      console.log(`Turn ${index}: Message with thoughts`);
      
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
      
      // Extract thoughts as separate block
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
      // Regular message without thoughts
      const messageText = promptChunk.textContent.trim();
      
      if (messageText && messageText.length > 10) {
        console.log(`Turn ${index}: Regular message`);
        
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
      // Text chunks without prompt chunk
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
  
  // Capture visible messages
  function captureVisibleMessages() {
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
  
  // Main scrolling and capture
  async function scrollAndCapture() {
    const scrollEl = findScrollContainer();
    
    console.log('Going to beginning...');
    scrollEl.scrollTop = 0;
    await new Promise(r => setTimeout(r, 2000));
    
    const scrollStep = 400;
    let lastCaptureCount = 0;
    let noNewMessagesCount = 0;
    
    while (true) {
      const currentScroll = scrollEl.scrollTop;
      const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
      const progress = Math.round((currentScroll / maxScroll) * 100);
      
      const expanded = await expandVisibleThoughts();
      if (expanded > 0) {
        console.log(`Expanded ${expanded} thought sections`);
        await new Promise(r => setTimeout(r, 1000));
      }
      
      const captured = captureVisibleMessages();
      
      const currentCount = capturedMessages.size;
      if (currentCount > lastCaptureCount) {
        const newCount = currentCount - lastCaptureCount;
        console.log(`Progress: ${progress}% | +${newCount} new (Total: ${currentCount})`);
        lastCaptureCount = currentCount;
        noNewMessagesCount = 0;
      } else {
        noNewMessagesCount++;
      }
      
      if (currentScroll >= maxScroll - 10) {
        console.log('Reached end');
        break;
      }
      
      if (noNewMessagesCount > 5 && progress > 90) {
        console.log('No new messages near end');
        break;
      }
      
      scrollEl.scrollTop = Math.min(currentScroll + scrollStep, maxScroll);
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  
  // Format output
  function formatOutput(entries, stats) {
    const timestamp = new Date().toISOString();
    
    let output = '# AI Studio Conversation Archive\n\n';
    output += `**Captured:** ${timestamp}\n`;
    output += `**Total Blocks:** ${stats.total}\n`;
    output += `**Messages:** ${stats.messages}\n`;
    output += `**Thought Sections:** ${stats.thoughts}\n\n`;
    output += '---\n\n';
    
    entries.forEach((entry, i) => {
      if (entry.type === 'MESSAGE') {
        output += `## Message Block ${entry.order + 1}\n\n`;
        output += `${entry.text}\n\n`;
      } else if (entry.type === 'THOUGHTS') {
        output += `### 💭 Thoughts (for Message ${entry.parentMessage + 1})\n\n`;
        output += `> ${entry.text.split('\n').join('\n> ')}\n\n`;
      }
      
      // Add separator between message blocks (but not after thoughts)
      if (i < entries.length - 1 && entries[i + 1].type === 'MESSAGE') {
        output += '---\n\n';
      }
    });
    
    return output;
  }
  
  // Main execution
  try {
    console.log('Starting numbered message capture...');
    
    await scrollAndCapture();
    
    const entries = Array.from(capturedMessages.values());
    entries.sort((a, b) => a.order - b.order);
    
    const stats = {
      total: entries.length,
      messages: entries.filter(e => e.type === 'MESSAGE').length,
      thoughts: entries.filter(e => e.type === 'THOUGHTS').length
    };
    
    console.log('\n✅ Capture complete!');
    console.log('Statistics:', stats);
    
    const output = formatOutput(entries, stats);
    
    // Save files
    const date = new Date().toISOString().split('T')[0];
    
    const mdBlob = new Blob([output], { type: 'text/markdown' });
    const mdUrl = URL.createObjectURL(mdBlob);
    const mdLink = document.createElement('a');
    mdLink.href = mdUrl;
    mdLink.download = `ai-studio-conversation-${date}.md`;
    mdLink.click();
    
    const jsonData = {
      timestamp: new Date().toISOString(),
      stats,
      entries,
      method: 'numbered-blocks'
    };
    
    const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = `ai-studio-conversation-${date}.json`;
    jsonLink.click();
    
    try {
      await navigator.clipboard.writeText(output);
      console.log('📋 Copied to clipboard!');
    } catch (e) {
      const textarea = document.createElement('textarea');
      textarea.value = output;
      textarea.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      console.log('📋 Copied (fallback)!');
    }
    
    console.log(`\n📄 Downloaded: ${mdLink.download}`);
    console.log(`📊 Downloaded: ${jsonLink.download}`);
    console.log(`📏 Total: ${output.length} characters`);
    
    window.conversationData = {
      entries,
      stats,
      output
    };
    
    console.log('\n💡 Debug: window.conversationData');
    
    setTimeout(() => {
      URL.revokeObjectURL(mdUrl);
      URL.revokeObjectURL(jsonUrl);
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  }
})();