// Claude Dropdown DOM Observer
// Paste this in F12 console to watch what happens when dropdown is clicked

(function() {
    'use strict';
    
    console.log('👁️ Claude Dropdown Observer Active');
    console.log('This will watch for DOM changes when you click dropdown buttons\n');
    
    let observer = null;
    let mutations = [];
    
    // Start observing
    window.startObserver = function() {
        mutations = [];
        
        observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            mutations.push({
                                type: 'added',
                                element: node,
                                parent: mutation.target,
                                timestamp: Date.now()
                            });
                            
                            // Check if it has links
                            if (node.querySelector && node.querySelector('a')) {
                                console.log(`🆕 New element with links added: ${node.tagName}`);
                                if (node.id) console.log(`   ID: ${node.id}`);
                                
                                const links = node.querySelectorAll('a');
                                links.forEach(link => {
                                    console.log(`   📎 Link: "${link.textContent.trim()}"`);
                                    console.log(`      href: ${link.href}`);
                                    if (link.download) console.log(`      download: ${link.download}`);
                                });
                            }
                        }
                    });
                }
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('✅ Observer started. Click a dropdown to see what appears.');
    };
    
    // Stop observing
    window.stopObserver = function() {
        if (observer) {
            observer.disconnect();
            observer = null;
            console.log('⏹️ Observer stopped');
            
            // Summary
            console.log(`\n📊 Summary: ${mutations.length} elements added`);
            
            // Find elements with download links
            const elementsWithDownloads = mutations.filter(m => {
                const elem = m.element;
                if (!elem.querySelector) return false;
                const links = elem.querySelectorAll('a[download], a[href*="blob:"]');
                return links.length > 0;
            });
            
            if (elementsWithDownloads.length > 0) {
                console.log(`\n✅ Found ${elementsWithDownloads.length} elements with download links:`);
                elementsWithDownloads.forEach(m => {
                    const elem = m.element;
                    console.log(`\n   Element: ${elem.tagName}`);
                    console.log(`   Location: ${getElementPath(elem)}`);
                    
                    const links = elem.querySelectorAll('a[download], a[href*="blob:"]');
                    links.forEach(link => {
                        console.log(`   Download: "${link.textContent.trim()}" → ${link.download || 'blob'}`);
                        window.lastFoundDownloadLink = link;
                    });
                });
                
                console.log('\n💡 Last download link stored in window.lastFoundDownloadLink');
            }
        }
    };
    
    // Helper to get element path
    function getElementPath(elem) {
        const path = [];
        let current = elem;
        
        while (current && current !== document.body) {
            let selector = current.tagName.toLowerCase();
            if (current.id) {
                selector += `#${current.id}`;
            } else if (current.className) {
                selector += `.${current.className.split(' ')[0]}`;
            }
            
            // Add index if needed
            const parent = current.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children);
                const index = siblings.indexOf(current);
                if (siblings.filter(s => s.tagName === current.tagName).length > 1) {
                    selector += `:nth-child(${index + 1})`;
                }
            }
            
            path.unshift(selector);
            current = current.parentElement;
        }
        
        path.unshift('body');
        return path.join(' > ');
    }
    
    // Auto-start
    startObserver();
    
    console.log('\n📚 Instructions:');
    console.log('1. Click on an artifact to open panel');
    console.log('2. Click the dropdown button');
    console.log('3. Run: stopObserver() to see summary');
    console.log('4. Check window.lastFoundDownloadLink for the download link');
    
})();