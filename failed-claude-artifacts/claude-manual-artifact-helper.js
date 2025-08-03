// Claude Manual Artifact Helper
// This script helps you manually download artifacts by preparing the UI

(function() {
    'use strict';
    
    console.log('🔧 Claude Manual Artifact Helper\n');
    
    // Find all artifact buttons
    const artifactButtons = document.querySelectorAll('button[aria-label="Preview contents"]');
    console.log(`Found ${artifactButtons.length} artifacts\n`);
    
    if (artifactButtons.length === 0) {
        console.log('No artifacts found in this conversation');
        return;
    }
    
    // Instructions
    console.log('📋 INSTRUCTIONS:');
    console.log('1. This script will click each artifact button to open it');
    console.log('2. YOU need to manually click the dropdown arrow');
    console.log('3. Then click "Download as [filetype]"');
    console.log('4. Press Enter to continue to the next artifact\n');
    
    let currentIndex = 0;
    
    async function processNext() {
        if (currentIndex >= artifactButtons.length) {
            console.log('\n✅ All artifacts processed!');
            return;
        }
        
        console.log(`\n🎯 Artifact ${currentIndex + 1}/${artifactButtons.length}`);
        console.log('Opening artifact...');
        
        // Click the artifact button
        artifactButtons[currentIndex].click();
        
        // Wait for panel to open
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Find the panel
        const panel = document.querySelector('[class*="basis-0"]') || 
                     document.evaluate('/html/body/div[4]/div[2]/div/div[3]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        
        if (panel) {
            // Highlight the dropdown button
            const buttons = panel.querySelectorAll('button[id^="radix-"]');
            for (const btn of buttons) {
                const svg = btn.querySelector('svg');
                if (svg) {
                    const path = svg.querySelector('path');
                    if (path && path.getAttribute('d') && path.getAttribute('d').includes('M14.128 7.16482')) {
                        // Add a red border to highlight it
                        btn.style.border = '3px solid red';
                        btn.style.boxShadow = '0 0 10px red';
                        console.log('⬆️ Click the RED BORDERED dropdown button above');
                        console.log('Then click "Download as..." from the menu');
                        break;
                    }
                }
            }
        }
        
        console.log('\nPress Enter when done downloading this artifact...');
    }
    
    // Listen for Enter key
    function handleKeyPress(e) {
        if (e.key === 'Enter') {
            // Remove highlight from current button
            const highlighted = document.querySelector('button[style*="border: 3px solid red"]');
            if (highlighted) {
                highlighted.style.border = '';
                highlighted.style.boxShadow = '';
            }
            
            // Close current panel
            const closeButton = document.querySelector('button[aria-label="Close"]');
            if (closeButton) {
                closeButton.click();
            }
            
            currentIndex++;
            setTimeout(processNext, 500);
        }
    }
    
    document.addEventListener('keypress', handleKeyPress);
    
    // Start processing
    processNext();
    
    // Cleanup function
    window.cleanupArtifactHelper = () => {
        document.removeEventListener('keypress', handleKeyPress);
        console.log('Helper cleaned up');
    };
    
})();