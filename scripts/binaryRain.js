 // Generate Matrix-style digital rain effect
    document.addEventListener('DOMContentLoaded', function() {
      const background = document.getElementById('binary-background');
      const screenWidth = window.innerWidth;
      const columnWidth = 20; // Width of each column in pixels
      const columnCount = Math.floor(screenWidth / columnWidth); // Number of columns based on screen width
      
      // Create binary columns
      for (let i = 0; i < columnCount; i++) {
        createBinaryColumn(background, i * columnWidth);
      }
      
      function createBinaryColumn(container, xPosition) {
        const column = document.createElement('div');
        column.className = 'binary-column';
        column.style.left = `${xPosition}px`;
        
        // Random starting position (stagger effect)
        const startPosition = -Math.floor(Math.random() * 500);
        column.style.top = `${startPosition}px`;
        
        // Random animation duration between 10-20 seconds
        const duration = 10 + Math.random() * 10;
        column.style.animationDuration = `${duration}s`;
        
        // Random delay before starting animation
        const delay = Math.random() * 8;
        column.style.animationDelay = `${delay}s`;
        
        // Random opacity
        const opacity = 0.1 + Math.random() * 0.5;
        column.style.opacity = opacity;
        
        // Create the binary digits in the column (vertically)
        const digitCount = 20 + Math.floor(Math.random() * 15);
        for (let i = 0; i < digitCount; i++) {
          const digit = document.createElement('span');
          digit.className = 'binary-digit';
          digit.textContent = Math.random() > 0.5 ? '1' : '0';
          column.appendChild(digit);
        }
        
        container.appendChild(column);
        
        // Remove and recreate column after animation finishes
        setTimeout(() => {
          column.remove();
          createBinaryColumn(container, xPosition);
        }, (delay + duration) * 1000);
        
        // Randomly change digits and add highlight effects
        setInterval(() => {
          const digits = column.querySelectorAll('.binary-digit');
          if (digits.length > 0) {
            // Randomly change some digits
            digits.forEach(digit => {
              if (Math.random() > 0.95) {
                digit.textContent = Math.random() > 0.5 ? '1' : '0';
              }
            });
            
            // Randomly highlight a digit
            if (Math.random() > 0.7) {
              const randomIndex = Math.floor(Math.random() * digits.length);
              const digit = digits[randomIndex];
              digit.classList.add('highlight');
              
              setTimeout(() => {
                digit.classList.remove('highlight');
              }, 800);
            }
          }
        }, 200);
      }
    });