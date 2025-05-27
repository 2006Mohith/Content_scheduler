const API_BASE_URL = 'http://localhost:5001/api'; // Adjust if your backend port is different

const authContainer = document.getElementById('authContainer'); // Or your main container class/ID
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterBtn = document.getElementById('showRegister');
const showLoginBtn = document.getElementById('showLogin');

// Elements for toggling display (simplified from original animated version)
const loginPanel = document.querySelector('.form-box.login');
const registerPanel = document.querySelector('.form-box.register');
const toggleLoginPanel = document.querySelector('.toggle-login-panel');
const toggleRegisterPanel = document.querySelector('.toggle-register-panel');


// --- Alert Function (from your original provided code, ensure it works) ---
function showAlert(message, type = 'info') {
    const alertContainer = document.querySelector('.alert-container');
    if (!alertContainer) {
        console.warn('Alert container not found. Message:', message);
        alert(`${type.toUpperCase()}: ${message}`); // Fallback to browser alert
        return;
    }
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`; // e.g., alert-success, alert-error

    // Simple icon mapping (can be extended with BoxIcons if you prefer)
    let iconHtml = '';
    if (type === 'success') iconHtml = '✓ ';
    if (type === 'error') iconHtml = '✗ ';
    if (type === 'warning') iconHtml = '! ';
    if (type === 'info') iconHtml = 'ℹ️ ';

    alertDiv.innerHTML = `
        <span>${iconHtml}${message}</span>
        <button class="alert-close" onclick="this.parentElement.remove()">×</button>
    `;
    alertContainer.appendChild(alertDiv);

    // Auto-remove alert after 5 seconds
    setTimeout(() => {
        if (alertDiv) alertDiv.remove();
    }, 5000);
}
// --- End Alert Function ---


// --- API Response Handler ---
async function handleApiResponse(response) {
    const responseData = await response.json().catch(() => ({ message: response.statusText || "An error occurred" }));
    if (!response.ok) {
        console.error('API Error Data:', responseData);
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
    }
    return responseData;
}
// --- End API Response Handler ---

// Toggle between login/register forms (simplified version)
if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', () => {
        loginPanel.style.display = 'none';
        toggleLoginPanel.style.display = 'none';
        registerPanel.style.display = 'block';
        toggleRegisterPanel.style.display = 'block';
        if (authContainer) authContainer.classList.add('active'); // If you use this class for other styling
    });
}

if (showLoginBtn) {
    showLoginBtn.addEventListener('click', () => {
        registerPanel.style.display = 'none';
        toggleRegisterPanel.style.display = 'none';
        loginPanel.style.display = 'block';
        toggleLoginPanel.style.display = 'block';
        if (authContainer) authContainer.classList.remove('active');
    });
}


// Handle login form submission
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const usernameOrEmail = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        if (!usernameOrEmail || !password) {
            showAlert('Please enter both username/email and password.', 'warning');
            return;
        }

        const loginSubmitButton = loginForm.querySelector('.btn');
        const originalButtonText = loginSubmitButton.textContent;
        loginSubmitButton.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Logging in...';
        loginSubmitButton.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: usernameOrEmail, password: password }),
            });
            const data = await handleApiResponse(response);

            localStorage.setItem('authToken', data.token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('profileName', data.profileName);
            localStorage.setItem('isAuthenticated', 'true'); // For existing checks

            showAlert(data.message || 'Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);

        } catch (error) {
            showAlert(error.message || 'Login failed. Please check your credentials.', 'error');
        } finally {
            loginSubmitButton.innerHTML = originalButtonText;
            loginSubmitButton.disabled = false;
        }
    });
}

// Handle registration form submission
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('regUsername').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value.trim();

        if (!username || !email || !password) {
            showAlert('Please fill all fields.', 'warning');
            return;
        }
        if (password.length < 6) {
            showAlert('Password must be at least 6 characters.', 'warning');
            return;
        }
        // Basic email validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            showAlert('Please enter a valid email address.', 'warning');
            return;
        }

        const registerSubmitButton = registerForm.querySelector('.btn');
        const originalButtonText = registerSubmitButton.textContent;
        registerSubmitButton.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Registering...';
        registerSubmitButton.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await handleApiResponse(response);

            showAlert(data.message || 'Registration successful! Please login.', 'success');
            // Switch to login form
            if (showLoginBtn) showLoginBtn.click();
            document.getElementById('loginUsername').value = username; // Pre-fill username
            document.getElementById('loginPassword').value = '';    // Clear password

        } catch (error) {
            showAlert(error.message || 'Registration failed. Please try again.', 'error');
        } finally {
            registerSubmitButton.innerHTML = originalButtonText;
            registerSubmitButton.disabled = false;
        }
    });
}

// Check if user is already logged in when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('isAuthenticated') === 'true' && localStorage.getItem('authToken')) {
        // If on login page but already authenticated, redirect to dashboard
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
             window.location.href = 'dashboard.html';
        }
    } else {
        // Not authenticated, ensure login form is focused if on index.html
        const loginUsernameField = document.getElementById('loginUsername');
        if (loginUsernameField && (loginPanel && loginPanel.style.display !== 'none')) {
             loginUsernameField.focus();
        }
    }
});