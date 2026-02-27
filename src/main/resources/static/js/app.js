const API_URL = window.location.origin;

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
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

// --- Notification Logic ---
async function loadNotifications() {
    const list = document.getElementById('notificationList');
    const badge = document.getElementById('notificationBadge');
    if (!list) return;

    const res = await fetchAuth('/api/notifications');
    if (res.ok) {
        const notifications = await res.json();
        const unreadCount = notifications.filter(n => !n.read).length;

        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }

        list.innerHTML = notifications.length === 0
            ? '<div style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No notifications</div>'
            : notifications.map(n => `
                <div class="notification-item ${n.read ? '' : 'unread'}" onclick="handleNotificationClick('${n.id}', '${n.link}')">
                    <h5>${n.title}</h5>
                    <p>${n.message}</p>
                    <span class="time">${new Date(n.timestamp).toLocaleString()}</span>
                </div>
            `).join('');
    }
}

function toggleNotifications(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.classList.toggle('active');
}

async function handleNotificationClick(id, link) {
    await fetchAuth(`/api/notifications/${id}/read`, { method: 'PUT' });
    if (link && link !== 'null') {
        window.location.href = link;
    } else {
        loadNotifications();
        toggleNotifications();
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown && dropdown.classList.contains('active')) {
        if (!dropdown.contains(e.target) && !e.target.closest('.notification-bell')) {
            dropdown.classList.remove('active');
        }
    }
});

// Initial load
if (localStorage.getItem('token')) {
    setInterval(loadNotifications, 30000); // Check every 30s
    setTimeout(loadNotifications, 1000);
}
