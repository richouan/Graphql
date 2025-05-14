// Binary rain animation script
document.addEventListener('DOMContentLoaded', function() {
  const background = document.getElementById('binary-background');
  if (!background) return; // Exit if no background element found
  
  const screenWidth = window.innerWidth;
  const columnWidth = 20; // Width of each column in pixels
  const columnCount = Math.min(50, Math.floor(screenWidth / columnWidth)); // Cap at 50 columns max
  
  // OPTIMIZATION: Use requestAnimationFrame for animations instead of setInterval
  let animationFrameId;
  const columns = [];
  
  // Create binary columns
  for (let i = 0; i < columnCount; i++) {
    const spacing = screenWidth / columnCount;
    createBinaryColumn(background, i * spacing);
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
    // Create content with DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < digitCount; i++) {
      const digit = document.createElement('span');
      digit.className = 'binary-digit';
      digit.textContent = Math.random() > 0.5 ? '1' : '0';
      fragment.appendChild(digit);
    }
    
    column.appendChild(fragment);
    container.appendChild(column);
    
    // Store column reference and its data for efficient updates
    columns.push({
      element: column,
      digits: Array.from(column.querySelectorAll('.binary-digit')),
      nextUpdate: Date.now() + 1000 + Math.random() * 2000,
      highlightIndex: null,
      highlightTimer: null
    });
    
    // Remove and recreate column after animation finishes
    setTimeout(() => {
      column.remove();
      createBinaryColumn(container, xPosition);
    }, (delay + duration) * 1000);
  }
  
  // Batch update columns using requestAnimationFrame
  function updateColumns() {
    const now = Date.now();
    
    columns.forEach(col => {
      // Only update when needed, not every frame
      if (now > col.nextUpdate) {
        // Randomly change some digits
        if (Math.random() > 0.7) {
          const randomDigit = col.digits[Math.floor(Math.random() * col.digits.length)];
          if (randomDigit) {
            randomDigit.textContent = Math.random() > 0.5 ? '1' : '0';
          }
        }
        
        // Randomly highlight a digit
        if (Math.random() > 0.9) {
          // Clear previous highlight if any
          if (col.highlightIndex !== null && col.digits[col.highlightIndex]) {
            col.digits[col.highlightIndex].classList.remove('highlight');
          }
          
          const newIndex = Math.floor(Math.random() * col.digits.length);
          if (col.digits[newIndex]) {
            col.digits[newIndex].classList.add('highlight');
            col.highlightIndex = newIndex;
            
            // Auto-remove highlight after some time
            clearTimeout(col.highlightTimer);
            col.highlightTimer = setTimeout(() => {
              if (col.digits[newIndex]) {
                col.digits[newIndex].classList.remove('highlight');
              }
              col.highlightIndex = null;
            }, 800);
          }
        }
        
        // Schedule next update with varying intervals
        col.nextUpdate = now + 500 + Math.random() * 1500;
      }
    });
    
    // Continue the animation loop
    animationFrameId = requestAnimationFrame(updateColumns);
  }
  
  // Start the update loop
  updateColumns();
  
  // Pause animations when tab is not visible to save resources
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      cancelAnimationFrame(animationFrameId);
    } else {
      animationFrameId = requestAnimationFrame(updateColumns);
    }
  });
  
  // Handle window resizing efficiently
  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Clean up old columns
      cancelAnimationFrame(animationFrameId);
      columns.length = 0;
      background.innerHTML = '';
      
      // Create new columns based on new screen size
      const newScreenWidth = window.innerWidth;
      const newColumnCount = Math.min(50, Math.floor(newScreenWidth / columnWidth));
      
      for (let i = 0; i < newColumnCount; i++) {
        const spacing = newScreenWidth / newColumnCount;
        createBinaryColumn(background, i * spacing);
      }
      
      // Restart animation loop
      animationFrameId = requestAnimationFrame(updateColumns);
    }, 200);
  });
});