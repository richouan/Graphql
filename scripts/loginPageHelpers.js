
    //  password toggle
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

    //  logged in redirect 
    document.addEventListener('DOMContentLoaded', function() {
      const token = localStorage.getItem('jwt');
      
      if (token) {
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
          if (result.data && result.data.user && !result.errors) {
            window.location.href = 'index.html';
          } else {
            localStorage.removeItem('jwt');
          }
        })
        .catch(error => {
          console.error('Error verifying token:', error);
          localStorage.removeItem('jwt');
        });
      }
    });