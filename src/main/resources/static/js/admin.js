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
                document.getElementById('adminName').textContent = user.name;
                document.getElementById('adminEmail').textContent = user.email;
                document.getElementById('adminRole').textContent = user.role;
                loadStats();
                loadUsers();
                loadCourses();
                loadAnnouncements();
                loadDegrees(); // Add this
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

    document.getElementById(sectionId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Stats
async function loadStats() {
    const res = await fetchAuth('/api/admin/stats');
    if (res.ok) {
        const stats = await res.json();
        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('totalCourses').textContent = stats.totalCourses;
        document.getElementById('totalAnnouncements').textContent = stats.totalAnnouncements;
    }
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
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>
                    <button onclick="deleteUser('${user.userId}')" class="btn-danger">Delete</button>
                    ${user.role !== 'ADMIN' ? `<button onclick="promoteUser('${user.userId}')" class="btn-secondary">Make Admin</button>` : ''}
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
            div.className = 'announcement-item';
            div.innerHTML = `
                <h4>${ann.title} <small>${new Date(ann.timestamp).toLocaleString()}</small></h4>
                <p>${ann.content}</p>
                <button onclick="deleteAnnouncement('${ann.id}')" class="btn-danger btn-sm">Delete</button>
            `;
            container.appendChild(div);
        });
    }
}

async function deleteAnnouncement(id) {
    if (!confirm('Delete announcement?')) return;
    const res = await fetchAuth(`/api/admin/announcements/${id}`, { method: 'DELETE' });
    if (res.ok) {
        loadAnnouncements();
        loadStats();
    }
}

document.getElementById('addAnnouncementForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const ann = {
        title: document.getElementById('announcementTitle').value,
        content: document.getElementById('announcementContent').value
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
                <td>${deg.name}</td>
                <td>${deg.faculty}</td>
                <td>${deg.duration} Years</td>
                <td><span class="badge ${deg.status === 'ACTIVE' ? 'badge-success' : 'badge-secondary'}">${deg.status}</span></td>
                <td>
                    <button onclick="viewDegreeDetails('${deg.id}')" class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem;">Details</button>
                    <button onclick="deleteDegree('${deg.id}')" class="btn-danger" style="padding: 5px 10px; font-size: 0.8rem;">Delete</button>
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
                <td>${c.courseCode || '-'}</td>
                <td>${c.title}</td>
                <td>${c.lecturerId || 'Unassigned'}</td>
                <td>${c.studentIds ? c.studentIds.length : 0}</td>
                <td><span class="badge ${c.status === 'ACTIVE' ? 'badge-success' : 'badge-secondary'}">${c.status || 'ACTIVE'}</span></td>
                <td>
                    <button onclick="viewCourseDetails('${c.courseId}')" class="btn-primary" style="padding: 2px 8px; font-size: 0.8rem;">Manage</button>
                    <button onclick="showEditCourseModal('${c.courseId}')" class="btn-secondary" style="padding: 2px 8px; font-size: 0.8rem;">Edit</button>
                    <button onclick="deleteCourse('${c.courseId}')" class="btn-danger" style="padding: 2px 8px; font-size: 0.8rem;">Delete</button>
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
    const res = await fetchAuth('/api/admin/courses'); // Inefficient, should get single
    if (res.ok) {
        const courses = await res.json();
        const course = courses.find(c => c.courseId === courseId);
        if (course) {
            document.getElementById('cdTitle').textContent = course.title;
            document.getElementById('cdCode').textContent = course.courseCode || '-';
            // Fetch degree name if needed, or just show ID for now
            document.getElementById('cdDegree').textContent = course.degreeId || '-';
            document.getElementById('cdSemester').textContent = course.semester || '-';
            document.getElementById('cdCredits').textContent = course.credits || '-';
            const lecturerName = course.lecturerId ? (course.lecturerId + (course.lecturerType ? ` (${course.lecturerType})` : '')) : 'Unassigned';
            document.getElementById('cdLecturer').textContent = lecturerName;
            document.getElementById('cdStudentCount').textContent = course.studentIds ? course.studentIds.length : 0;
            document.getElementById('cdStatus').textContent = course.status || 'ACTIVE';
            document.getElementById('cdDescription').textContent = course.description;

            showSection('courseDetails');
        }
    }
}

function showCourseTab(tabName) {
    document.querySelectorAll('.course-tab-content').forEach(el => el.style.display = 'none');
    document.querySelector(`#cd-${tabName}`).style.display = 'block';

    // Update active button state if desired
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


// Start
checkAdminAuth().then(() => {
    // Attempt to load degrees if on dashboard
    if (document.getElementById('degreesTable')) loadDegrees();
});
