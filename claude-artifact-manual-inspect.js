// Claude Artifact Manual DOM Inspector
// Paste this in the console while on a Claude conversation with artifacts

(function() {
    'use strict';
    
    console.log('🔍 Claude Artifact DOM Inspector - Manual Mode');
    console.log('=' * 60);
    
    // Step 1: Find artifact buttons
    const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
    console.log(`\n📦 Found ${artifactButtons.length} artifact buttons`);
    
    if (artifactButtons.length === 0) {
        console.log('❌ No artifacts found. Navigate to a conversation with artifacts.');
        return;
    }
    
    // Function to inspect DOM changes
    window.inspectArtifact = async function(index = 0) {
        if (index >= artifactButtons.length) {
            console.log(`❌ No artifact at index ${index}`);
            return;
        }
        
        console.log(`\n🎯 Inspecting artifact ${index + 1}/${artifactButtons.length}`);
        
        // Record initial state
        const initialBodyDivCount = document.querySelectorAll('body > div').length;
        console.log(`Initial body > div count: ${initialBodyDivCount}`);
        
        // Click artifact
        artifactButtons[index].click();
        console.log('✅ Clicked artifact button');
        
        // Wait for panel
        await new Promise(r => setTimeout(r, 1500));
        
        // Find panel
        const panels = document.querySelectorAll('[class*="basis-0"]') || 
                       document.querySelectorAll('/html/body/div[4]/div[2]/div/div[3]');
        
        if (panels.length > 0) {
            const panel = panels[0];
            console.log('✅ Found artifact panel');
            
            // List all buttons
            const buttons = panel.querySelectorAll('button');
            console.log(`\nButtons in panel (${buttons.length} total):`);
            
            buttons.forEach((btn, i) => {
                const id = btn.id || 'no-id';
                const text = btn.textContent.trim() || 'no-text';
                const aria = btn.getAttribute('aria-label') || 'no-aria';
                const hasSvg = btn.querySelector('svg') ? 'YES' : 'NO';
                
                console.log(`  [${i}] id="${id}", text="${text}", aria="${aria}", svg=${hasSvg}`);
            });
            
            // Store panel reference
            window.currentPanel = panel;
            console.log('\n💡 Panel stored in window.currentPanel');
            console.log('💡 Call window.clickDropdown(buttonIndex) to test dropdown');
        } else {
            console.log('❌ Panel not found');
        }
    };
    
    // Function to click dropdown and observe
    window.clickDropdown = async function(btnIndex) {
        if (!window.currentPanel) {
            console.log('❌ No panel loaded. Run inspectArtifact() first');
            return;
        }
        
        const buttons = window.currentPanel.querySelectorAll('button');
        if (btnIndex >= buttons.length) {
            console.log(`❌ No button at index ${btnIndex}`);
            return;
        }
        
        console.log(`\n🔽 Clicking button ${btnIndex}: "${buttons[btnIndex].textContent.trim()}"`);
        
        // Record DOM state before click
        const beforeBodyDivs = document.querySelectorAll('body > div').length;
        const beforeRadixElements = document.querySelectorAll('[id^="radix-"]').length;
        
        // Click
        buttons[btnIndex].click();
        console.log('✅ Clicked');
        
        // Wait and observe
        await new Promise(r => setTimeout(r, 500));
        
        // Check DOM changes
        const afterBodyDivs = document.querySelectorAll('body > div').length;
        const afterRadixElements = document.querySelectorAll('[id^="radix-"]').length;
        
        console.log(`\nDOM Changes:`);
        console.log(`  body > div: ${beforeBodyDivs} → ${afterBodyDivs}`);
        console.log(`  radix elements: ${beforeRadixElements} → ${afterRadixElements}`);
        
        // Look for new elements
        if (afterBodyDivs > beforeBodyDivs) {
            console.log('\n🆕 New body > div elements appeared!');
            
            // Check last few divs
            const bodyDivs = document.querySelectorAll('body > div');
            for (let i = bodyDivs.length - 5; i < bodyDivs.length; i++) {
                if (i >= 0) {
                    const div = bodyDivs[i];
                    const links = div.querySelectorAll('a');
                    
                    if (links.length > 0) {
                        console.log(`\n✅ Found links in body > div[${i + 1}]:`);
                        links.forEach(link => {
                            const text = link.textContent.trim();
                            const href = link.href || '';
                            const download = link.getAttribute('download') || '';
                            
                            console.log(`  - "${text}"`);
                            console.log(`    href: ${href.substring(0, 50)}...`);
                            if (download) console.log(`    download: "${download}"`);
                            
                            // Store reference
                            window.lastDownloadLink = link;
                        });
                    }
                }
            }
        }
        
        // Check for radix content
        const radixMenus = document.querySelectorAll('[id^="radix-"][id*="content"]');
        if (radixMenus.length > 0) {
            console.log(`\n🔍 Found ${radixMenus.length} radix menu elements`);
            radixMenus.forEach(menu => {
                const links = menu.querySelectorAll('a');
                if (links.length > 0) {
                    console.log(`  ${menu.id} has ${links.length} links`);
                }
            });
        }
        
        console.log('\n💡 If download link found, it\'s stored in window.lastDownloadLink');
    };
    
    // Function to close panel
    window.closePanel = function() {
        const closeBtn = document.querySelector('button[aria-label="Close"]');
        if (closeBtn) {
            closeBtn.click();
            console.log('✅ Panel closed');
        } else {
            document.body.click();
            console.log('✅ Clicked body to close');
        }
        window.currentPanel = null;
    };
    
    // Instructions
    console.log('\n📚 Instructions:');
    console.log('1. Run: inspectArtifact(0) to open first artifact');
    console.log('2. Run: clickDropdown(1) to click second button (usually dropdown)');
    console.log('3. Run: closePanel() to close the artifact panel');
    console.log('\n💡 Check window.lastDownloadLink if a download link was found');
    
})();