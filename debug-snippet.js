// AI Chronicle Debug Snippet
// Copy and paste this into the Chrome DevTools Console on Google AI Studio

console.log('=== AI Chronicle DOM Analysis ===');

// Method 1: Find all potential message containers
const patterns = ['message', 'chat', 'turn', 'conversation', 'response', 'user', 'assistant', 'model', 'prompt'];
patterns.forEach(pattern => {
  const found = document.querySelectorAll(`[class*="${pattern}"]`);
  if (found.length > 0) {
    console.log(`\n[${pattern}] Found ${found.length} elements:`);
    found.forEach((el, i) => {
      if (i < 2) {
        console.log(`  Class: ${el.className}`);
        console.log(`  HTML: ${el.outerHTML.substring(0, 200)}...`);
      }
    });
  }
});

// Method 2: Look for custom elements
console.log('\n=== Custom Elements ===');
const allElements = document.querySelectorAll('*');
const customTags = new Set();
allElements.forEach(el => {
  if (el.tagName.includes('-')) {
    customTags.add(el.tagName.toLowerCase());
  }
});
console.log('Found:', Array.from(customTags));

// Method 3: Find elements with text content
console.log('\n=== Elements with substantial text ===');
document.querySelectorAll('*').forEach(el => {
  const text = el.innerText?.trim();
  if (text && text.length > 50 && text.length < 200 && el.children.length < 3) {
    console.log(`Tag: ${el.tagName}, Class: ${el.className}`);
    console.log(`Text: "${text.substring(0, 100)}..."`);
  }
});

// Method 4: Interactive element picker
console.log('\n=== INTERACTIVE MODE ===');
console.log('Run this to highlight potential message elements:');
console.log(`
document.querySelectorAll('*').forEach(el => {
  if (el.innerText && el.innerText.length > 20) {
    el.addEventListener('mouseover', function() {
      this.style.outline = '2px solid red';
    });
    el.addEventListener('mouseout', function() {
      this.style.outline = '';
    });
  }
});
`);

console.log('\n=== To inspect a specific element ===');
console.log('1. Right-click any message in the chat');
console.log('2. Select "Inspect"');
console.log('3. In Elements panel, right-click the element');
console.log('4. Select "Copy" > "Copy selector"');
console.log('5. Paste here to see what it is');