// Claude Dropdown Debug V2 - Enhanced timing and detection
// Waits longer for menu to appear and searches more thoroughly

(function() {
    'use strict';
    
    console.log('🔍 Claude Dropdown Debug V2 - Enhanced\\n');
    
    // Capture console output
    const output = [];
    const originalLog = console.log;
    console.log = function(...args) {
        output.push(args.join(' '));
        originalLog.apply(console, args);
    };
    
    // Enhanced menu detection with multiple wait times
    async function findMenuWithRetries() {
        const waitTimes = [100, 300, 500, 1000, 2000];
        
        for (const waitTime of waitTimes) {
            console.log(`\\nWaiting ${waitTime}ms for menu...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            // Method 1: Check all top-level divs
            const allDivs = document.querySelectorAll('body > div');
            console.log(`Total top-level divs: ${allDivs.length}`);
            
            // Check last 5 divs (popups usually appear at the end)
            for (let i = Math.max(0, allDivs.length - 5); i < allDivs.length; i++) {
                const div = allDivs[i];
                const links = div.querySelectorAll('a');
                const buttons = div.querySelectorAll('button');
                
                if (links.length > 0 || buttons.length > 0) {
                    console.log(`\\nDiv[${i + 1}] (potential menu):`);
                    console.log('  ID:', div.id || 'none');
                    console.log('  Classes:', div.className || 'none');
                    console.log(`  Links: ${links.length}, Buttons: ${buttons.length}`);
                    
                    // Check if it has download-like content
                    const downloadLinks = Array.from(links).filter(link => {
                        const text = link.textContent || '';
                        return text.includes('.py') || text.includes('.js') || 
                               text.includes('.md') || text.includes('.html') ||
                               text.includes('Download') || text.includes('Save');
                    });
                    
                    if (downloadLinks.length > 0) {
                        console.log('  ✅ FOUND DOWNLOAD LINKS!');
                        downloadLinks.forEach((link, j) => {
                            console.log(`    ${j}: "${link.textContent.trim()}"`);
                            console.log(`       href: ${link.getAttribute('href') || 'none'}`);
                        });
                        return downloadLinks;
                    }
                }
            }
            
            // Method 2: Check for role="menu"
            const menus = document.querySelectorAll('[role="menu"]');
            if (menus.length > 0) {
                console.log(`\\nFound ${menus.length} role="menu" elements`);
                return menus;
            }
            
            // Method 3: Check for specific classes
            const popupClasses = ['dropdown', 'menu', 'popup', 'popover', 'tooltip'];
            for (const className of popupClasses) {
                const elements = document.querySelectorAll(`[class*="${className}"]`);
                if (elements.length > 0 && elements.length < 10) {
                    console.log(`\\nFound ${elements.length} elements with class containing "${className}"`);
                }
            }
        }
        
        return null;
    }
    
    // Test clicking dropdown with better timing
    async function testDropdownWithTiming() {
        console.log('\\n=== ENHANCED DROPDOWN TEST ===');
        
        // Find and click first artifact
        const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
        if (artifactButtons.length === 0) {
            console.log('No artifact buttons found');
            return;
        }
        
        console.log(`Found ${artifactButtons.length} artifact buttons`);
        artifactButtons[0].click();
        console.log('Clicked first artifact');
        
        // Wait for panel to open
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Find dropdown button
        const dropdownXPath = '/html/body/div[4]/div[2]/div/div[3]/div/div[2]/div/div/div[1]/div[2]/div/button[2]';
        const dropdownButton = document.evaluate(dropdownXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        
        if (!dropdownButton) {
            console.log('❌ Dropdown button not found');
            
            // Try alternative selectors
            const altButtons = document.querySelectorAll('button:has(svg)');
            console.log(`\\nSearching among ${altButtons.length} buttons with SVG...`);
            
            const candidates = Array.from(altButtons).filter(btn => {
                const parent = btn.parentElement;
                return parent && parent.querySelectorAll('button').length === 2;
            });
            
            if (candidates.length > 0) {
                console.log(`Found ${candidates.length} dropdown candidates`);
                candidates[0].click();
                console.log('Clicked alternative dropdown');
            }
            return;
        }
        
        console.log('✅ Found dropdown button');
        
        // Take snapshot before click
        const divCountBefore = document.querySelectorAll('body > div').length;
        console.log(`Divs before click: ${divCountBefore}`);
        
        // Click dropdown
        dropdownButton.click();
        console.log('Clicked dropdown');
        
        // Find menu with retries
        const result = await findMenuWithRetries();
        
        // Take snapshot after
        const divCountAfter = document.querySelectorAll('body > div').length;
        console.log(`\\nDivs after click: ${divCountAfter}`);
        console.log(`New divs created: ${divCountAfter - divCountBefore}`);
        
        return result;
    }
    
    // Main test runner
    async function runTests() {
        console.log('=== STARTING ENHANCED TESTS ===\\n');
        
        // Run the enhanced dropdown test
        const menuResult = await testDropdownWithTiming();
        
        if (!menuResult) {
            console.log('\\n❌ No menu found after all attempts');
            
            // Additional debugging
            console.log('\\n=== ADDITIONAL DEBUGGING ===');
            
            // Check if artifacts panel is even open
            const artifactPanel = document.evaluate('/html/body/div[4]/div[2]/div/div[3]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            console.log('Artifact panel exists:', !!artifactPanel);
            
            // List all interactive elements in the panel
            if (artifactPanel) {
                const interactives = artifactPanel.querySelectorAll('button, a, [role="menuitem"]');
                console.log(`\\nInteractive elements in panel: ${interactives.length}`);
                interactives.forEach((el, i) => {
                    if (i < 10) { // First 10 only
                        console.log(`  ${i}: <${el.tagName}> "${el.textContent.trim().substring(0, 30)}..."`);
                    }
                });
            }
        }
        
        // Generate report
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const markdown = [
            '# Claude Dropdown Debug Report V2',
            '',
            `**Generated:** ${new Date().toLocaleString()}`,
            `**URL:** ${window.location.href}`,
            '',
            '## Test Results',
            '',
            '```',
            ...output,
            '```',
            '',
            '## Analysis',
            '',
            menuResult ? '✅ Menu was found!' : '❌ Menu was not found',
            '',
            '## Recommendations',
            '',
            '1. The menu might be using a different rendering method (shadow DOM, iframe)',
            '2. The menu might require a different interaction pattern',
            '3. Try manually clicking the dropdown and inspecting with DevTools',
            ''
        ].join('\\n');
        
        // Save report
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `claude-dropdown-debug-v2-${timestamp}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Restore console
        console.log = originalLog;
        console.log('\\n✅ Enhanced debug report saved!');
    }
    
    // Start automatically
    console.log('Starting enhanced tests in 2 seconds...');
    setTimeout(runTests, 2000);
    
})();