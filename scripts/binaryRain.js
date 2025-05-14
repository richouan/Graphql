    document.addEventListener('DOMContentLoaded', function() {
      const background = document.getElementById('binary-background');
      const screenWidth = window.innerWidth;
      const columnWidth = 20; 
      const columnCount = Math.floor(screenWidth / columnWidth); 
      
      for (let i = 0; i < columnCount; i++) {
        createBinaryColumn(background, i * columnWidth);
      }
      
      function createBinaryColumn(container, xPosition) {
        const column = document.createElement('div');
        column.className = 'binary-column';
        column.style.left = `${xPosition}px`;
        
        const startPosition = -Math.floor(Math.random() * 500);
        column.style.top = `${startPosition}px`;
        
        const duration = 10 + Math.random() * 10;
        column.style.animationDuration = `${duration}s`;
        
        const delay = Math.random() * 8;
        column.style.animationDelay = `${delay}s`;
        
        const opacity = 0.1 + Math.random() * 0.5;
        column.style.opacity = opacity;
        
        const digitCount = 20 + Math.floor(Math.random() * 15);
        for (let i = 0; i < digitCount; i++) {
          const digit = document.createElement('span');
          digit.className = 'binary-digit';
          digit.textContent = Math.random() > 0.5 ? '1' : '0';
          column.appendChild(digit);
        }
        
        container.appendChild(column);
        
        setTimeout(() => {
          column.remove();
          createBinaryColumn(container, xPosition);
        }, (delay + duration) * 1000);
        
        setInterval(() => {
          const digits = column.querySelectorAll('.binary-digit');
          if (digits.length > 0) {
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