
// Check Auth (Instructor)
async function checkInstructorAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetchAuth('/api/users/me');
        if (response.ok) {
            const user = await response.json();
            if (user.role !== 'INSTRUCTOR' && user.role !== 'LECTURER' && user.role !== 'ADMIN') {
                alert('Access Denied. Instructors only.');
                window.location.href = 'dashboard.html';
            } else {
                document.getElementById('instructorName').textContent = user.name;
                // Load Dashboard Data
                await Promise.all([
                    loadAssignedCourses(),
                    loadGlobalAnnouncements(),
                    loadProfile(),
                    loadLectures(),
                    loadNotifications()
                ]);
                updateSummaryStats();
            }
        } else {
            // fetchAuth handles 403, but if it's 401 or other
            if (response.status !== 403) window.location.href = 'login.html';
        }
    } catch (e) {
        console.error(e);
        window.location.href = 'login.html';
    }
}

async function loadGlobalAnnouncements() {
    const res = await fetchAuth('/api/student/announcements');
    if (res.ok) {
        const announcements = await res.json();
        const globalAnns = announcements.filter(a => !a.courseId);
        const container = document.getElementById('globalAnnouncements');
        if (!container) return;

        if (globalAnns.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No global announcements.</p>';
            return;
        }

        container.innerHTML = globalAnns.map(ann => `
            <div class="announcement-item premium-hover" style="display: flex; gap: 1rem; align-items: flex-start; padding: 1rem; background: var(--bg-main); border-radius: var(--radius-lg); border: 1px solid var(--border);">
                ${ann.imageUrl ? `<img src="${ann.imageUrl}" style="width: 50px; height: 50px; object-fit: cover; border-radius: var(--radius-md);">` : '<div style="width: 40px; height: 40px; display:flex; align-items:center; justify-content:center; background: var(--primary-soft); color: var(--primary); border-radius: var(--radius-md); flex-shrink:0;"><i class="fas fa-bullhorn"></i></div>'}
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                        <h4 style="margin: 0; font-size: 0.95rem; font-weight: 700;">${ann.title}</h4>
                        <span style="color: #94a3b8; font-size: 0.75rem;">${new Date(ann.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">${ann.content}</p>
                </div>
            </div>
        `).join('');
    }
}

async function updateSummaryStats() {
    try {
        const coursesRes = await fetchAuth('/api/instructor/courses');
        if (coursesRes.ok) {
            const courses = await coursesRes.json();
            document.getElementById('activeCoursesCount').textContent = courses.length;

            let totalStudents = 0;
            let totalSubmissions = 0;

            for (const course of courses) {
                if (course.studentIds) totalStudents += course.studentIds.length;

                // Get assignments for each course to count submissions
                const asnRes = await fetchAuth(`/api/courses/${course.courseId}/assignments`);
                if (asnRes.ok) {
                    const assignments = await asnRes.json();
                    for (const asn of assignments) {
                        const subRes = await fetchAuth(`/api/assignments/${asn.id}/submissions`);
                        if (subRes.ok) {
                            const subs = await subRes.json();
                            totalSubmissions += subs.length;
                        }
                    }
                }
            }

            document.getElementById('totalStudentsCount').textContent = totalStudents;
            document.getElementById('pendingSubmissionsCount').textContent = totalSubmissions; // Simplified as total for now
        }
    } catch (e) {
        console.error("Error updating stats", e);
    }
}

// Navigation
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sidebar-menu li').forEach(el => el.classList.remove('active'));

    const section = document.getElementById(sectionId);
    if (section) section.classList.add('active');

    // Map section IDs to sidebar text
    const navMap = {
        'myCourses': 'Dashboard',
        'courseDetails': 'Dashboard',
        'profile': 'My Profile'
    };

    const targetText = navMap[sectionId];
    document.querySelectorAll('.sidebar-menu li').forEach(li => {
        if (li.innerText.toLowerCase().includes(targetText.toLowerCase())) {
            li.classList.add('active');
        }
    });
}

// Load Assigned Courses
async function loadAssignedCourses() {
    const res = await fetchAuth('/api/instructor/courses');
    if (res.ok) {
        const courses = await res.json();
        const list = document.getElementById('coursesList');
        list.innerHTML = '';

        if (courses.length === 0) {
            list.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">No courses assigned to you yet.</p>';
            return;
        }

        courses.forEach(course => {
            const div = document.createElement('div');
            div.className = 'premium-card premium-hover';
            div.style.padding = '0';
            div.style.overflow = 'hidden';
            div.innerHTML = `
                <div style="height: 120px; background: linear-gradient(135deg, var(--primary), var(--info)); display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;">
                    <i class="fas fa-book"></i>
                </div>
                <div style="padding: 1.5rem;">
                    <span class="badge" style="background: var(--bg-main); color: var(--primary); margin-bottom: 0.5rem; font-size: 0.7rem;">${course.courseCode || 'LMS'}</span>
                    <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 700;">${course.title}</h3>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${course.description}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="badge ${course.status === 'ACTIVE' ? 'badge-success' : 'badge-secondary'}" style="font-size: 0.65rem;">${course.status || 'ACTIVE'}</span>
                        <button onclick="viewCourseDetails('${course.courseId}')" class="btn-primary btn-sm" style="border-radius: 50px;">Manage <i class="fas fa-arrow-right" style="margin-left: 0.5rem; font-size: 0.7rem;"></i></button>
                    </div>
                </div>
            `;
            list.appendChild(div);
        });
    }
}

// Course Details & Tabs (Similar to Admin)
let currentCourseId = null;

async function viewCourseDetails(courseId) {
    currentCourseId = courseId;
    // We can fetch from getAll list or fetch single if endpoint exists. 
    // Since we have the list, we can find it, but let's re-fetch to be safe and get latest details
    // We can reuse the instructor courses endpoint or fetch single if allowed.
    // Let's reuse the list for now or rely on fetchAuth to get fresh data.

    // Actually, let's just find it from the DOM or re-fetch list.
    const res = await fetchAuth('/api/instructor/courses');
    if (res.ok) {
        const courses = await res.json();
        const course = courses.find(c => c.courseId === courseId);

        if (course) {
            document.getElementById('cdTitle').textContent = course.title;
            document.getElementById('cdCode').textContent = course.courseCode || '-';
            document.getElementById('cdTerm').textContent = "Sem " + (course.semester || '-');
            document.getElementById('cdDescription').textContent = course.description;

            document.getElementById('cdStudentCount').textContent = course.studentIds ? course.studentIds.length : 0;
            document.getElementById('cdCredits').textContent = course.credits || '-';
            document.getElementById('cdStatus').textContent = course.status || 'ACTIVE';

            showSection('courseDetails');
            showCourseTab('tasks');
        }
    }
}

function showCourseTab(tabName) {
    document.querySelectorAll('.course-tab-content').forEach(el => el.style.display = 'none');

    const content = document.querySelector(`#cd-${tabName}`);
    if (content) content.style.display = 'block';

    // Update tab button styles
    document.querySelectorAll('.course-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'transparent';
        btn.style.color = 'var(--text-muted)';

        if (btn.textContent.toLowerCase().includes(tabName.toLowerCase()) ||
            (tabName === 'announcements' && btn.textContent.toLowerCase().includes('news'))) {
            btn.classList.add('active');
            btn.style.background = 'var(--primary)';
            btn.style.color = 'white';
        }
    });

    if (tabName === 'students') {
        loadCourseStudents(currentCourseId);
    } else if (tabName === 'tasks') {
        loadCourseTasks(currentCourseId);
    } else if (tabName === 'assignments') {
        loadCourseAssignments(currentCourseId);
    } else if (tabName === 'lectures') {
        loadCourseLectures(currentCourseId);
    } else if (tabName === 'announcements') {
        loadCourseAnnouncements(currentCourseId);
    } else if (tabName === 'materials') {
        loadCourseMaterials(currentCourseId);
    } else if (tabName === 'grades') {
        loadCourseGradeSheets(currentCourseId);
    }
}

async function loadCourseLectures(courseId) {
    // Assuming we need to fetch the course first to get its degreeId
    const coursesRes = await fetchAuth('/api/instructor/courses');
    let currentCourse = null;
    if (coursesRes.ok) {
        const courses = await coursesRes.json();
        currentCourse = courses.find(c => c.courseId === courseId);
    }

    if (!currentCourse || !currentCourse.degreeId) {
        console.error("Could not find current course or its degree ID.");
        const container = document.getElementById('courseLecturesList');
        if (container) container.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">Error loading lectures: Course or Degree ID not found.</p>';
        return;
    }

    const res = await fetchAuth(`/api/lectures/degree/${currentCourse.degreeId}`); // Filtered by degree as per system
    if (res.ok) {
        const lectures = await res.json();
        // Filter for specific module/course
        const courseLectures = lectures.filter(l => l.moduleId === courseId);
        const container = document.getElementById('courseLecturesList');
        if (!container) return;
        container.innerHTML = '';

        if (courseLectures.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">No lectures scheduled for this course.</p>';
            return;
        }

        container.innerHTML = courseLectures.map(l => `
            <div class="card premium">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <h4 style="margin: 0; color: var(--primary);">${l.title}</h4>
                    <span class="badge ${l.status === 'UPCOMING' ? 'badge-primary' : 'badge-secondary'}">${l.status}</span>
                </div>
                <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem;">${l.description}</p>
                <div style="font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem;">
                    <span><i class="fas fa-calendar-alt"></i> ${new Date(l.dateTime).toLocaleString()}</span>
                    <span><i class="fas fa-link"></i> <a href="${l.meetingLink}" target="_blank" style="color: var(--primary); text-decoration: none; font-weight: 600;">Join Session</a></span>
                </div>
                <div style="display: flex; justify-content: flex-end; padding-top: 1rem; border-top: 1px dashed var(--border);">
                    <button onclick="deleteLecture('${l.id}')" class="btn-secondary btn-sm" style="color: #ef4444; border-color: #fee2e2;">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }
}

async function deleteLecture(lectureId) {
    if (!confirm('Are you sure you want to delete this online session?')) return;

    try {
        const res = await fetchAuth(`/api/lectures/${lectureId}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            alert('Online session deleted successfully!');
            loadCourseLectures(currentCourseId);
            // Also refresh the dashboard view if it's visible
            if (typeof loadLectures === 'function') loadLectures();
        } else {
            alert('Failed to delete session');
        }
    } catch (err) {
        console.error(err);
        alert('Error deleting session');
    }
}

// Edit Course Logic
function showEditCourseModal() {
    // Populate form with current details (we need to store them or fetch them)
    // We can grab from DOM for simplicity or store in variable
    document.getElementById('editCourseId').value = currentCourseId;
    document.getElementById('editCourseTitle').value = document.getElementById('cdTitle').textContent;
    document.getElementById('editCourseCode').value = document.getElementById('cdCode').textContent;
    // ... extracting other fields from DOM is hacky. 
    // Ideally we should have the object.

    // Let's fetch the course again to populate form properly
    populateEditForm(currentCourseId);

    document.getElementById('editCourseModal').style.display = 'block';
}

async function populateEditForm(id) {
    const res = await fetchAuth('/api/instructor/courses');
    if (res.ok) {
        const courses = await res.json();
        const c = courses.find(co => co.courseId === id);
        if (c) {
            document.getElementById('editCourseTitle').value = c.title;
            document.getElementById('editCourseCode').value = c.courseCode || '';
            document.getElementById('editCourseSemester').value = c.semester || '';
            document.getElementById('editCourseCredits').value = c.credits || '';
            document.getElementById('editCourseCategory').value = c.category;
            document.getElementById('editCourseDescription').value = c.description;
            document.getElementById('editCourseStatus').value = c.status || 'ACTIVE';
        }
    }
}

document.getElementById('editCourseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const courseId = document.getElementById('editCourseId').value;

    // Instructor updates usually hitting the same update endpoint if allowed, or specific one.
    // AdminController has PUT /api/admin/courses/{id}.
    // InstructorController needs PUT /api/instructor/courses/{id}.

    const course = {
        title: document.getElementById('editCourseTitle').value,
        courseCode: document.getElementById('editCourseCode').value,
        semester: parseInt(document.getElementById('editCourseSemester').value),
        credits: parseInt(document.getElementById('editCourseCredits').value),
        category: document.getElementById('editCourseCategory').value,
        description: document.getElementById('editCourseDescription').value,
        status: document.getElementById('editCourseStatus').value
    };

    // We need to implement this endpoint in InstructorController or allow access to Admin one?
    // User requested "instructor also can edit... what things admin can do... without delete".
    // I will add the endpoint in InstructorController.
    const res = await fetchAuth(`/api/instructor/courses/${courseId}`, {
        method: 'PUT',
        body: JSON.stringify(course)
    });

    // Wait, AdminController is PreAuthorize('hasRole(ADMIN)'). Instructor won't be able to access.
    // We need to either:
    // 1. Open AdminController endpoint to INSTRUCTORS (and check ownership/permission inside).
    // 2. Add endpoint to InstructorController. (Cleaner)

    // I will use InstructorController endpoint: /api/instructor/courses/{id}

    /* 
       const res = await fetchAuth(`/api/instructor/courses/${courseId}`, {
           method: 'PUT',
           body: JSON.stringify(course)
       });
    */
    // Since I haven't implemented that yet, I'll assume I will add it now.

    if (res.ok) { // This will fail until I update backend.
        closeModal('editCourseModal');
        viewCourseDetails(courseId); // Refresh
    } else {
        alert("Failed to update. Check permissions.");
    }
});


function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

// Student Management
let allUsers = [];

async function showAddStudentModal() {
    document.getElementById('addStudentModal').style.display = 'block';
    document.getElementById('studentSearchResults').innerHTML = '<p>Loading users...</p>';
    const res = await fetchAuth('/api/users');
    if (res.ok) {
        allUsers = await res.json();
        renderStudentSearchResults(allUsers.filter(u => u.role === 'STUDENT'));
    }
}

function searchStudents() {
    const query = document.getElementById('studentSearch').value.toLowerCase();
    const filtered = allUsers.filter(u =>
        u.role === 'STUDENT' &&
        (u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query))
    );
    renderStudentSearchResults(filtered);
}

function renderStudentSearchResults(students) {
    const results = document.getElementById('studentSearchResults');
    results.innerHTML = '';

    if (students.length === 0) {
        results.innerHTML = '<p>No students found.</p>';
        return;
    }

    students.forEach(s => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.style.padding = '1rem';
        div.style.borderBottom = '1px solid var(--border)';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.innerHTML = `
            <div>
                <strong style="color: var(--text-main);">${s.name}</strong><br>
                <small style="color: var(--text-muted);">${s.email}</small>
            </div>
            <button class="btn-primary btn-sm" onclick="enrollStudent('${s.userId}')">Enroll</button>
        `;
        results.appendChild(div);
    });
}

async function enrollStudent(studentId) {
    const res = await fetchAuth(`/api/instructor/courses/${currentCourseId}/students/${studentId}`, {
        method: 'POST'
    });
    if (res.ok) {
        alert('Student enrolled successfully');
        loadCourseStudents(currentCourseId);
    } else {
        alert('Failed to enroll student');
    }
}

async function removeStudent(studentId) {
    if (!confirm('Remove student from course?')) return;
    const res = await fetchAuth(`/api/instructor/courses/${currentCourseId}/students/${studentId}`, {
        method: 'DELETE'
    });
    if (res.ok) {
        loadCourseStudents(currentCourseId);
    }
}

async function loadCourseStudents(courseId) {
    const res = await fetchAuth('/api/instructor/courses'); // Refresh list to get studentIds
    if (res.ok) {
        const courses = await res.json();
        const course = courses.find(c => c.courseId === courseId);
        const container = document.getElementById('enrolledStudentsList');
        container.innerHTML = '';

        if (!course.studentIds || course.studentIds.length === 0) {
            container.innerHTML = '<p>No students enrolled.</p>';
            return;
        }

        // We need student details. Fetch all users for now and filter. 
        // Optimization: backend endpoint for student details by IDs.
        const usersRes = await fetchAuth('/api/users');
        if (usersRes.ok) {
            const all = await usersRes.json();
            const enrolled = all.filter(u => course.studentIds.includes(u.userId));

            enrolled.forEach(s => {
                const div = document.createElement('div');
                div.className = 'card premium';
                div.style.padding = '1rem';
                div.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700;">
                            ${s.name.charAt(0)}
                        </div>
                        <div style="flex: 1;">
                            <h4 style="margin: 0; font-size: 1rem;">${s.name}</h4>
                            <p style="margin: 0; font-size: 0.8rem; color: var(--text-muted);">${s.email}</p>
                        </div>
                        <button class="btn-danger btn-sm" onclick="removeStudent('${s.userId}')"><i class="fas fa-user-minus"></i></button>
                    </div>
                `;
                container.appendChild(div);
            });
            document.getElementById('cdStudentCount').textContent = enrolled.length;
        }
    }
}

// Announcement Management
function showAddAnnouncementModal() {
    document.getElementById('addAnnouncementModal').style.display = 'block';
}

document.getElementById('addAnnouncementForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Upload image if selected
    let imageUrl = null;
    const fileInput = document.getElementById('annImage');
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
        title: document.getElementById('annTitle').value,
        content: document.getElementById('annContent').value,
        imageUrl: imageUrl
    };

    const res = await fetchAuth(`/api/instructor/courses/${currentCourseId}/announcements`, {
        method: 'POST',
        body: JSON.stringify(ann)
    });

    if (res.ok) {
        closeModal('addAnnouncementModal');
        loadCourseAnnouncements(currentCourseId);
        e.target.reset();
    } else {
        alert('Failed to post announcement');
    }
});

async function loadCourseAnnouncements(courseId) {
    const res = await fetchAuth(`/api/instructor/courses/${courseId}/announcements`);
    if (res.ok) {
        const anns = await res.json();
        const list = document.getElementById('announcementsList');
        if (!list) return;
        list.innerHTML = '';

        if (anns.length === 0) {
            list.innerHTML = '<p>No announcements found.</p>';
            return;
        }

        anns.forEach(a => {
            const div = document.createElement('div');
            div.className = 'announcement-item premium';
            div.style.display = 'flex';
            div.style.gap = '1.5rem';
            div.style.alignItems = 'flex-start';
            div.style.padding = '1.5rem';
            div.style.background = 'white';
            div.style.borderRadius = '1rem';
            div.style.border = '1px solid var(--border)';
            div.style.marginBottom = '1rem';

            div.innerHTML = `
                ${a.imageUrl ? `<img src="${a.imageUrl}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 0.5rem;">` : '<div style="width: 60px; height: 60px; display:flex; align-items:center; justify-content:center; background: var(--primary-soft); color: var(--primary); border-radius: 0.5rem;"><i class="fas fa-bullhorn fa-lg"></i></div>'}
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <h4 style="margin: 0; font-size: 1rem;">${a.title}</h4>
                        <small style="color: var(--text-muted); font-size: 0.75rem;">${new Date(a.timestamp).toLocaleDateString()}</small>
                    </div>
                    <p style="margin: 0.5rem 0; font-size: 0.9rem; color: var(--text-muted);">${a.content}</p>
                </div>
            `;
            list.appendChild(div);
        });
    }
}

// Init
async function loadLectures() {
    const res = await fetchAuth('/api/lectures');
    if (res.ok) {
        const lectures = await res.json();
        const container = document.getElementById('upcomingLectures');
        if (!container) return;

        if (lectures.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No sessions scheduled.</p>';
            return;
        }

        container.innerHTML = lectures.map(l => `
            <div class="premium-hover" style="padding: 1.25rem; background: var(--primary-soft); border-left: 4px solid var(--primary); border-radius: var(--radius-md); transition: var(--transition);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <h4 style="color: var(--text-main); margin: 0; font-size: 1.1rem; font-weight: 700;">${l.title}</h4>
                            <span class="badge badge-primary" style="font-size: 0.65rem;">UPCOMING</span>
                        </div>
                        <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.5;">${l.description}</p>
                        <div style="display: flex; gap: 1.5rem; align-items: center;">
                            <span style="font-size: 0.8rem; color: var(--text-muted);"><i class="fas fa-calendar-alt" style="color: var(--primary); margin-right: 0.5rem;"></i> ${new Date(l.dateTime).toLocaleString()}</span>
                            <a href="${l.meetingLink}" target="_blank" class="btn-primary btn-sm" style="text-decoration: none; font-size: 0.75rem; padding: 0.4rem 1rem;">
                                <i class="fas fa-video"></i> Join Session
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Start
checkInstructorAuth();

// --- Tasks & Assignments (Shared Logic with Admin) ---

async function loadCourseTasks(courseId) {
    const list = document.getElementById('tasksList');
    if (!list) return;
    list.innerHTML = '<p>Loading tasks...</p>';

    const res = await fetchAuth(`/api/courses/${courseId}/tasks`);
    if (res.ok) {
        const tasks = await res.json();
        list.innerHTML = '';

        if (tasks.length === 0) {
            list.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">No tasks found.</p>';
            return;
        }

        tasks.forEach(task => {
            const div = document.createElement('div');
            div.className = 'premium-card';
            div.style.display = 'flex';
            div.style.flexDirection = 'column';
            div.style.gap = '1.25rem';
            div.style.borderLeft = '4px solid var(--primary)';
            div.style.padding = '1.5rem';

            const downloadUrl = (task.attachmentUrl && task.attachmentUrl.startsWith('http')) ? task.attachmentUrl : (API_URL + (task.attachmentUrl || ''));

            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <div style="width: 48px; height: 48px; background: var(--primary-soft); color: var(--primary); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
                            <i class="fas fa-tasks"></i>
                        </div>
                        <div>
                            <h4 style="margin: 0; color: var(--text-main); font-weight: 700; font-size: 1.1rem;">${task.title}</h4>
                            <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem; font-weight: 600;">
                                <i class="far fa-calendar-alt"></i> Due: ${task.deadline ? new Date(task.deadline).toLocaleString() : 'N/A'}
                            </div>
                        </div>
                    </div>
                    <span class="badge" style="background: var(--primary-soft); color: var(--primary); font-weight: 700; font-size: 0.75rem; padding: 0.5rem 0.75rem; border-radius: 8px;">${task.totalMarks || 0} Pts</span>
                </div>
                <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6; margin: 0;">${task.description || 'No description'}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 1.25rem; border-top: 1px solid var(--bg-main);">
                    <div style="display: flex; gap: 0.75rem;">
                        <button onclick="viewSubmissions('${task.id}', \`${task.title.replace(/`/g, "\\`").replace(/'/g, "\\'")}\`, 'TASK')" class="btn-primary btn-sm" style="border-radius: 50px; font-weight: 600; padding: 0.5rem 1.25rem;">
                            <i class="fas fa-users-viewfinder"></i> Submissions
                        </button>
                        ${task.attachmentUrl ? `<a href="${downloadUrl}" target="_blank" class="btn-secondary btn-sm" style="text-decoration: none; border-radius: 50px; font-weight: 600;"><i class="fas fa-paperclip"></i> View File</a>` : ''}
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button onclick='showEditTaskModal(${JSON.stringify(task).replace(/'/g, "&apos;")})' class="btn-secondary btn-sm" style="border-radius: 8px; width: 36px; height: 36px; padding: 0;" title="Edit"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteTask('${task.id}')" class="btn-danger btn-sm" style="border-radius: 8px; width: 36px; height: 36px; padding: 0; background: var(--danger-soft); color: var(--danger);" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            list.appendChild(div);
        });
    } else {
        list.innerHTML = '<p style="color: #ef4444; grid-column: 1/-1;">Failed to load tasks.</p>';
    }
}

async function loadCourseAssignments(courseId) {
    const list = document.getElementById('assignmentsList');
    if (!list) return;
    list.innerHTML = '<p>Loading assignments...</p>';

    const res = await fetchAuth(`/api/courses/${courseId}/assignments`);
    if (res.ok) {
        const assignments = await res.json();
        list.innerHTML = '';

        if (assignments.length === 0) {
            list.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">No assignments found.</p>';
            return;
        }

        assignments.forEach(asn => {
            const div = document.createElement('div');
            div.className = 'premium-card';
            div.style.display = 'flex';
            div.style.flexDirection = 'column';
            div.style.gap = '1.25rem';
            div.style.borderLeft = '4px solid var(--success)';
            div.style.padding = '1.5rem';

            const downloadUrl = (asn.attachmentUrl && asn.attachmentUrl.startsWith('http')) ? asn.attachmentUrl : (API_URL + (asn.attachmentUrl || ''));

            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <div style="width: 48px; height: 48px; background: var(--success-soft); color: var(--success); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
                            <i class="fas fa-file-contract"></i>
                        </div>
                        <div>
                            <h4 style="margin: 0; color: var(--text-main); font-weight: 700; font-size: 1.1rem;">${asn.title}</h4>
                            <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem; font-weight: 600;">
                                <i class="far fa-clock"></i> Deadline: ${asn.deadline ? new Date(asn.deadline).toLocaleString() : 'N/A'}
                            </div>
                        </div>
                    </div>
                    <span class="badge" style="background: var(--success-soft); color: var(--success); font-weight: 700; font-size: 0.75rem; padding: 0.5rem 0.75rem; border-radius: 8px;">${asn.totalMarks || 0} Pts</span>
                </div>
                <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6; margin: 0;">${asn.description || 'No description'}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 1.25rem; border-top: 1px solid var(--bg-main);">
                    <div style="display: flex; gap: 0.75rem;">
                        <button onclick="viewSubmissions('${asn.id}', \`${asn.title.replace(/`/g, "\\`").replace(/'/g, "\\'")}\`, 'ASSIGNMENT')" class="btn-primary btn-sm" style="border-radius: 50px; font-weight: 600; padding: 0.5rem 1.25rem;">
                            <i class="fas fa-users-viewfinder"></i> Submissions
                        </button>
                        ${asn.attachmentUrl ? `<a href="${downloadUrl}" target="_blank" class="btn-secondary btn-sm" style="text-decoration: none; border-radius: 50px; font-weight: 600;"><i class="fas fa-file-download"></i> Resource</a>` : ''}
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button onclick='showEditAsnModal(${JSON.stringify(asn).replace(/'/g, "&apos;")})' class="btn-secondary btn-sm" style="border-radius: 8px; width: 36px; height: 36px; padding: 0;" title="Edit"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteAssignment('${asn.id}')" class="btn-danger btn-sm" style="border-radius: 8px; width: 36px; height: 36px; padding: 0; background: var(--danger-soft); color: var(--danger);" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            list.appendChild(div);
        });
    } else {
        list.innerHTML = '<p style="color: #ef4444; grid-column: 1/-1;">Failed to load assignments.</p>';
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
    if (!fileInput || !fileInput.files.length) return null;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    const token = localStorage.getItem('token');
    const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        body: formData
    });

    if (res.ok) {
        return await res.text();
    } else {
        const errorText = await res.text();
        throw new Error('File upload failed: ' + errorText);
    }
}

document.getElementById('addTaskForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentCourseId) return alert('No course selected');

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

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
            alert('Task created successfully!');
            closeModal('addTaskModal');
            loadCourseTasks(currentCourseId);
            e.target.reset();
        } else {
            const err = await res.text();
            alert('Failed to create task: ' + err);
        }
    } catch (error) {
        console.error('Error creating task', error);
        alert('An error occurred: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});

document.getElementById('addAssignmentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentCourseId) return alert('No course selected');

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

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
            alert('Assignment created successfully!');
            closeModal('addAssignmentModal');
            loadCourseAssignments(currentCourseId);
            e.target.reset();
        } else {
            const err = await res.text();
            alert('Failed to create assignment: ' + err);
        }
    } catch (error) {
        console.error('Error creating assignment', error);
        alert('An error occurred: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
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

// Edit Task Modal & Logic
function showEditTaskModal(task) {
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description;

    // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
    if (task.deadline) {
        const date = new Date(task.deadline);
        const formatted = date.toISOString().slice(0, 16);
        document.getElementById('editTaskDeadline').value = formatted;
    }

    document.getElementById('editTaskMarks').value = task.totalMarks;
    document.getElementById('editTaskModal').style.display = 'block';
}

document.getElementById('editTaskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskId = document.getElementById('editTaskId').value;
    const file = await uploadFile('editTaskFile');

    const task = {
        title: document.getElementById('editTaskTitle').value,
        description: document.getElementById('editTaskDescription').value,
        deadline: document.getElementById('editTaskDeadline').value,
        totalMarks: parseInt(document.getElementById('editTaskMarks').value)
    };
    if (file) task.attachmentUrl = file;

    const res = await fetchAuth(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(task)
    });

    if (res.ok) {
        closeModal('editTaskModal');
        loadCourseTasks(currentCourseId);
    }
});

// Edit Assignment Modal & Logic
function showEditAsnModal(asn) {
    document.getElementById('editAsnId').value = asn.id;
    document.getElementById('editAsnTitle').value = asn.title;
    document.getElementById('editAsnDescription').value = asn.description;

    if (asn.deadline) {
        const date = new Date(asn.deadline);
        const formatted = date.toISOString().slice(0, 16);
        document.getElementById('editAsnDeadline').value = formatted;
    }

    document.getElementById('editAsnMarks').value = asn.totalMarks;
    document.getElementById('editAsnAllowedTypes').value = asn.allowedFileTypes || '';
    document.getElementById('editAssignmentModal').style.display = 'block';
}

document.getElementById('editAssignmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const asnId = document.getElementById('editAsnId').value;
    const file = await uploadFile('editAsnFile');

    const asn = {
        title: document.getElementById('editAsnTitle').value,
        description: document.getElementById('editAsnDescription').value,
        deadline: document.getElementById('editAsnDeadline').value,
        totalMarks: parseInt(document.getElementById('editAsnMarks').value),
        allowedFileTypes: document.getElementById('editAsnAllowedTypes').value
    };
    if (file) asn.attachmentUrl = file;

    const res = await fetchAuth(`/api/assignments/${asnId}`, {
        method: 'PUT',
        body: JSON.stringify(asn)
    });

    if (res.ok) {
        closeModal('editAssignmentModal');
        loadCourseAssignments(currentCourseId);
    }
});

async function viewSubmissions(contentId, title, type) {
    const modalTitle = document.getElementById('submissionsModalTitle');
    const body = document.getElementById('submissionsModalBody');
    if (modalTitle) modalTitle.textContent = `${type === 'TASK' ? 'Task' : 'Assignment'} Submissions: ${title}`;
    if (body) body.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';

    openModal('viewSubmissionsModal');

    try {
        const url = type === 'TASK' ? `/api/tasks/${contentId}/submissions` : `/api/assignments/${contentId}/submissions`;
        const res = await fetchAuth(url);
        if (res.ok) {
            const submissions = await res.json();
            if (submissions.length === 0) {
                body.innerHTML = '<tr><td colspan="5">No submissions yet.</td></tr>';
                return;
            }

            body.innerHTML = submissions.map(s => {
                const downloadUrl = s.fileUrl.startsWith('http') ? s.fileUrl : (API_URL + (s.fileUrl || ''));
                return `
                <tr>
                    <td><strong>${s.studentName}</strong></td>
                    <td>${new Date(s.submittedAt).toLocaleString()}</td>
                    <td>
                        <a href="${downloadUrl}" target="_blank" class="btn-primary btn-sm" style="text-decoration:none">
                            <i class="fas fa-file-download"></i> View File
                        </a>
                    </td>
                    <td>
                        <span class="badge ${s.grade ? 'badge-success' : 'badge-secondary'}">
                            ${s.grade ? s.grade + '%' : 'Not Graded'}
                        </span>
                    </td>
                    <td>
                        <button class="btn-secondary btn-sm" onclick="showGradeModal('${s.id}', '${type}', '${s.grade || ''}', \`${(s.feedback || '').replace(/`/g, "\\`")}\`)">
                            <i class="fas fa-check-circle"></i> Grade
                        </button>
                    </td>
                </tr>
            `;
            }).join('');
        }
    } catch (e) {
        console.error(e);
        body.innerHTML = '<tr><td colspan="5">Error loading submissions.</td></tr>';
    }
}

function showGradeModal(submissionId, type, currentGrade, currentFeedback) {
    document.getElementById('gradeSubmissionId').value = submissionId;
    document.getElementById('gradeSubmissionType').value = type;
    document.getElementById('submissionGrade').value = currentGrade;
    document.getElementById('submissionFeedback').value = currentFeedback;
    openModal('gradeSubmissionModal');
}

document.getElementById('gradeSubmissionForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const subId = document.getElementById('gradeSubmissionId').value;
    const type = document.getElementById('gradeSubmissionType').value;

    const gradeData = {
        id: subId,
        grade: document.getElementById('submissionGrade').value,
        feedback: document.getElementById('submissionFeedback').value
    };

    const url = type === 'TASK' ? `/api/tasks/submissions/${subId}/grade` : `/api/assignments/submissions/${subId}/grade`;
    const res = await fetchAuth(url, {
        method: 'POST',
        body: JSON.stringify(gradeData)
    });

    if (res.ok) {
        alert('Graded successfully');
        closeModal('gradeSubmissionModal');
        // We don't have the original contentId here to refresh automatically, 
        // user can just re-click submissions if needed or we could store it.
    } else {
        alert('Failed to save grade');
    }
});

// --- Course Materials ---
function showAddMaterialModal() {
    openModal('addMaterialModal');
}

function toggleMaterialInputs() {
    const type = document.getElementById('materialType').value;
    const urlCont = document.getElementById('materialUrlContainer');
    const fileCont = document.getElementById('materialFileContainer');

    if (type === 'LECTURE_VIDEO' || type === 'RECORDED_LIVE') {
        urlCont.style.display = 'block';
        fileCont.style.display = 'none';
    } else {
        urlCont.style.display = 'none';
        fileCont.style.display = 'block';
    }
}

document.getElementById('addMaterialForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentCourseId) return;

    const type = document.getElementById('materialType').value;
    let fileUrl = document.getElementById('materialUrl').value;

    if (type === 'SLIDE' || type === 'OTHER') {
        try {
            fileUrl = await uploadFile('materialFile');
        } catch (err) {
            return alert(err.message);
        }
    }

    const material = {
        title: document.getElementById('materialTitle').value,
        description: document.getElementById('materialDescription').value,
        type: type,
        fileUrl: fileUrl
    };

    const res = await fetchAuth(`/api/courses/${currentCourseId}/materials`, {
        method: 'POST',
        body: JSON.stringify(material)
    });

    if (res.ok) {
        alert('Material uploaded successfully');
        closeModal('addMaterialModal');
        loadCourseMaterials(currentCourseId);
        e.target.reset();
    }
});

async function loadCourseMaterials(courseId) {
    const res = await fetchAuth(`/api/courses/${courseId}/materials`);
    const list = document.getElementById('courseMaterialsList');
    if (!list) return;
    list.innerHTML = '';

    if (res.ok) {
        const materials = await res.json();
        if (materials.length === 0) {
            list.innerHTML = '<p style="grid-column: 1/-1; color: var(--text-muted);">No materials uploaded yet.</p>';
            return;
        }

        materials.forEach(m => {
            const div = document.createElement('div');
            div.className = 'premium-card';
            div.style.padding = '1.25rem';

            const isVideo = m.type === 'LECTURE_VIDEO' || m.type === 'RECORDED_LIVE';
            const icon = isVideo ? 'fa-video' : (m.type === 'SLIDE' ? 'fa-file-powerpoint' : 'fa-file-alt');
            const color = isVideo ? 'var(--primary)' : (m.type === 'SLIDE' ? '#d97706' : '#64748b');

            div.innerHTML = `
                <div style="display: flex; gap: 1rem; align-items: flex-start;">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background: var(--bg-main); color: ${color}; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div style="flex: 1;">
                        <h4 style="margin: 0; font-size: 1rem;">${m.title}</h4>
                        <p style="margin: 0.25rem 0; font-size: 0.8rem; color: var(--text-muted);">${m.description.substring(0, 60)}${m.description.length > 60 ? '...' : ''}</p>
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 1rem;">
                            <a href="${m.fileUrl}" target="_blank" class="btn-primary btn-sm" style="text-decoration:none; font-size: 0.75rem;">
                                <i class="fas fa-external-link-alt"></i> View
                            </a>
                            <button onclick="deleteMaterial('${m.id}')" class="btn-danger btn-sm" style="background:transparent; color: var(--danger); border:none;"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
            list.appendChild(div);
        });
    }
}

async function deleteMaterial(id) {
    if (!confirm('Delete this material?')) return;
    const res = await fetchAuth(`/api/materials/${id}`, { method: 'DELETE' });
    if (res.ok) loadCourseMaterials(currentCourseId);
}

// --- Grade Sheets ---
function showAddGradeSheetModal() {
    openModal('addGradeSheetModal');
}

document.getElementById('addGradeSheetForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentCourseId) return;

    try {
        const fileUrl = await uploadFile('gradeSheetFile');
        const sheet = {
            title: document.getElementById('gradeSheetTitle').value,
            fileUrl: fileUrl
        };

        const res = await fetchAuth(`/api/courses/${currentCourseId}/grade-sheets`, {
            method: 'POST',
            body: JSON.stringify(sheet)
        });

        if (res.ok) {
            alert('Grade sheet uploaded successfully');
            closeModal('addGradeSheetModal');
            loadCourseGradeSheets(currentCourseId);
            e.target.reset();
        }
    } catch (err) {
        alert(err.message);
    }
});

async function loadCourseGradeSheets(courseId) {
    const res = await fetchAuth(`/api/courses/${courseId}/grade-sheets`);
    const list = document.getElementById('gradeSheetsList');
    if (!list) return;
    list.innerHTML = '';

    if (res.ok) {
        const sheets = await res.json();
        if (sheets.length === 0) {
            list.innerHTML = '<p style="grid-column: 1/-1; color: var(--text-muted);">No result sheets uploaded yet.</p>';
            return;
        }

        sheets.forEach(s => {
            const div = document.createElement('div');
            div.className = 'premium-card';
            div.style.padding = '1.25rem';
            div.innerHTML = `
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                        <i class="fas fa-file-invoice"></i>
                    </div>
                    <div style="flex: 1;">
                        <h4 style="margin: 0; font-size: 1rem;">${s.title}</h4>
                        <small style="color: var(--text-muted);">${new Date(s.createdAt).toLocaleDateString()}</small>
                    </div>
                    <a href="${s.fileUrl}" target="_blank" class="btn-success btn-sm" style="text-decoration:none;">
                        <i class="fas fa-download"></i>
                    </a>
                    <button onclick="deleteGradeSheet('${s.id}')" class="btn-danger btn-sm" style="background:transparent; color: var(--danger); border:none;"><i class="fas fa-trash"></i></button>
                </div>
            `;
            list.appendChild(div);
        });
    }
}

async function deleteGradeSheet(id) {
    if (!confirm('Delete this grade sheet?')) return;
    const res = await fetchAuth(`/api/grade-sheets/${id}`, { method: 'DELETE' });
    if (res.ok) loadCourseGradeSheets(currentCourseId);
}

async function loadProfile() {
    const res = await fetchAuth('/api/users/me');
    if (res.ok) {
        const user = await res.json();

        // Dashboard header
        const nameEl = document.getElementById('instructorName');
        if (nameEl) nameEl.textContent = user.name;

        // Profile displays
        const pd = document.getElementById('profileNameDisplay');
        if (pd) pd.textContent = user.name;

        const pe = document.getElementById('profileEmailDisplay');
        if (pe) pe.textContent = user.email;

        const pr = document.getElementById('profileRoleDisplay');
        if (pr) pr.textContent = user.specialization || (user.role + " / Lecturer");

        // Profile Form
        const en = document.getElementById('editProfileName');
        if (en) en.value = user.name || '';

        const ee = document.getElementById('editProfileEmail');
        if (ee) ee.value = user.email || '';

        const eph = document.getElementById('editProfilePhone');
        if (eph) eph.value = user.phoneNumber || '';

        const esp = document.getElementById('editProfileSpec');
        if (esp) esp.value = user.specialization || '';

        const ebi = document.getElementById('editProfileBio');
        if (ebi) ebi.value = user.bio || '';
    }
}

document.getElementById('updateProfileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const updatedUser = {
            name: document.getElementById('editProfileName').value,
            phoneNumber: document.getElementById('editProfilePhone').value,
            specialization: document.getElementById('editProfileSpec').value,
            bio: document.getElementById('editProfileBio').value
        };

        const res = await fetchAuth('/api/users/profile', {
            method: 'PUT',
            body: JSON.stringify(updatedUser)
        });

        if (res.ok) {
            alert('Professional profile updated successfully!');
            await loadProfile();
        } else {
            alert('Failed to update profile');
        }
    } catch (err) {
        console.error(err);
        alert('Error updating profile');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// UI Interactivity
function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('mobile-active');
}

// Close sidebar on mobile when clicking outside
document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.sidebar');
    if (window.innerWidth <= 768 &&
        sidebar.classList.contains('mobile-active') &&
        !sidebar.contains(e.target) &&
        !e.target.closest('.hamburger-btn')) {
        sidebar.classList.remove('mobile-active');
    }
});

// Online Session Creation for Instructors
function showScheduleLectureModal() {
    const courseTitle = document.getElementById('cdTitle').textContent;
    const display = document.getElementById('lectureCourseDisplay');
    if (display) display.textContent = courseTitle;

    document.getElementById('scheduleLectureForm').reset();
    document.getElementById('scheduleLectureModal').style.display = 'block';
}

document.getElementById('scheduleLectureForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scheduling...';

        // We need the degreeId for the online lecture object. 
        // We can get it from the current active course data.
        const resCourses = await fetchAuth('/api/instructor/courses');
        if (!resCourses.ok) throw new Error("Failed to fetch courses");

        const courses = await resCourses.json();
        const currentCourse = courses.find(c => c.courseId === currentCourseId);

        if (!currentCourse || !currentCourse.degreeId) {
            alert("Error: Course or Degree ID not found. Please try again.");
            return;
        }

        const lecture = {
            title: document.getElementById('lectureTitle').value,
            description: document.getElementById('lectureDescription').value,
            dateTime: new Date(document.getElementById('lectureDateTime').value).toISOString(),
            meetingLink: document.getElementById('lectureLink').value,
            degreeId: currentCourse.degreeId,
            moduleId: currentCourseId,
            status: 'UPCOMING'
        };

        const res = await fetchAuth('/api/lectures', {
            method: 'POST',
            body: JSON.stringify(lecture)
        });

        if (res.ok) {
            alert('Online session scheduled successfully!');
            closeModal('scheduleLectureModal');
            loadCourseLectures(currentCourseId);
        } else {
            const err = await res.text();
            alert('Failed to schedule session: ' + err);
        }
    } catch (err) {
        console.error(err);
        alert('Error scheduling session');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});
