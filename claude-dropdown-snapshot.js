// Claude Dropdown DOM Snapshot
// Shows exactly where dropdown content appears

(function() {
    console.log('📸 DOM Snapshot Tool\n');
    
    // Take snapshot of current DOM
    window.takeSnapshot = function() {
        const snapshot = {
            bodyDivCount: document.querySelectorAll('body > div').length,
            radixElements: [],
            dropdownMenus: [],
            downloadLinks: []
        };
        
        // Get all radix elements
        document.querySelectorAll('[id^="radix-"]').forEach(elem => {
            if (elem.querySelector('a')) {
                snapshot.radixElements.push({
                    id: elem.id,
                    links: Array.from(elem.querySelectorAll('a')).map(a => ({
                        text: a.textContent.trim(),
                        href: a.href,
                        download: a.getAttribute('download')
                    }))
                });
            }
        });
        
        // Check last body > div elements
        const bodyDivs = document.querySelectorAll('body > div');
        for (let i = Math.max(0, bodyDivs.length - 5); i < bodyDivs.length; i++) {
            const div = bodyDivs[i];
            const links = div.querySelectorAll('a');
            if (links.length > 0) {
                snapshot.dropdownMenus.push({
                    index: i + 1,
                    path: `body > div:nth-child(${i + 1})`,
                    links: Array.from(links).map(a => ({
                        text: a.textContent.trim(),
                        href: a.href?.substring(0, 50) + '...',
                        download: a.getAttribute('download')
                    }))
                });
            }
        }
        
        // Find all download links
        document.querySelectorAll('a[download], a[href*="blob:"]').forEach(link => {
            snapshot.downloadLinks.push({
                text: link.textContent.trim(),
                download: link.getAttribute('download'),
                parent: link.parentElement?.tagName,
                path: getPath(link)
            });
        });
        
        return snapshot;
    };
    
    function getPath(elem) {
        let path = [];
        let current = elem;
        while (current && current !== document.body) {
            const tag = current.tagName.toLowerCase();
            const id = current.id ? `#${current.id}` : '';
            path.unshift(tag + id);
            current = current.parentElement;
        }
        return 'body > ' + path.join(' > ');
    }
    
    // Compare snapshots
    window.compareSnapshots = function(before, after) {
        console.log('\n🔄 DOM Changes:');
        console.log(`Body > div count: ${before.bodyDivCount} → ${after.bodyDivCount}`);
        
        if (after.dropdownMenus.length > before.dropdownMenus.length) {
            console.log('\n✅ New dropdown menus appeared:');
            after.dropdownMenus.forEach(menu => {
                console.log(`\n${menu.path}:`);
                menu.links.forEach(link => {
                    console.log(`  - "${link.text}" ${link.download ? `(download: ${link.download})` : ''}`);
                });
            });
        }
        
        if (after.downloadLinks.length > before.downloadLinks.length) {
            console.log('\n✅ New download links:');
            const newLinks = after.downloadLinks.slice(before.downloadLinks.length);
            newLinks.forEach(link => {
                console.log(`  "${link.text}" at ${link.path}`);
                window.lastDownloadLink = document.querySelector(`a[download="${link.download}"]`) || 
                                         document.querySelector(`a:contains("${link.text}")`);
            });
        }
    };
    
    console.log('Instructions:');
    console.log('1. Before clicking dropdown: let before = takeSnapshot()');
    console.log('2. Click the dropdown button');
    console.log('3. After dropdown opens: let after = takeSnapshot()');
    console.log('4. Compare: compareSnapshots(before, after)');
    console.log('\nThis will show exactly what changed in the DOM!');
    
})();