// Universal TURBO Scraper - Works on ANY page to capture all text content
// When you can't find the right selectors, just grab EVERYTHING!

(async function() {
  console.log('=== AI Chronicle UNIVERSAL TURBO Scraper ===');
  console.log('🌍 Capturing ALL text content from this page...');
  
  const capturedBlocks = new Map();
  let blockCounter = 0;
  
  // Get format from popup (default to markdown)
  const format = window.__AI_CHRONICLE_FORMAT__ || 'md';
  console.log(`Export format: ${format}`);
  
  // Find scrollable container
  function findScrollContainer() {
    // Check common scroll containers
    const candidates = [
      document.documentElement,
      document.body,
      document.querySelector('main'),
      document.querySelector('[role="main"]'),
      document.querySelector('.main-content'),
      document.querySelector('#content')
    ];
    
    // Find the tallest scrollable element
    let scrollEl = document.documentElement;
    let maxHeight = 0;
    
    for (const el of candidates) {
      if (el && el.scrollHeight > maxHeight) {
        const style = window.getComputedStyle(el);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll' || el === document.documentElement) {
          scrollEl = el;
          maxHeight = el.scrollHeight;
        }
      }
    }
    
    // Also check all elements for the one with largest scroll height
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      if (el.scrollHeight > maxHeight) {
        const style = window.getComputedStyle(el);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          scrollEl = el;
          maxHeight = el.scrollHeight;
        }
      }
    }
    
    console.log(`Found scroll container: ${scrollEl.tagName}, height: ${maxHeight}px`);
    return scrollEl;
  }
  
  // Extract text from any element
  function extractTextContent(element) {
    // Skip script and style tags
    if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE' || element.tagName === 'NOSCRIPT') {
      return '';
    }
    
    // Clone to avoid modifying original
    const clone = element.cloneNode(true);
    
    // Remove scripts, styles, and other non-content
    const removeElements = clone.querySelectorAll('script, style, noscript, iframe, object, embed, video, audio, canvas');
    removeElements.forEach(el => el.remove());
    
    // Get text
    let text = clone.innerText || clone.textContent || '';
    
    // Clean up
    text = text.replace(/\n{3,}/g, '\n\n').trim();
    
    return text;
  }
  
  // Capture all visible text blocks
  function captureVisibleBlocks() {
    const viewport = {
      top: window.pageYOffset - 500,
      bottom: window.pageYOffset + window.innerHeight + 500
    };
    
    // Strategy 1: Look for common content containers
    const contentSelectors = [
      'article', 'section', 'main',
      '[role="main"]', '[role="article"]',
      '.message', '.post', '.comment', '.content',
      '.conversation', '.chat', '.thread',
      'div[class*="message"]', 'div[class*="content"]',
      'div[class*="text"]', 'div[class*="body"]',
      'p', 'pre', 'blockquote', 'li'
    ];
    
    let captured = 0;
    
    for (const selector of contentSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        
        for (const element of elements) {
          const rect = element.getBoundingClientRect();
          
          // Check if in extended viewport
          if (rect.bottom >= viewport.top && rect.top <= viewport.bottom) {
            const text = extractTextContent(element);
            
            // Only capture meaningful text blocks
            if (text && text.length > 30) {
              const key = `${element.tagName}-${text.substring(0, 50)}`;
              
              if (!capturedBlocks.has(key)) {
                // Try to identify the type of content
                let blockType = 'TEXT';
                
                // Check for code blocks
                if (element.tagName === 'PRE' || element.querySelector('code')) {
                  blockType = 'CODE';
                } else if (element.tagName === 'BLOCKQUOTE') {
                  blockType = 'QUOTE';
                } else if (text.length > 500) {
                  blockType = 'LONG_TEXT';
                }
                
                capturedBlocks.set(key, {
                  type: blockType,
                  text: text,
                  order: blockCounter++,
                  tag: element.tagName,
                  classes: element.className,
                  length: text.length
                });
                captured++;
              }
            }
          }
        }
      } catch (e) {
        // Ignore selector errors
      }
    }
    
    // Strategy 2: If we didn't get much, just grab all divs with text
    if (captured < 10) {
      const allDivs = document.querySelectorAll('div');
      
      for (const div of allDivs) {
        const rect = div.getBoundingClientRect();
        
        if (rect.bottom >= viewport.top && rect.top <= viewport.bottom) {
          const text = extractTextContent(div);
          
          if (text && text.length > 50 && text.length < 50000) {
            const key = `DIV-${text.substring(0, 50)}`;
            
            if (!capturedBlocks.has(key)) {
              capturedBlocks.set(key, {
                type: 'EXTRACTED',
                text: text,
                order: blockCounter++,
                tag: 'DIV',
                classes: div.className,
                length: text.length
              });
              captured++;
            }
          }
        }
      }
    }
    
    return captured;
  }
  
  // Universal turbo scroll
  async function universalTurboScroll() {
    const scrollEl = findScrollContainer();
    
    console.log('🚀 Starting universal capture...');
    scrollEl.scrollTop = 0;
    await new Promise(r => setTimeout(r, 1000));
    
    let lastCaptureCount = 0;
    let noNewBlocksCount = 0;
    let lastScrollPos = 0;
    let stuckCount = 0;
    
    while (true) {
      const currentScroll = scrollEl.scrollTop;
      const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
      const progress = Math.round((currentScroll / maxScroll) * 100);
      
      // Capture everything visible
      const newBlocks = captureVisibleBlocks();
      
      const currentCount = capturedBlocks.size;
      if (currentCount > lastCaptureCount) {
        const newCount = currentCount - lastCaptureCount;
        console.log(`🌍 Progress: ${progress}% | +${newCount} blocks (Total: ${currentCount})`);
        lastCaptureCount = currentCount;
        noNewBlocksCount = 0;
      } else {
        noNewBlocksCount++;
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
        console.log('✅ Reached end of page');
        break;
      }
      
      if (noNewBlocksCount > 20 && progress > 95) {
        console.log('✅ No new content near end');
        break;
      }
      
      if (stuckCount > 5) {
        console.log('⚡ Breaking through stuck point...');
        scrollEl.scrollTop = currentScroll + 5000;
        stuckCount = 0;
      }
      
      // Aggressive scrolling
      const scrollStep = Math.min(3000, maxScroll * 0.1);
      scrollEl.scrollTop = Math.min(currentScroll + scrollStep, maxScroll);
      
      // Quick wait
      await new Promise(r => setTimeout(r, 300));
      
      // Progress indicator
      if (currentCount % 50 === 0 && currentCount > 0) {
        console.log(`📊 Milestone: ${currentCount} text blocks captured`);
      }
    }
    
    // Final capture
    console.log('🔍 Final sweep...');
    await new Promise(r => setTimeout(r, 500));
    captureVisibleBlocks();
  }
  
  // Format output
  function formatOutput(entries, stats, format) {
    const timestamp = new Date().toISOString();
    const url = window.location.href;
    const title = document.title;
    
    if (format === 'json') {
      return JSON.stringify({
        timestamp,
        url,
        title,
        stats,
        blocks: entries,
        method: 'universal-turbo-scraper'
      }, null, 2);
    } else if (format === 'txt') {
      let output = `UNIVERSAL PAGE CAPTURE\n`;
      output += `${'='.repeat(50)}\n\n`;
      output += `URL: ${url}\n`;
      output += `Title: ${title}\n`;
      output += `Captured: ${timestamp}\n`;
      output += `Total Blocks: ${stats.total}\n`;
      output += `Total Characters: ${stats.totalChars}\n\n`;
      output += `${'='.repeat(50)}\n\n`;
      
      entries.forEach((entry, i) => {
        output += `[BLOCK ${entry.order + 1}] (${entry.type}, ${entry.length} chars)\n`;
        output += `${'-'.repeat(30)}\n`;
        output += `${entry.text}\n\n`;
        
        if (i < entries.length - 1) {
          output += `\n`;
        }
      });
      
      return output;
    } else {
      // Markdown
      let output = `# Universal Page Capture\n\n`;
      output += `**URL:** ${url}\n`;
      output += `**Title:** ${title}\n`;
      output += `**Captured:** ${timestamp}\n`;
      output += `**Total Blocks:** ${stats.total}\n`;
      output += `**Total Characters:** ${stats.totalChars.toLocaleString()}\n\n`;
      output += `---\n\n`;
      
      // Group by type
      const codeBlocks = entries.filter(e => e.type === 'CODE');
      const longTexts = entries.filter(e => e.type === 'LONG_TEXT');
      const quotes = entries.filter(e => e.type === 'QUOTE');
      const regular = entries.filter(e => !['CODE', 'LONG_TEXT', 'QUOTE'].includes(e.type));
      
      if (longTexts.length > 0) {
        output += `## Main Content\n\n`;
        longTexts.forEach(entry => {
          output += `${entry.text}\n\n---\n\n`;
        });
      }
      
      if (regular.length > 0) {
        output += `## Text Blocks\n\n`;
        regular.forEach(entry => {
          output += `${entry.text}\n\n`;
        });
      }
      
      if (codeBlocks.length > 0) {
        output += `## Code Blocks\n\n`;
        codeBlocks.forEach(entry => {
          output += `\`\`\`\n${entry.text}\n\`\`\`\n\n`;
        });
      }
      
      if (quotes.length > 0) {
        output += `## Quotes\n\n`;
        quotes.forEach(entry => {
          output += `> ${entry.text.split('\n').join('\n> ')}\n\n`;
        });
      }
      
      return output;
    }
  }
  
  // Safe download
  async function safeDownload(content, filename, mimeType) {
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
  
  // Main execution
  try {
    console.log('🌍 Starting UNIVERSAL capture...');
    const startTime = Date.now();
    
    await universalTurboScroll();
    
    const entries = Array.from(capturedBlocks.values());
    entries.sort((a, b) => a.order - b.order);
    
    const stats = {
      total: entries.length,
      totalChars: entries.reduce((sum, e) => sum + e.length, 0),
      types: {
        code: entries.filter(e => e.type === 'CODE').length,
        longText: entries.filter(e => e.type === 'LONG_TEXT').length,
        quotes: entries.filter(e => e.type === 'QUOTE').length,
        regular: entries.filter(e => e.type === 'TEXT').length,
        extracted: entries.filter(e => e.type === 'EXTRACTED').length
      }
    };
    
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✅ Universal capture complete in ${elapsed} seconds!`);
    console.log('📊 Statistics:', stats);
    
    // Format output
    const output = formatOutput(entries, stats, format);
    
    // File details
    let extension = format === 'json' ? 'json' : (format === 'md' ? 'md' : 'txt');
    let mimeType = format === 'json' ? 'application/json' : 
                   (format === 'md' ? 'text/markdown' : 'text/plain');
    
    const date = new Date().toISOString().split('T')[0];
    const hostname = window.location.hostname.replace(/\./g, '-');
    const filename = `universal-capture-${hostname}-${date}.${extension}`;
    
    // Download
    const downloadSuccess = await safeDownload(output, filename, mimeType);
    
    if (downloadSuccess) {
      console.log(`📄 Downloaded: ${filename}`);
      console.log(`📏 Size: ${(output.length / 1024).toFixed(1)} KB`);
    }
    
    // Try clipboard for smaller captures
    if (output.length < 500000) {
      try {
        await navigator.clipboard.writeText(output);
        console.log('📋 Also copied to clipboard!');
      } catch (e) {
        console.log('📋 Content too large for clipboard');
      }
    }
    
    // Debug info
    window.universalCaptureData = {
      entries,
      stats,
      output,
      format,
      elapsed
    };
    
    console.log('\n💡 Debug: window.universalCaptureData');
    console.log(`⚡ Blocks per second: ${(stats.total / elapsed).toFixed(1)}`);
    
    return {
      stats,
      output,
      format,
      success: true,
      elapsed
    };
    
  } catch (error) {
    console.error('❌ Universal Error:', error);
    console.error(error.stack);
    return {
      error: error.message,
      success: false
    };
  }
})();