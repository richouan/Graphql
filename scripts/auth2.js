document.getElementById('login-form').addEventListener('submit', async function(event) {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const credentials = btoa(`${username}:${password}`);
  
  const loginForm = document.querySelector('.login-form-container');
  const originalContent = loginForm.innerHTML;
  
  loginForm.innerHTML = `
    <div class="encryption-animation">
      <div class="encryption-header">
        <div class="encryption-status">Authenticating</div>
        <div class="encryption-progress">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
        </div>
      </div>
      <div class="encryption-terminal">
        <div class="terminal-line">Initializing secure connection...</div>
        <div class="terminal-line encrypting">Encrypting credentials...</div>
        <div class="terminal-line validating">Validating access token...</div>
        <div class="terminal-line fetching">Fetching user profile...</div>
        <div class="terminal-binary"></div>
      </div>
    </div>
  `;
  
  const progressFill = document.querySelector('.progress-fill');
  const terminalLines = document.querySelectorAll('.terminal-line');
  const terminalBinary = document.querySelector('.terminal-binary');
  
  progressFill.style.width = '0%';
  
  setTimeout(() => {
    progressFill.style.width = '30%';
    terminalLines[0].classList.add('active');
    generateBinaryText(terminalBinary);
    
    setTimeout(() => {
      progressFill.style.width = '60%';
      terminalLines[1].classList.add('active');
      
      try {
        fetch('https://zone01-auth-proxy.onrender.com/auth', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`
          }
        })
        .then(response => {
          const isSuccess = response.ok;
          return response.json().then(data => {
            return { data, isSuccess };
          });
        })
        .then(({ data, isSuccess }) => {
          if (isSuccess) {
            localStorage.setItem('jwt', data);
            
            progressFill.style.width = '80%';
            terminalLines[2].classList.add('active', 'success');
            
            setTimeout(() => {
              progressFill.style.width = '100%';
              terminalLines[3].classList.add('active', 'success');
              
              setTimeout(() => {
                window.location.href = 'index.html';
              }, 600);
            }, 400);
          } else {
            progressFill.style.width = '80%';
            terminalLines[2].classList.add('active', 'error');
            terminalLines[2].textContent = 'Access denied - Invalid credentials';
            
            setTimeout(() => {
              loginForm.innerHTML = originalContent;
              document.getElementById('error-message').textContent = 'Invalid credentials';
              
              const newForm = document.getElementById('login-form');
              if (newForm) {
                const newFormClone = newForm.cloneNode(true);
                newForm.parentNode.replaceChild(newFormClone, newForm);
                
                newFormClone.addEventListener('submit', arguments.callee);
                
                const passwordToggle = document.getElementById('password-toggle');
                const passwordInput = document.getElementById('password');
                
                if (passwordToggle && passwordInput) {
                  passwordToggle.addEventListener('click', function() {
                    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                    passwordInput.setAttribute('type', type);
                    
                    const icon = passwordToggle.querySelector('.password-toggle-icon');
                    if (type === 'password') {
                      icon.textContent = '👁️';
                    } else {
                      icon.textContent = '👁️‍🗨️';
                    }
                  });
                }
              }
            }, 1500);
          }
        })
        .catch(error => {
          console.error('Error during login:', error);
          progressFill.style.width = '70%';
          terminalLines[2].classList.add('active', 'error');
          terminalLines[2].textContent = 'Connection error';
          
          setTimeout(() => {
            loginForm.innerHTML = originalContent;
            document.getElementById('error-message').textContent = 'Error logging in';
            
            const newForm = document.getElementById('login-form');
            if (newForm) {
              const newFormClone = newForm.cloneNode(true);
              newForm.parentNode.replaceChild(newFormClone, newForm);
              
              newFormClone.addEventListener('submit', arguments.callee);
              
              const passwordToggle = document.getElementById('password-toggle');
              const passwordInput = document.getElementById('password');
              
              if (passwordToggle && passwordInput) {
                passwordToggle.addEventListener('click', function() {
                  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                  passwordInput.setAttribute('type', type);
                  
                  const icon = passwordToggle.querySelector('.password-toggle-icon');
                  if (type === 'password') {
                    icon.textContent = '👁️';
                  } else {
                    icon.textContent = '👁️‍🗨️';
                  }
                });
              }
            }
          }, 1500);
        });
      } catch (error) {
        console.error('Error during login:', error);
        document.getElementById('error-message').textContent = 'Error logging in';
      }
    }, 600);
  }, 300);
});

function generateBinaryText(element) {
  if (!element) return;
  
  let binaryText = '';
  const length = 80; // Number of 0s and 1s
  
  for (let i = 0; i < length; i++) {
    binaryText += Math.random() > 0.5 ? '1' : '0';
    if (i % 8 === 7) binaryText += ' ';
  }
  
  element.textContent = binaryText;
  
  const interval = setInterval(() => {
    binaryText = '';
    for (let i = 0; i < length; i++) {
      binaryText += Math.random() > 0.5 ? '1' : '0';
      if (i % 8 === 7) binaryText += ' ';
    }
    element.textContent = binaryText;
  }, 300);
  
  setTimeout(() => clearInterval(interval), 5000);
}
