// Phone number obfuscation with multiple layers of protection
(function() {
    'use strict';
    
    // Layer 1: Split the number into multiple parts
    const parts = {
        a: '917',
        b: '750', 
        c: '9954'
    };
    
    // Layer 2: Simple encoding (not meant to be secure, just obfuscated)
    const decode = function(str) {
        return str.split('').reverse().join('');
    };
    
    // Layer 3: Store encoded parts in different variables
    const encoded = {
        x: '719',
        y: '057',
        z: '4595'
    };
    
    // Layer 4: Function to reconstruct the number
    const getNumber = function() {
        const part1 = decode(encoded.x);
        const part2 = decode(encoded.y);
        const part3 = decode(encoded.z);
        return part1 + '-' + part2 + '-' + part3;
    };
    
    // Layer 5: Additional obfuscation - store in a closure
    const phoneData = (function() {
        const data = {
            segments: [encoded.x, encoded.y, encoded.z],
            separator: '-',
            prefix: 'tel:'
        };
        return {
            get: function() {
                return data.prefix + getNumber().replace(/-/g, '');
            },
            display: function() {
                return getNumber();
            }
        };
    })();
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        const phoneLink = document.getElementById('phone-link');
        const phoneDisplay = document.getElementById('phone-display');
        
        if (!phoneLink || !phoneDisplay) return;
        
        // Only reveal on actual user interaction
        let revealed = false;
        
        phoneLink.addEventListener('click', function(e) {
            if (!revealed) {
                // First click: reveal the number
                e.preventDefault();
                phoneDisplay.textContent = phoneData.display();
                phoneLink.href = phoneData.get();
                revealed = true;
                
                // Change text to indicate it's now clickable
                setTimeout(() => {
                    phoneDisplay.textContent = phoneData.display();
                }, 100);
            } else {
                // Second click: allow the tel: link to work
                // Don't prevent default - let the browser handle the tel: link
                return true;
            }
        });
        
        // Hover effect for better UX
        phoneLink.addEventListener('mouseenter', function() {
            if (!revealed && phoneDisplay.textContent === 'Click to reveal') {
                phoneDisplay.textContent = 'Click to call';
            }
        });
        
        phoneLink.addEventListener('mouseleave', function() {
            if (!revealed && phoneDisplay.textContent === 'Click to call') {
                phoneDisplay.textContent = 'Click to reveal';
            }
        });
    });
})(); 