// Claude Dropdown Menu Debug Script - Auto-run version
// Automatically runs all tests and saves output as markdown

(function() {
    'use strict';
    
    console.log('🔍 Claude Dropdown Debug - Auto Mode\n');
    
    // Capture all console output
    const output = [];
    const originalLog = console.log;
    console.log = function(...args) {
        output.push(args.join(' '));
        originalLog.apply(console, args);
    };
    
    // Test clicking dropdown and finding menu
    window.dropdownTest = {
        
        clickDropdown: async function() {
            console.log('Clicking dropdown button...');
            
            // Click the dropdown button
            const dropdownXPath = '/html/body/div[4]/div[2]/div/div[3]/div/div[2]/div/div/div[1]/div[2]/div/button[2]';
            const dropdownButton = document.evaluate(dropdownXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            
            if (!dropdownButton) {
                console.log('❌ Dropdown button not found');
                return;
            }
            
            console.log('✅ Found dropdown button');
            console.log('Button classes:', dropdownButton.className);
            console.log('Has SVG:', !!dropdownButton.querySelector('svg'));
            
            dropdownButton.click();
            console.log('Clicked dropdown');
            
            // Wait a bit for menu to appear
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Now look for the menu
            console.log('\n=== SEARCHING FOR MENU ===');
            
            // Method 1: Check div[6]
            const div6XPath = '/html/body/div[6]';
            const div6 = document.evaluate(div6XPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            
            if (div6) {
                console.log('Found div[6]!');
                console.log('Classes:', div6.className);
                console.log('Children:', div6.children.length);
                
                // Look for links
                const links = div6.querySelectorAll('a');
                console.log(`\nFound ${links.length} links in div[6]:`);
                links.forEach((link, i) => {
                    console.log(`  ${i}: "${link.textContent.trim()}"`);
                    console.log(`     href: ${link.getAttribute('href') || 'none'}`);
                    console.log(`     download: ${link.getAttribute('download') || 'none'}`);
                });
                
                // Check for specific radix element
                const radixElement = document.getElementById('radix-_r_ok_');
                if (radixElement) {
                    console.log('\nFound radix element!');
                    const radixLinks = radixElement.querySelectorAll('a');
                    console.log(`Radix links: ${radixLinks.length}`);
                }
            } else {
                console.log('No div[6] found');
            }
            
            // Method 2: Look for role="menu"
            const menus = document.querySelectorAll('[role="menu"]');
            console.log(`\nFound ${menus.length} elements with role="menu"`);
            menus.forEach((menu, i) => {
                console.log(`\nMenu ${i}:`);
                const menuLinks = menu.querySelectorAll('a');
                console.log(`  Links: ${menuLinks.length}`);
                menuLinks.forEach((link, j) => {
                    console.log(`    ${j}: "${link.textContent.trim()}"`);
                });
            });
            
            // Method 3: Look for any new elements
            const allDivs = document.querySelectorAll('body > div');
            console.log(`\n\nTotal top-level divs: ${allDivs.length}`);
            
            // Look at the last few divs (likely popups)
            for (let i = Math.max(0, allDivs.length - 3); i < allDivs.length; i++) {
                const div = allDivs[i];
                console.log(`\nDiv[${i + 1}]:`);
                console.log('  Classes:', div.className || 'none');
                console.log('  ID:', div.id || 'none');
                
                // Check for links
                const links = div.querySelectorAll('a');
                if (links.length > 0) {
                    console.log(`  Contains ${links.length} links:`);
                    links.forEach(link => {
                        console.log(`    - "${link.textContent.trim()}"`);
                    });
                }
            }
        },
        
        findDownloadLink: function() {
            // After dropdown is open, search everywhere for download links
            console.log('\n=== SEARCHING FOR DOWNLOAD LINKS ===');
            
            const allLinks = document.querySelectorAll('a');
            const downloadLinks = [];
            
            allLinks.forEach(link => {
                const text = link.textContent || '';
                const href = link.getAttribute('href') || '';
                const download = link.getAttribute('download') || '';
                
                // Check if this looks like a download link
                if (text.includes('.py') || text.includes('.js') || text.includes('.json') || 
                    text.includes('.html') || text.includes('.md') || text.includes('.tsx') ||
                    text.includes('Download') || download) {
                    
                    downloadLinks.push({
                        text: text.trim(),
                        href: href,
                        download: download,
                        element: link
                    });
                }
            });
            
            console.log(`Found ${downloadLinks.length} potential download links:`);
            downloadLinks.forEach((link, i) => {
                console.log(`\n${i}: "${link.text}"`);
                console.log(`   href: ${link.href}`);
                console.log(`   download: ${link.download}`);
                
                // Get parent structure
                let parent = link.element.parentElement;
                const parents = [];
                for (let j = 0; j < 3 && parent; j++) {
                    parents.push(parent.tagName + (parent.className ? '.' + parent.className : ''));
                    parent = parent.parentElement;
                }
                console.log(`   Parents: ${parents.join(' > ')}`);
            });
            
            return downloadLinks;
        },
        
        testFullSequence: async function() {
            console.log('=== FULL SEQUENCE TEST ===\n');
            
            // First click an artifact button
            const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
            if (artifactButtons.length === 0) {
                console.log('No artifact buttons found');
                return;
            }
            
            console.log(`Found ${artifactButtons.length} artifact buttons`);
            console.log('Clicking first artifact...');
            artifactButtons[0].click();
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Now click dropdown
            await this.clickDropdown();
            
            // Wait and find links
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const links = this.findDownloadLink();
            
            if (links.length > 0) {
                console.log('\n✅ SUCCESS! Found download links');
                console.log('First link element:', links[0].element);
            } else {
                console.log('\n❌ No download links found');
            }
        }
    };
    
    // Auto-run all tests
    async function runAllTests() {
        console.log('=== AUTO-RUNNING ALL TESTS ===\n');
        
        // Test 1: Full sequence
        console.log('\n### TEST 1: Full Sequence Test');
        await window.dropdownTest.testFullSequence();
        
        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test 2: Just dropdown click
        console.log('\n\n### TEST 2: Dropdown Click Only');
        await window.dropdownTest.clickDropdown();
        
        // Test 3: Find download links
        console.log('\n\n### TEST 3: Download Link Search');
        window.dropdownTest.findDownloadLink();
        
        // Generate markdown report
        console.log('\n\n=== GENERATING REPORT ===');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const markdown = [
            '# Claude Dropdown Debug Report',
            '',
            `**Generated:** ${new Date().toLocaleString()}`,
            `**URL:** ${window.location.href}`,
            '',
            '## Test Output',
            '',
            '```',
            ...output,
            '```',
            '',
            '## Summary',
            '',
            `- Total artifact buttons found: ${document.querySelectorAll('button[aria-label="Preview contents"]').length}`,
            `- Dropdown button exists: ${!!document.evaluate('/html/body/div[4]/div[2]/div/div[3]/div/div[2]/div/div/div[1]/div[2]/div/button[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue}`,
            `- Menu divs found: ${document.querySelectorAll('div[role="menu"]').length}`,
            '',
            '## Next Steps',
            '',
            '1. Check if dropdown menu appears in a different DOM location',
            '2. Verify the XPath for menu items is correct',
            '3. Test with different artifact types',
            ''
        ].join('\n');
        
        // Download the report
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `claude-dropdown-debug-${timestamp}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Restore console.log
        console.log = originalLog;
        console.log('\n✅ Debug report saved!');
    }
    
    // Start tests automatically
    console.log('Starting automated tests in 2 seconds...');
    setTimeout(runAllTests, 2000);
    
})();