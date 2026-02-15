
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
            if (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN') {
                alert('Access Denied. Instructors only.');
                window.location.href = 'dashboard.html';
            } else {
                document.getElementById('instructorName').textContent = user.name;
                // Load Courses
                loadAssignedCourses();
            }
        } else {
            window.location.href = 'login.html';
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
    // Highlight sidebar item logic
    if (sectionId === 'myCourses') {
        document.querySelector('.sidebar-menu li:first-child').classList.add('active');
    }
}

// Load Assigned Courses
async function loadAssignedCourses() {
    const res = await fetchAuth('/api/instructor/courses');
    if (res.ok) {
        const courses = await res.json();
        const list = document.getElementById('coursesList');
        list.innerHTML = '';

        if (courses.length === 0) {
            list.innerHTML = '<p>No courses assigned to you yet.</p>';
            return;
        }

        courses.forEach(course => {
            const div = document.createElement('div');
            div.className = 'card';
            div.innerHTML = `
                <h3>${course.title}</h3>
                <p>${course.courseCode || ''}</p>
                <p>${course.description}</p>
                <span class="badge ${course.status === 'ACTIVE' ? 'badge-success' : 'badge-secondary'}">${course.status || 'ACTIVE'}</span>
                <div style="margin-top: 10px;">
                    <button onclick="viewCourseDetails('${course.courseId}')" class="btn-primary">Manage Course</button>
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
        }
    }
}

function showCourseTab(tabName) {
    document.querySelectorAll('.course-tab-content').forEach(el => el.style.display = 'none');
    document.querySelector(`#cd-${tabName}`).style.display = 'block';

    document.querySelectorAll('.course-tabs button').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');
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

// Init
checkInstructorAuth();
