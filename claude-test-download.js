// Claude Test Download - Simple test after you open dropdown manually

(function() {
    console.log('🎯 Looking for download links...\n');
    
    // Method 1: Check last body > div elements
    const bodyDivs = document.querySelectorAll('body > div');
    console.log(`Checking ${bodyDivs.length} body > div elements...`);
    
    for (let i = Math.max(0, bodyDivs.length - 10); i < bodyDivs.length; i++) {
        const div = bodyDivs[i];
        const links = div.querySelectorAll('a');
        
        if (links.length > 0) {
            console.log(`\n✅ Found links in body > div[${i + 1}]:`);
            links.forEach((link, j) => {
                const text = link.textContent.trim();
                const href = link.href || '';
                const download = link.getAttribute('download') || '';
                
                console.log(`   [${j}] "${text}"`);
                if (download) console.log(`        download="${download}"`);
                if (href.includes('blob:')) console.log(`        blob URL!`);
                
                // Try to click it
                if (download || href.includes('blob:')) {
                    console.log(`\n🎯 Clicking download link: "${text}"`);
                    link.click();
                    return;
                }
            });
        }
    }
    
    // Method 2: Any download links
    const allDownloadLinks = document.querySelectorAll('a[download], a[href*="blob:"]');
    if (allDownloadLinks.length > 0) {
        console.log(`\n✅ Found ${allDownloadLinks.length} download links globally`);
        const link = allDownloadLinks[allDownloadLinks.length - 1]; // Get most recent
        console.log(`Clicking: "${link.textContent.trim()}"`);
        link.click();
        return;
    }
    
    console.log('\n❌ No download links found. Make sure dropdown is open!');
})();