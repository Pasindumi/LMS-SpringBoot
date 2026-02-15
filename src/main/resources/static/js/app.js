const API_URL = 'http://localhost:8081';

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token && window.location.pathname !== '/login.html' && window.location.pathname !== '/register.html' && window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
        window.location.href = '/login.html';
    }
    return token;
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// Helper to make authenticated requests
async function fetchAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }

    const response = await fetch(API_URL + url, {
        ...options,
        headers
    });

    if (response.status === 403) {
        // Token expired or invalid
        logout();
    }

    return response;
}
