
    // Add password toggle functionality
    document.addEventListener('DOMContentLoaded', function() {
      const passwordToggle = document.getElementById('password-toggle');
      const passwordInput = document.getElementById('password');
      
      if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', function() {
          // Toggle the password field type
          const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
          passwordInput.setAttribute('type', type);
          
          // Change the icon based on the password visibility
          const icon = passwordToggle.querySelector('.password-toggle-icon');
          if (type === 'password') {
            icon.textContent = '👁️';
          } else {
            icon.textContent = '👁️‍🗨️';
          }
        });
      }
    });

    // Check if user is already logged in and redirect to profile page if so
    document.addEventListener('DOMContentLoaded', function() {
      // Check if there's a JWT token stored
      const token = localStorage.getItem('jwt');
      
      if (token) {
        // Verify the token by making a simple GraphQL request
        fetch('https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            query: `{ user { id } }`
          })
        })
        .then(response => response.json())
        .then(result => {
          // If we get valid user data back (no errors), the token is valid
          if (result.data && result.data.user && !result.errors) {
            // Redirect to profile page
            window.location.href = 'index.html';
          } else {
            // Token is invalid - remove it
            localStorage.removeItem('jwt');
          }
        })
        .catch(error => {
          console.error('Error verifying token:', error);
          // If there's an error, clear the token
          localStorage.removeItem('jwt');
        });
      }
    });