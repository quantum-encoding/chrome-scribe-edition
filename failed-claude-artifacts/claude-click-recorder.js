// Claude Click Recorder - Records your manual artifact download process
(function() {
    'use strict';
    
    console.log('🔴 RECORDING CLICKS - Claude Click Recorder\n');
    console.log('This script will record every click you make');
    console.log('Please manually download an artifact so we can see what elements are clicked\n');
    
    let clickCount = 0;
    const clickLog = [];
    
    // Add click listener to entire document
    document.addEventListener('click', function(e) {
        clickCount++;
        const target = e.target;
        
        // Get element details
        const elementInfo = {
            clickNumber: clickCount,
            tagName: target.tagName,
            id: target.id || 'no-id',
            className: target.className || 'no-class',
            text: target.textContent?.trim().substring(0, 50) || '',
            href: target.getAttribute('href') || '',
            download: target.getAttribute('download') || '',
            ariaLabel: target.getAttribute('aria-label') || '',
            // Get full selector path
            selector: getSelector(target),
            // Get parent info
            parent: {
                tagName: target.parentElement?.tagName || '',
                id: target.parentElement?.id || '',
                className: target.parentElement?.className || ''
            }
        };
        
        // Special handling for SVG elements
        if (target.tagName === 'svg' || target.tagName === 'path') {
            elementInfo.svgPath = target.getAttribute('d') || '';
            // Check parent button
            const parentButton = target.closest('button');
            if (parentButton) {
                elementInfo.parentButton = {
                    id: parentButton.id,
                    className: parentButton.className,
                    ariaLabel: parentButton.getAttribute('aria-label') || ''
                };
            }
        }
        
        clickLog.push(elementInfo);
        
        // Log to console
        console.log(`\n🖱️ CLICK #${clickCount}:`);
        console.log(`Element: ${elementInfo.tagName}${elementInfo.id ? '#' + elementInfo.id : ''}`);
        console.log(`Text: "${elementInfo.text}"`);
        if (elementInfo.href) console.log(`href: ${elementInfo.href}`);
        if (elementInfo.download) console.log(`download: ${elementInfo.download}`);
        console.log(`Selector: ${elementInfo.selector}`);
        
        // Highlight what was clicked
        target.style.outline = '3px solid red';
        setTimeout(() => {
            target.style.outline = '';
        }, 1000);
        
    }, true); // Use capture phase to catch all clicks
    
    // Function to generate a unique selector
    function getSelector(element) {
        if (element.id) {
            return `#${element.id}`;
        }
        
        let path = [];
        while (element && element.nodeType === Node.ELEMENT_NODE) {
            let selector = element.tagName.toLowerCase();
            
            if (element.className && typeof element.className === 'string') {
                const classes = element.className.trim().split(/\s+/).slice(0, 2);
                if (classes.length > 0 && classes[0]) {
                    selector += '.' + classes.join('.');
                }
            }
            
            // Add position among siblings if needed
            let sibling = element;
            let nth = 1;
            while (sibling.previousElementSibling) {
                sibling = sibling.previousElementSibling;
                if (sibling.tagName === element.tagName) nth++;
            }
            
            if (nth > 1 || element.nextElementSibling) {
                selector += `:nth-of-type(${nth})`;
            }
            
            path.unshift(selector);
            element = element.parentElement;
            
            // Stop at body or if we have enough
            if (path.length >= 4) break;
        }
        
        return path.join(' > ');
    }
    
    // Export function to get the log
    window.getClickLog = function() {
        console.log('\n📋 FULL CLICK LOG:');
        clickLog.forEach(click => {
            console.log(`\nClick #${click.clickNumber}:`);
            console.log(click);
        });
        return clickLog;
    };
    
    // Stop recording function
    window.stopRecording = function() {
        document.removeEventListener('click', arguments.callee);
        console.log('\n⏹️ RECORDING STOPPED');
        console.log('Type window.getClickLog() to see all recorded clicks');
    };
    
    console.log('\n✅ Recording started!');
    console.log('- Click on artifact preview button');
    console.log('- Click on dropdown arrow');  
    console.log('- Click on download option');
    console.log('\nType window.getClickLog() to see recorded clicks');
    console.log('Type window.stopRecording() to stop recording');
    
})();