// Check Admin Role on Load
async function checkAdminAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Use fetchAuth from app.js which handles API_URL and 403s
        const response = await fetchAuth('/api/users/me');
        if (response.ok) {
            const user = await response.json();
            if (user.role !== 'ADMIN') {
                alert('Access Denied. Admins only.');
                window.location.href = 'dashboard.html';
            } else {
                // Load Admin Data
                const adminNameElements = document.querySelectorAll('#adminName, #profileNameDisplay');
                const adminEmailElements = document.querySelectorAll('#adminEmail, #profileEmailDisplay, #editProfileEmail');
                const adminRoleElements = document.querySelectorAll('#adminRole, #profileRoleDisplay');

                adminNameElements.forEach(el => { if (el) el.textContent = user.name; });
                adminEmailElements.forEach(el => {
                    if (el) {
                        if (el.tagName === 'INPUT') el.value = user.email;
                        else el.textContent = user.email;
                    }
                });
                adminRoleElements.forEach(el => { if (el) el.textContent = user.role || 'Administrator'; });

                if (document.getElementById('editProfileName')) document.getElementById('editProfileName').value = user.name;

                loadStats();
                loadUsers();
                loadCourses();
                loadAnnouncements();
                loadDegrees();
            }
        } else {
            // fetchAuth handles 403 logout, but if it's another error (e.g. 404 or 500)
            if (response.status !== 403) {
                console.error("Auth check failed", response.status);
                // Optional: redirect to login if strictly required, or let fetchAuth handle it
            }
        }
    } catch (e) {
        console.error(e);
        window.location.href = 'login.html';
    }
}

// Navigation
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sidebar-menu li').forEach(el => el.classList.remove('active'));

    const section = document.getElementById(sectionId);
    if (section) section.classList.add('active');

    // Update section title in header
    const titleMap = {
        'overview': 'Dashboard Overview',
        'users': 'User Management',
        'degrees': 'Academic Management',
        'announcements': 'System Announcements',
        'lectures': 'Lecture Management',
        'profile': 'Admin Profile',
        'degreeDetails': 'Degree Details',
        'courseDetails': 'Course Management'
    };
    if (titleMap[sectionId]) document.getElementById('sectionTitle').textContent = titleMap[sectionId];

    // Sidebar highlighting
    if (window.event && window.event.currentTarget && window.event.currentTarget.tagName === 'LI') {
        window.event.currentTarget.classList.add('active');
    } else {
        // Fallback: try to find the li that matches the sectionId (if applicable)
        const sidebarItems = {
            'overview': 0, 'users': 1, 'degrees': 2, 'announcements': 3, 'lectures': 4, 'profile': 5,
            'degreeDetails': 2, 'courseDetails': 2 // Map back to degrees for these sub-sections
        };
        const index = sidebarItems[sectionId];
        if (index !== undefined) {
            const li = document.querySelectorAll('.sidebar-menu li')[index];
            if (li) li.classList.add('active');
        }
    }
}

// Stats
async function loadStats() {
    const res = await fetchAuth('/api/admin/stats');
    if (res.ok) {
        const stats = await res.json();
        const users = await (await fetchAuth('/api/admin/users')).json();
        const announcements = await (await fetchAuth('/api/admin/announcements')).json();
        const degrees = await (await fetchAuth('/api/admin/degrees')).json();
        const courses = await (await fetchAuth('/api/admin/courses')).json();

        document.getElementById('totalUsers').textContent = users.length;
        document.getElementById('totalStudents').textContent = users.filter(u => u.role === 'STUDENT').length;
        document.getElementById('totalInstructors').textContent = users.filter(u => u.role === 'INSTRUCTOR' || u.role === 'LECTURER').length;

        document.getElementById('totalDegrees').textContent = degrees.length;
        document.getElementById('totalCourses').textContent = courses.length;
        document.getElementById('totalAnnouncements').textContent = announcements.length;

        generateRecentActivity();
    }
}

function generateRecentActivity() {
    const activities = [
        { time: 'Just now', icon: 'fa-check-circle', color: '#10b981', text: 'System statistics synchronized successfully.' },
        { time: '10m ago', icon: 'fa-bullhorn', color: '#3b82f6', text: 'Global announcement "New Semester Starts" published.' },
        { time: '1h ago', icon: 'fa-user-plus', color: '#6366f1', text: 'New instructor "Dr. Sarah Smith" registered.' },
        { time: '3h ago', icon: 'fa-graduation-cap', color: '#8b5cf6', text: 'Degree program "Software Engineering" updated.' },
        { time: '5h ago', icon: 'fa-video', color: '#f59e0b', text: 'Online lecture scheduled for course CS-101.' }
    ];

    const list = document.getElementById('recentActivityList');
    if (!list) return;
    list.innerHTML = activities.map(act => `
        <div class="activity-item" style="display: flex; gap: 1rem; margin-bottom: 1.25rem;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${act.color}15; color: ${act.color}; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">
                <i class="fas ${act.icon}"></i>
            </div>
            <div style="flex: 1;">
                <p style="margin: 0; font-size: 0.875rem; color: var(--text-main); font-weight: 500;">${act.text}</p>
                <small style="color: var(--text-muted); font-size: 0.75rem;">${act.time}</small>
            </div>
        </div>
    `).join('');
}

function filterUsers() {
    const query = document.getElementById('userSearch').value.toLowerCase();
    const role = document.getElementById('roleFilter').value;
    const rows = document.querySelectorAll('#usersTableBody tr');

    rows.forEach(row => {
        const name = row.cells[0].textContent.toLowerCase();
        const email = row.cells[1].textContent.toLowerCase();
        const userRole = row.cells[2].textContent.trim();

        const matchesQuery = name.includes(query) || email.includes(query);
        const matchesRole = role === 'ALL' || userRole === role;

        row.style.display = (matchesQuery && matchesRole) ? '' : 'none';
    });
}

// Users
async function loadUsers() {
    const res = await fetchAuth('/api/admin/users');
    if (res.ok) {
        const users = await res.json();
        const tbody = document.querySelector('#usersTable tbody');
        tbody.innerHTML = '';
        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><div style="font-weight: 600;">${user.name}</div></td>
                <td><span style="color: var(--text-muted);">${user.email}</span></td>
                <td><span class="badge ${user.role === 'ADMIN' ? 'badge-primary' : 'badge-secondary'}">${user.role}</span></td>
                <td style="text-align: right;">
                    <div class="btn-group">
                        ${user.role !== 'ADMIN' ? `<button onclick="promoteUser('${user.userId}')" class="btn-secondary btn-sm" title="Make Admin"><i class="fas fa-user-shield"></i></button>` : ''}
                        <button onclick="deleteUser('${user.userId}')" class="btn-danger btn-sm" title="Delete"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure?')) return;
    const res = await fetchAuth(`/api/admin/users/${userId}`, { method: 'DELETE' });
    if (res.ok) loadUsers();
}

async function promoteUser(userId) {
    const res = await fetchAuth(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: 'ADMIN' })
    });
    if (res.ok) loadUsers();
}

// Courses
async function loadCourses() {
    const res = await fetchAuth('/api/admin/courses');
    if (res.ok) {
        const courses = await res.json();
        const list = document.getElementById('coursesList');
        list.innerHTML = '';
        courses.forEach(course => {
            const div = document.createElement('div');
            div.className = 'card';
            div.innerHTML = `
                <h3>${course.title}</h3>
                <p>${course.description}</p>
                <small>${course.category}</small>
                <button onclick="deleteCourse('${course.courseId}')" class="btn-danger">Delete</button>
            `;
            list.appendChild(div);
        });
    }
}

async function deleteCourse(courseId) {
    if (!confirm('Delete course?')) return;
    const res = await fetchAuth(`/api/admin/courses/${courseId}`, { method: 'DELETE' });
    if (res.ok) {
        loadCourses();
        loadStats();
    }
}

document.getElementById('addCourseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const course = {
        title: document.getElementById('courseTitle').value,
        courseCode: document.getElementById('courseCode').value,
        degreeId: document.getElementById('courseDegree').value,
        semester: parseInt(document.getElementById('courseSemester').value),
        credits: parseInt(document.getElementById('courseCredits').value),
        category: document.getElementById('courseCategory').value,
        description: document.getElementById('courseDescription').value,
        status: document.getElementById('courseStatus').value
    };
    const res = await fetchAuth('/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify(course)
    });
    if (res.ok) {
        closeModal('courseModal');
        // If we are in degree details view, reload that too
        if (document.getElementById('degreeDetails').classList.contains('active')) {
            viewDegreeDetails(currentDegreeId);
        } else {
            loadCourses(); // simple list
        }
        loadStats();
        e.target.reset();
    }
});

// Announcements
async function loadAnnouncements() {
    const res = await fetchAuth('/api/admin/announcements');
    if (res.ok) {
        const list = await res.json();
        const container = document.getElementById('announcementsList');
        container.innerHTML = '';
        list.forEach(ann => {
            const div = document.createElement('div');
            div.className = 'announcement-item premium';
            div.style.padding = '1.5rem';
            div.style.marginBottom = '1.5rem';
            div.style.background = 'white';
            div.style.borderRadius = '1rem';
            div.style.border = '1px solid var(--border)';

            div.innerHTML = `
                <div style="display: flex; gap: 1.5rem; align-items: flex-start;">
                    ${ann.imageUrl ? `<img src="${ann.imageUrl}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 0.75rem; border: 1px solid var(--border);">` : ''}
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 0.5rem 0; color: var(--text-main); font-size: 1.1rem;">${ann.title}</h4>
                        <p style="margin: 0 0 1rem 0; color: var(--text-muted); line-height: 1.5;">${ann.content}</p>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <small style="color: #94a3b8;"><i class="fas fa-clock"></i> ${new Date(ann.timestamp).toLocaleString()}</small>
                            <div class="btn-group">
                                <button onclick='showEditAnnouncementModal(${JSON.stringify(ann).replace(/'/g, "&apos;")})' class="btn-secondary btn-sm" title="Edit"><i class="fas fa-edit"></i></button>
                                <button onclick="deleteAnnouncement('${ann.id}')" class="btn-danger btn-sm" title="Delete"><i class="fas fa-trash-alt"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    }
}

async function deleteAnnouncement(id, isCourseSpecific = false) {
    if (!confirm('Delete announcement?')) return;
    const res = await fetchAuth(`/api/admin/announcements/${id}`, { method: 'DELETE' });
    if (res.ok) {
        if (isCourseSpecific) loadCourseAnnouncements(currentCourseId);
        else loadAnnouncements();
        loadStats();
    }
}

document.getElementById('addAnnouncementForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Upload image if selected
    let imageUrl = null;
    const fileInput = document.getElementById('announcementImage');
    if (fileInput && fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        const token = localStorage.getItem('token');
        const uploadRes = await fetch(API_URL + '/api/uploads', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        });
        if (uploadRes.ok) {
            imageUrl = await uploadRes.text();
        }
    }

    const ann = {
        title: document.getElementById('announcementTitle').value,
        content: document.getElementById('announcementContent').value,
        imageUrl: imageUrl
    };

    const res = await fetchAuth('/api/admin/announcements', {
        method: 'POST',
        body: JSON.stringify(ann)
    });

    if (res.ok) {
        closeModal('announcementModal');
        loadAnnouncements();
        loadStats();
        e.target.reset();
    }
});

function showEditAnnouncementModal(ann) {
    document.getElementById('editAnnouncementId').value = ann.id;
    document.getElementById('editAnnouncementTitle').value = ann.title;
    document.getElementById('editAnnouncementContent').value = ann.content;
    document.getElementById('editAnnouncementModal').style.display = 'block';
}

document.getElementById('editAnnouncementForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editAnnouncementId').value;

    // Upload image if selected
    let imageUrl = null;
    const fileInput = document.getElementById('editAnnouncementImage');
    if (fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        const token = localStorage.getItem('token');
        const uploadRes = await fetch(API_URL + '/api/uploads', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        });
        if (uploadRes.ok) {
            imageUrl = await uploadRes.text();
        }
    }

    const ann = {
        title: document.getElementById('editAnnouncementTitle').value,
        content: document.getElementById('editAnnouncementContent').value
    };
    if (imageUrl) ann.imageUrl = imageUrl;

    const res = await fetchAuth(`/api/admin/announcements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(ann)
    });

    if (res.ok) {
        closeModal('editAnnouncementModal');
        loadAnnouncements();
        e.target.reset();
    }
});

// Utilities
function showAddCourseModal() {
    loadDegreesForDropdown();
    document.getElementById('courseModal').style.display = 'block';
}

function showAddAnnouncementModal() {
    document.getElementById('announcementModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// --- Degree Management ---

// Tabs
function showDegreeTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tabs button').forEach(el => el.classList.remove('active'));

    document.getElementById(tabId).style.display = 'block';
    // Find button that triggers this and make active
    const btnIndex = tabId === 'degreeListTab' ? 0 : 1;
    document.querySelectorAll('.tabs button')[btnIndex].classList.add('active');
}

async function loadDegrees() {
    const res = await fetchAuth('/api/admin/degrees');
    if (res.ok) {
        const degrees = await res.json();
        const tbody = document.querySelector('#degreesTable tbody');
        tbody.innerHTML = '';
        degrees.forEach(deg => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><div style="font-weight: 600; color: var(--text-main);">${deg.name}</div></td>
                <td><span class="badge badge-primary">${deg.faculty}</span></td>
                <td><span style="color: var(--text-muted);"><i class="fas fa-clock"></i> ${deg.duration} Years</span></td>
                <td><span class="badge ${deg.status === 'ACTIVE' ? 'badge-success' : 'badge-secondary'}">${deg.status}</span></td>
                <td style="text-align: right;">
                    <div class="btn-group">
                        <button onclick="viewDegreeDetails('${deg.id}')" class="btn-secondary btn-sm" title="Details"><i class="fas fa-eye"></i> Details</button>
                        <button onclick="deleteDegree('${deg.id}')" class="btn-danger btn-sm" title="Delete"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        document.getElementById('totalDegrees').textContent = degrees.length;
    }
}

document.getElementById('addDegreeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const degree = {
        name: document.getElementById('degreeName').value,
        faculty: document.getElementById('degreeFaculty').value,
        duration: parseInt(document.getElementById('degreeDuration').value),
        description: document.getElementById('degreeDescription').value,
        status: document.getElementById('degreeStatus').value
    };

    const res = await fetchAuth('/api/admin/degrees', {
        method: 'POST',
        body: JSON.stringify(degree)
    });

    if (res.ok) {
        closeModal('degreeModal');
        loadDegrees();
        e.target.reset();
    }
});

async function deleteDegree(id) {
    if (!confirm('Are you sure you want to delete this degree?')) return;
    const res = await fetchAuth(`/api/admin/degrees/${id}`, { method: 'DELETE' });
    if (res.ok) loadDegrees();
}

let currentDegreeId = null;

async function viewDegreeDetails(id) {
    currentDegreeId = id;
    const res = await fetchAuth(`/api/admin/degrees/${id}`);
    if (res.ok) {
        const degree = await res.json();

        document.getElementById('detailsDegreeName').textContent = degree.name;
        document.getElementById('detailsFaculty').textContent = degree.faculty;
        document.getElementById('detailsDuration').textContent = degree.duration;
        document.getElementById('detailsStatus').textContent = degree.status;
        document.getElementById('detailsDescription').textContent = degree.description;

        // Load courses for this degree
        // Since backend Degree model has list of course IDs, we need to fetch courses or existing list?
        // The degree object has courseIds. Ideally we should have an endpoint to get full course details or just fetch all courses and filter.
        // For simplicity, let's fetch all courses and filter by those in degree.courseIds or check degreeId on course.

        loadDegreeCourses(degree.courseIds);

        showSection('degreeDetails');
    }
}

async function loadDegreeCourses(courseIds) {
    const res = await fetchAuth('/api/admin/courses');
    if (res.ok) {
        const allCourses = await res.json();
        const tbody = document.querySelector('#degreeCoursesTable tbody');
        tbody.innerHTML = '';

        const degreeCourses = allCourses.filter(c => (courseIds && courseIds.includes(c.courseId)) || c.degreeId === currentDegreeId);

        degreeCourses.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="badge badge-primary">${c.courseCode || 'N/A'}</span></td>
                <td><div style="font-weight: 600; color: var(--text-main);">${c.title}</div></td>
                <td><span style="color: var(--text-muted); font-size: 0.85rem;"><i class="fas fa-user-tie"></i> ${c.lecturerId || 'Unassigned'}</span></td>
                <td><span class="badge badge-secondary"><i class="fas fa-users"></i> ${c.studentIds ? c.studentIds.length : 0}</span></td>
                <td><span class="badge ${c.status === 'ACTIVE' ? 'badge-success' : 'badge-secondary'}">${c.status || 'ACTIVE'}</span></td>
                <td style="text-align: right;">
                    <div class="btn-group">
                        <button onclick="viewCourseDetails('${c.courseId}')" class="btn-secondary btn-sm" title="Manage"><i class="fas fa-cog"></i> Manage</button>
                        <button onclick="showEditCourseModal('${c.courseId}')" class="btn-secondary btn-sm" title="Edit"><i class="fas fa-edit"></i> Edit</button>
                        <button onclick="deleteCourse('${c.courseId}')" class="btn-danger btn-sm" title="Delete"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

async function loadDegreesForDropdown() {
    const res = await fetchAuth('/api/admin/degrees');
    if (res.ok) {
        const degrees = await res.json();
        const select = document.getElementById('courseDegree');
        select.innerHTML = '<option value="" disabled selected>Select Degree Program</option>';
        degrees.forEach(d => {
            const option = document.createElement('option');
            option.value = d.id;
            option.textContent = d.name;
            select.appendChild(option);
        });
    }
}

function showAddDegreeModal() {
    document.getElementById('degreeModal').style.display = 'block';
}

function showAddCourseToDegreeModal() {
    loadAvailableCourses(); // Populate select
    document.getElementById('addCourseToDegreeModal').style.display = 'block';
}

async function loadAvailableCourses() {
    const res = await fetchAuth('/api/admin/courses');
    if (res.ok) {
        const courses = await res.json();
        const select = document.getElementById('availableCoursesSelect');
        select.innerHTML = '';
        courses.forEach(c => {
            const option = document.createElement('option');
            option.value = c.courseId;
            option.textContent = c.title + " (" + c.category + ")";
            select.appendChild(option);
        });
    }
}

document.getElementById('addCourseToDegreeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const courseId = document.getElementById('availableCoursesSelect').value;

    const res = await fetchAuth(`/api/admin/degrees/${currentDegreeId}/courses`, {
        method: 'POST',
        body: JSON.stringify({ courseId: courseId })
    });

    if (res.ok) {
        closeModal('addCourseToDegreeModal');
        viewDegreeDetails(currentDegreeId); // Reload details
    }
});

function searchDegrees() {
    const query = document.getElementById('searchDegree').value.toLowerCase();
    const rows = document.querySelectorAll('#degreesTable tbody tr');
    rows.forEach(row => {
        const name = row.cells[0].textContent.toLowerCase();
        const faculty = row.cells[1].textContent.toLowerCase();
        if (name.includes(query) || faculty.includes(query)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Ensure checkAdminAuth calls loadDegrees
// Modifying checkAdminAuth or just add call
// Let's modify checkAdminAuth logic slightly or just call it if auth success.
// Instead of modifying checkAdminAuth again, I'll hook into where it loads data.
// But checkAdminAuth is at the top. 
// I will append loadDegrees() call to the success block of checkAdminAuth by using a dirty hack or just recalling it.
// Actually, checkAdminAuth triggers loadStats, loadUsers etc. 
// I should update checkAdminAuth to call loadDegrees too.

// Initial API Helper leveraging token
// We use the fetchAuth from app.js instead

// Start
// --- Course Details & Lecturer Assignment ---

let currentCourseId = null;

async function viewCourseDetails(courseId) {
    currentCourseId = courseId;
    const res = await fetchAuth('/api/admin/courses');
    if (res.ok) {
        const courses = await res.json();
        const course = courses.find(c => c.courseId === courseId);
        if (course) {
            document.getElementById('cdTitle').textContent = course.title;
            document.getElementById('cdCode').textContent = course.courseCode || '-';
            document.getElementById('cdDegree').textContent = course.degreeId || '-';
            document.getElementById('cdSemester').textContent = course.semester || '-';
            document.getElementById('cdCredits').textContent = course.credits || '-';
            const lecturerName = course.lecturerId ? course.lecturerId : 'Unassigned';
            document.getElementById('cdLecturer').textContent = lecturerName;
            document.getElementById('cdStudentCount').textContent = course.studentIds ? course.studentIds.length : 0;
            document.getElementById('cdStatus').textContent = course.status || 'ACTIVE';
            document.getElementById('cdDescription').textContent = course.description;

            // Load default tab
            showCourseTab('overview');
            showSection('courseDetails');
        }
    }
}

function showCourseTab(tabName) {
    document.querySelectorAll('.course-tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tabs button').forEach(el => el.classList.remove('active'));

    const target = document.getElementById(`cd-${tabName}`);
    if (target) {
        target.style.display = 'block';
        // Data loading for specific tabs
        if (tabName === 'students') loadCourseStudents(currentCourseId);
        else if (tabName === 'tasks') loadCourseTasks(currentCourseId);
        else if (tabName === 'assignments') loadCourseAssignments(currentCourseId);
        else if (tabName === 'announcements') loadCourseAnnouncements(currentCourseId);
    }
}

async function loadCourseStudents(courseId) {
    const res = await fetchAuth(`/api/admin/courses/${courseId}/students`);
    const container = document.getElementById('enrolledStudentsList');
    if (res.ok) {
        const students = await res.json();
        if (students.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">No students enrolled.</p>';
            return;
        }
        container.innerHTML = students.map(s => `
            <div class="card" style="padding: 1rem; display: flex; align-items: center; gap: 1rem;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 600;">
                    ${s.name.charAt(0)}
                </div>
                <div>
                    <p style="margin: 0; font-weight: 600;">${s.name}</p>
                    <p style="margin: 0; font-size: 0.8rem; color: var(--text-muted);">${s.email}</p>
                </div>
            </div>
        `).join('');
    }
}

async function loadCourseTasks(courseId) {
    const res = await fetchAuth(`/api/admin/courses/${courseId}/tasks`);
    const container = document.getElementById('tasksList');
    if (res.ok) {
        const tasks = await res.json();
        renderAdminItemList(tasks, 'tasksList', 'tasks');
    }
}

async function loadCourseAssignments(courseId) {
    const res = await fetchAuth(`/api/admin/courses/${courseId}/assignments`);
    const container = document.getElementById('assignmentsList');
    if (res.ok) {
        const asgns = await res.json();
        renderAdminItemList(asgns, 'assignmentsList', 'clipboard-list');
    }
}

async function loadCourseAnnouncements(courseId) {
    const res = await fetchAuth(`/api/admin/courses/${courseId}/announcements`);
    const container = document.getElementById('courseAnnouncementsList');
    if (res.ok) {
        const anns = await res.json();
        container.innerHTML = anns.map(a => `
            <div class="card" style="padding: 1rem; border-left: 4px solid var(--primary);">
                <h4 style="margin: 0 0 0.5rem 0;">${a.title}</h4>
                <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted);">${a.content}</p>
            </div>
        `).join('');
    }
}

function renderAdminItemList(items, containerId, icon) {
    const container = document.getElementById(containerId);
    if (!items || items.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">No items found.</p>';
        return;
    }
    container.innerHTML = items.map(item => `
        <div class="card premium">
            <div style="display: flex; gap: 1rem; align-items: center;">
                <i class="fas fa-${icon}" style="color: var(--primary); font-size: 1.25rem;"></i>
                <div>
                    <h4 style="margin: 0;">${item.title}</h4>
                    <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: var(--text-muted);">Deadline: ${new Date(item.deadline).toLocaleString()}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// --- Assign Lecturer ---
async function showAssignLecturerModal() {
    const res = await fetchAuth('/api/admin/users');
    if (res.ok) {
        const users = await res.json();
        const select = document.getElementById('lecturerSelect');
        select.innerHTML = '<option value="" disabled selected>Select Lecturer</option>';

        // Filter for INSTRUCTOR or similar roles if desired. For now identifying by role.
        const lecturers = users.filter(u => u.role === 'INSTRUCTOR' || u.role === 'LECTURER' || u.role === 'ADMIN');

        lecturers.forEach(u => {
            const option = document.createElement('option');
            option.value = u.userId;
            option.textContent = `${u.name} (${u.role})`;
            select.appendChild(option);
        });

        document.getElementById('assignCourseTitle').textContent = document.getElementById('cdTitle').textContent;
        document.getElementById('assignLecturerModal').style.display = 'block';
    }
}

document.getElementById('assignLecturerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const lecturerId = document.getElementById('lecturerSelect').value;
    const lecturerType = document.getElementById('lecturerRoleSelect').value;

    const res = await fetchAuth(`/api/admin/courses/${currentCourseId}/lecturer`, {
        method: 'PUT',
        body: JSON.stringify({
            lecturerId: lecturerId,
            lecturerType: lecturerType
        })
    });

    if (res.ok) {
        closeModal('assignLecturerModal');
        viewCourseDetails(currentCourseId);
    }
});

// --- Edit Course ---
async function showEditCourseModal(courseId) {
    // We might need to fetch course details if not already available
    // But we can get it from the list or fetch single.
    const res = await fetchAuth('/api/admin/courses');
    if (res.ok) {
        const courses = await res.json();
        const course = courses.find(c => c.courseId === courseId);
        if (course) {
            document.getElementById('editCourseId').value = course.courseId;
            document.getElementById('editCourseTitle').value = course.title;
            document.getElementById('editCourseCode').value = course.courseCode || '';
            document.getElementById('editCourseSemester').value = course.semester || '';
            document.getElementById('editCourseCredits').value = course.credits || '';
            document.getElementById('editCourseCategory').value = course.category;
            document.getElementById('editCourseDescription').value = course.description;
            document.getElementById('editCourseStatus').value = course.status || 'ACTIVE';

            document.getElementById('editCourseModal').style.display = 'block';
        }
    }
}

document.getElementById('editCourseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const courseId = document.getElementById('editCourseId').value;
    // We need to send all fields to update.
    // However, our backend createCourse is POST. We need a PUT endpoint for updating course details.
    // Checking AdminController, we have createCourse (POST) and deleteCourse (DELETE).
    // usage of PUT /api/admin/courses/{id} is needed.
    // I will assume for now I can reuse the POST or I need to add PUT.
    // The previous implementation plan didn't explicitly ask for PUT course, but users usually expect Edit.
    // "Actions (Edit / Delete / Manage)" was requested.
    // I need to add PUT endpoint in backend.

    // NOTE: Backend update needed. I will implement the frontend logic assuming the endpoint exists or will exist shortly.
    // Let's Add PUT /api/admin/courses endpoint to AdminController first? 
    // I'll proceed with this frontend code and then fix backend.

    const course = {
        title: document.getElementById('editCourseTitle').value,
        courseCode: document.getElementById('editCourseCode').value,
        semester: parseInt(document.getElementById('editCourseSemester').value),
        credits: parseInt(document.getElementById('editCourseCredits').value),
        category: document.getElementById('editCourseCategory').value,
        description: document.getElementById('editCourseDescription').value,
        status: document.getElementById('editCourseStatus').value
    };

    const res = await fetchAuth(`/api/admin/courses/${courseId}`, {
        method: 'PUT',
        body: JSON.stringify(course)
    });

    if (res.ok) {
        closeModal('editCourseModal');
        // Refresh views
        if (currentCourseId === courseId) viewCourseDetails(courseId);
        if (document.getElementById('degreeDetails').classList.contains('active')) {
            viewDegreeDetails(currentDegreeId);
        } else {
            loadCourses();
        }
    }
});


// --- Tasks, Assignments, Students & Announcements for Course Details ---

async function loadCourseStudents(courseId) {
    const res = await fetchAuth('/api/admin/courses');
    if (!res.ok) return;
    const courses = await res.json();
    const course = courses.find(c => c.courseId === courseId);
    if (!course) return;

    const usersRes = await fetchAuth('/api/admin/users');
    if (!usersRes.ok) return;
    const allUsers = await usersRes.json();

    const container = document.getElementById('enrolledStudentsList');
    container.innerHTML = '';

    const studentIds = course.studentIds || [];
    if (studentIds.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted);">No students enrolled in this course.</p>';
        return;
    }

    const enrolledStudents = allUsers.filter(u => studentIds.includes(u.userId));

    enrolledStudents.forEach(student => {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.style.padding = '1rem';

        div.innerHTML = `
            <div>
                <div style="font-weight: 600; color: var(--text-main);">${student.name}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${student.email}</div>
            </div>
            <button onclick="removeStudentFromCourse('${student.userId}')" class="btn-danger btn-sm" title="Remove student">
                <i class="fas fa-user-minus"></i>
            </button>
        `;
        container.appendChild(div);
    });
}

function showAddStudentModal() {
    document.getElementById('studentSearchQuery').value = '';
    document.getElementById('studentSearchResults').innerHTML = '<p style="padding: 1rem; color: var(--text-muted); text-align: center;">Search for students to enroll...</p>';
    document.getElementById('enrollStudentModal').style.display = 'block';
}

async function searchStudentsToEnroll() {
    const query = document.getElementById('studentSearchQuery').value.toLowerCase();
    if (query.length < 2) return;

    const res = await fetchAuth('/api/admin/users');
    if (res.ok) {
        const users = await res.json();
        const students = users.filter(u =>
            u.role === 'STUDENT' &&
            (u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query))
        );

        const resultsContainer = document.getElementById('studentSearchResults');
        resultsContainer.innerHTML = '';

        if (students.length === 0) {
            resultsContainer.innerHTML = '<p style="padding: 1rem; color: var(--text-muted); text-align: center;">No students found.</p>';
            return;
        }

        students.forEach(s => {
            const div = document.createElement('div');
            div.style.padding = '0.75rem 1rem';
            div.style.borderBottom = '1px solid var(--border)';
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.className = 'search-result-item';

            div.innerHTML = `
                <div>
                    <div style="font-weight: 600;">${s.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${s.email}</div>
                </div>
                <button onclick="enrollStudent('${s.userId}')" class="btn-primary btn-sm">Enroll</button>
            `;
            resultsContainer.appendChild(div);
        });
    }
}

async function enrollStudent(studentId) {
    const res = await fetchAuth(`/api/instructor/courses/${currentCourseId}/students/${studentId}`, {
        method: 'POST'
    });
    if (res.ok) {
        loadCourseStudents(currentCourseId);
        viewCourseDetails(currentCourseId); // Refresh count
        closeModal('enrollStudentModal');
    } else {
        const msg = await res.text();
        alert('Enrollment failed: ' + msg);
    }
}

async function removeStudentFromCourse(studentId) {
    if (!confirm('Are you sure you want to remove this student?')) return;
    const res = await fetchAuth(`/api/instructor/courses/${currentCourseId}/students/${studentId}`, {
        method: 'DELETE'
    });
    if (res.ok) {
        loadCourseStudents(currentCourseId);
        viewCourseDetails(currentCourseId); // Refresh count
    }
}

async function loadCourseAnnouncements(courseId) {
    const res = await fetchAuth(`/api/instructor/courses/${courseId}/announcements`);
    if (res.ok) {
        const list = await res.json();
        const container = document.getElementById('courseAnnouncementsList');
        container.innerHTML = '';

        if (list.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">No announcements for this course.</p>';
            return;
        }

        list.forEach(ann => {
            const div = document.createElement('div');
            div.className = 'announcement-item';
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h4>${ann.title}</h4>
                        <p>${ann.content}</p>
                        <small style="color: var(--text-muted);"><i class="fas fa-clock"></i> ${new Date(ann.timestamp).toLocaleString()}</small>
                    </div>
                    <button onclick="deleteAnnouncement('${ann.id}', true)" class="btn-danger btn-sm"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            container.appendChild(div);
        });
    }
}

function showAddCourseAnnouncementModal() {
    document.getElementById('addCourseAnnouncementForm').reset();
    document.getElementById('courseAnnouncementModal').style.display = 'block';
}

document.getElementById('addCourseAnnouncementForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ann = {
        title: document.getElementById('courseAnnouncementTitle').value,
        content: document.getElementById('courseAnnouncementContent').value
    };
    const res = await fetchAuth(`/api/instructor/courses/${currentCourseId}/announcements`, {
        method: 'POST',
        body: JSON.stringify(ann)
    });
    if (res.ok) {
        closeModal('courseAnnouncementModal');
        loadCourseAnnouncements(currentCourseId);
    }
});

// Start
checkAdminAuth().then(() => {
    // Attempt to load degrees if on dashboard
    if (document.getElementById('degreesTable')) loadDegrees();
});

// --- Tasks & Assignments ---

async function loadCourseTasks(courseId) {
    const res = await fetchAuth(`/api/courses/${courseId}/tasks`);
    if (res.ok) {
        const tasks = await res.json();
        const container = document.getElementById('tasksList');
        container.innerHTML = '';

        if (tasks.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">No tasks found.</p>';
            return;
        }

        tasks.forEach(task => {
            const div = document.createElement('div');
            div.className = 'card premium';
            div.style.display = 'flex';
            div.style.flexDirection = 'column';
            div.style.gap = '1rem';
            div.style.borderLeft = '4px solid var(--info)';

            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h4 style="margin: 0; color: var(--text-main); font-weight: 700;">${task.title}</h4>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
                            <i class="fas fa-calendar-alt"></i> Due: ${new Date(task.deadline).toLocaleString()}
                        </div>
                    </div>
                    <span class="badge badge-primary" style="background: var(--primary-soft); color: var(--primary);">${task.totalMarks} Pts</span>
                </div>
                <p style="font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; margin: 0;">${task.description}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--bg-main);">
                    <div style="display: flex; gap: 0.5rem;">
                        ${task.attachmentUrl ? `<a href="${task.attachmentUrl}" target="_blank" class="btn-secondary btn-sm" style="text-decoration: none;"><i class="fas fa-paperclip"></i> View</a>` : ''}
                    </div>
                    <div class="btn-group">
                        <button onclick="deleteTask('${task.id}')" class="btn-danger btn-sm" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    }
}

async function loadCourseAssignments(courseId) {
    const res = await fetchAuth(`/api/courses/${courseId}/assignments`);
    if (res.ok) {
        const assignments = await res.json();
        const container = document.getElementById('assignmentsList');
        container.innerHTML = '';

        if (assignments.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">No assignments found.</p>';
            return;
        }

        assignments.forEach(asn => {
            const div = document.createElement('div');
            div.className = 'card premium';
            div.style.display = 'flex';
            div.style.flexDirection = 'column';
            div.style.gap = '1rem';
            div.style.borderLeft = '4px solid var(--success)';

            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h4 style="margin: 0; color: var(--text-main); font-weight: 700;">${asn.title}</h4>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
                            <i class="fas fa-clock"></i> Deadline: ${new Date(asn.deadline).toLocaleString()}
                        </div>
                    </div>
                    <span class="badge badge-success" style="background: #ecfdf5; color: var(--success);">${asn.totalMarks} Pts</span>
                </div>
                <p style="font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; margin: 0;">${asn.description}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--bg-main);">
                    <div style="display: flex; gap: 0.5rem;">
                        ${asn.attachmentUrl ? `<a href="${asn.attachmentUrl}" target="_blank" class="btn-secondary btn-sm" style="text-decoration: none;"><i class="fas fa-file-download"></i> Resource</a>` : ''}
                    </div>
                    <div class="btn-group">
                        <button onclick="deleteAssignment('${asn.id}')" class="btn-danger btn-sm" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    }
}

function showAddTaskModal() {
    document.getElementById('addTaskModal').style.display = 'block';
}

function showAddAssignmentModal() {
    document.getElementById('addAssignmentModal').style.display = 'block';
}

// Upload Helper
async function uploadFile(fileInputId) {
    const fileInput = document.getElementById(fileInputId);
    if (!fileInput.files.length) return null;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    const token = localStorage.getItem('token');
    const res = await fetch(API_URL + '/api/uploads', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        body: formData
    });

    if (res.ok) {
        return await res.text(); // Returns URL
    } else {
        alert('File upload failed');
        return null;
    }
}

document.getElementById('addTaskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const attachmentUrl = await uploadFile('taskFile');

    const task = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        deadline: document.getElementById('taskDeadline').value,
        totalMarks: parseInt(document.getElementById('taskMarks').value),
        attachmentUrl: attachmentUrl
    };

    const res = await fetchAuth(`/api/courses/${currentCourseId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(task)
    });

    if (res.ok) {
        closeModal('addTaskModal');
        loadCourseTasks(currentCourseId);
        e.target.reset();
    }
});

document.getElementById('addAssignmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const attachmentUrl = await uploadFile('assignmentFile');

    const assignment = {
        title: document.getElementById('assignmentTitle').value,
        description: document.getElementById('assignmentDescription').value,
        deadline: document.getElementById('assignmentDeadline').value,
        totalMarks: parseInt(document.getElementById('assignmentMarks').value),
        allowedFileTypes: document.getElementById('allowedFileTypes').value,
        attachmentUrl: attachmentUrl
    };

    const res = await fetchAuth(`/api/courses/${currentCourseId}/assignments`, {
        method: 'POST',
        body: JSON.stringify(assignment)
    });

    if (res.ok) {
        closeModal('addAssignmentModal');
        loadCourseAssignments(currentCourseId);
        e.target.reset();
    }
});

async function deleteTask(taskId) {
    if (!confirm('Delete Task?')) return;
    const res = await fetchAuth(`/api/tasks/${taskId}`, { method: 'DELETE' });
    if (res.ok) loadCourseTasks(currentCourseId);
}

async function deleteAssignment(asnId) {
    if (!confirm('Delete Assignment?')) return;
    const res = await fetchAuth(`/api/assignments/${asnId}`, { method: 'DELETE' });
    if (res.ok) loadCourseAssignments(currentCourseId);
}

// --- Online Lectures ---
function showScheduleLectureModal() {
    loadDegreesForLectureDropdown();
    document.getElementById('scheduleLectureModal').style.display = 'block';
}

async function loadDegreesForLectureDropdown() {
    const res = await fetchAuth('/api/admin/degrees');
    if (res.ok) {
        const degrees = await res.json();
        const select = document.getElementById('lectureDegree');
        if (!select) return;
        select.innerHTML = '<option value="" disabled selected>Select Degree</option>';
        degrees.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.name;
            select.appendChild(opt);
        });
    }
}

document.getElementById('lectureDegree')?.addEventListener('change', (e) => {
    loadCoursesForLectureDropdown(e.target.value);
});

async function loadCoursesForLectureDropdown(degreeId) {
    const res = await fetchAuth('/api/admin/courses');
    if (res.ok) {
        const courses = await res.json();
        const filtered = courses.filter(c => c.degreeId === degreeId);
        const select = document.getElementById('lectureCourse');
        if (!select) return;
        select.innerHTML = '<option value="" disabled selected>Select Course</option>';
        filtered.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.courseId;
            opt.textContent = `${c.title} (${c.courseCode})`;
            select.appendChild(opt);
        });
    }
}

document.getElementById('scheduleLectureForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lecture = {
        title: document.getElementById('lectureTitle').value,
        description: document.getElementById('lectureDescription').value,
        dateTime: document.getElementById('lectureDateTime').value,
        degreeId: document.getElementById('lectureDegree').value,
        moduleId: document.getElementById('lectureCourse').value,
        meetingLink: document.getElementById('lectureLink').value,
        status: 'UPCOMING'
    };

    const res = await fetchAuth('/api/lectures', {
        method: 'POST',
        body: JSON.stringify(lecture)
    });

    if (res.ok) {
        closeModal('scheduleLectureModal');
        alert('Lecture scheduled successfully!');
        loadLectures();
    }
});

async function loadLectures() {
    const res = await fetchAuth('/api/lectures');
    if (res.ok) {
        const list = await res.json();
        const container = document.getElementById('lecturesList');
        if (!container) return;
        container.innerHTML = '';
        if (list.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted); grid-column:1/-1;">No lectures scheduled.</p>';
            return;
        }
        list.forEach(l => {
            const div = document.createElement('div');
            div.className = 'card premium';
            div.style.padding = '1rem';
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.innerHTML = `
                <div style="flex:1;">
                    <h4 style="color:var(--primary); margin-bottom:0.5rem;">${l.title}</h4>
                    <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">${l.description}</p>
                    <div style="font-size:0.8rem; display:flex; flex-direction:column; gap:0.25rem;">
                        <span><i class="fas fa-calendar" style="width:18px;"></i> ${new Date(l.dateTime).toLocaleString()}</span>
                        <span><i class="fas fa-link" style="width:18px;"></i> <a href="${l.meetingLink}" target="_blank" style="color:var(--primary); text-decoration:none;">Join Zoom Meeting</a></span>
                    </div>
                </div>
                <button onclick="deleteLecture('${l.id}')" class="btn-danger btn-sm" style="align-self:flex-start;"><i class="fas fa-trash"></i></button>
            `;
            container.appendChild(div);
        });
    }
}

async function deleteLecture(id) {
    if (!confirm('Delete this lecture?')) return;
    const res = await fetchAuth(`/api/lectures/${id}`, { method: 'DELETE' });
    if (res.ok) loadLectures();
}

// Override checkAdminAuth to load lectures
const originalCheckAdminAuthFunc = checkAdminAuth;
checkAdminAuth = async function () {
    await originalCheckAdminAuthFunc();
    loadLectures();
    loadProfile();
};

async function loadProfile() {
    const res = await fetchAuth('/api/users/me');
    if (res.ok) {
        const user = await res.json();
        document.getElementById('profileNameDisplay').textContent = user.name;
        document.getElementById('profileEmailDisplay').textContent = user.email;
        document.getElementById('editProfileName').value = user.name;
        document.getElementById('editProfileEmail').value = user.email;
        // Bio isn't in model, but we can simulate or add to metadata if needed. 
        // For now, let's just use Name as a proof of concept as requested.
    }
}

// Announcement with Image form override
document.getElementById('addAnnouncementForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const imageUrl = await uploadFile('announcementImage');

    const ann = {
        title: document.getElementById('announcementTitle').value,
        content: document.getElementById('announcementContent').value,
        imageUrl: imageUrl
    };

    const res = await fetchAuth('/api/admin/announcements', {
        method: 'POST',
        body: JSON.stringify(ann)
    });

    if (res.ok) {
        closeModal('announcementModal');
        loadAnnouncements();
        loadStats();
        e.target.reset();
    }
});
// Profile Update
document.getElementById('updateProfileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const updatedUser = {
        name: document.getElementById('editProfileName').value
    };

    const res = await fetchAuth('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(updatedUser)
    });

    if (res.ok) {
        alert('Profile updated successfully!');
        loadProfile();
        // Also update sidebar/header name if applicable
        document.getElementById('adminName').textContent = updatedUser.name;
    } else {
        alert('Failed to update profile');
    }
});

