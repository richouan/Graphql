document.getElementById('login-form').addEventListener('submit', async function(event) {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const credentials = btoa(`${username}:${password}`);
  try {
    const response = await fetch('https://learn.zone01oujda.ma/api/auth/signin', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    });
    const data = await response.json();
    
    console.log('Login response:', response);
    console.log('Login response data:', data);
    
    if (response.ok) {
      localStorage.setItem('jwt', data);
      window.location.href = 'index.html';
    } else {
      document.getElementById('error-message').textContent = 'Invalid credentials';
    }
  } catch (error) {
    console.error('Error during login:', error);
    document.getElementById('error-message').textContent = 'Error logging in';
  }
});