document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    await loadProfile();
    await loadDashboardData();
});

let studentUser = null;
let currentCourses = [];
let studentSubmissions = []; // Assignments
let studentTaskSubmissions = [];
let studentProgress = [];

async function loadProfile() {
    try {
        const response = await fetchAuth('/api/users/me');
        if (response.ok) {
            studentUser = await response.json();
            document.getElementById('userName').textContent = studentUser.name;
            document.getElementById('userEmail').textContent = studentUser.email;
            document.getElementById('welcomeTitle').textContent = `Welcome, ${studentUser.name.split(' ')[0]}`;
            // Use first letter for avatar
            document.getElementById('userAvatar').textContent = studentUser.name.charAt(0).toUpperCase();

            // Safety check for role - redirect if not student/admin
            if (studentUser.role === 'INSTRUCTOR') {
                window.location.href = 'instructor-dashboard.html';
            } else if (studentUser.role === 'ADMIN' && !window.location.pathname.includes('student')) {
                // Admins can be here, but usually go to admin dash
                // window.location.href = 'admin-dashboard.html';
            }
        }
    } catch (error) {
        console.error('Error loading profile', error);
    }
}

async function loadDashboardData() {
    try {
        // Load Enrolled Courses
        const courseRes = await fetchAuth('/api/student/courses');
        if (courseRes.ok) {
            currentCourses = await courseRes.json();
            document.getElementById('courseCount').textContent = currentCourses.length;
            renderCoursesGrid(currentCourses.slice(0, 3), 'enrolledCoursesGrid');
        }

        // Load Global Announcements (Replacing specific course ones if preferred or adding both)
        const annRes = await fetchAuth('/api/student/announcements');
        if (annRes.ok) {
            const announcements = await annRes.json();
            renderAnnouncements(announcements.slice(0, 5), 'latestAnnouncements');
        }

        // Load Online Lectures
        const lectureRes = await fetchAuth('/api/lectures');
        if (lectureRes.ok) {
            const lectures = await lectureRes.json();
            renderLectures(lectures.slice(0, 3), 'upcomingLectures'); // Assuming this ID exists or I will add it
        }

        // Load Submissions
        const subRes = await fetchAuth('/api/student/submissions');
        if (subRes.ok) {
            studentSubmissions = await subRes.json();
        }

        // Load Assignments for count
        const asgnRes = await fetchAuth('/api/student/assignments');
        if (asgnRes.ok) {
            const assignments = await asgnRes.json();
            const pendingCount = assignments.filter(a => !studentSubmissions.some(s => s.assignmentId === a.id)).length;
            document.getElementById('pendingAssignmentsCount').textContent = pendingCount;
        }

        // Load Task Submissions
        const taskSubRes = await fetchAuth('/api/student/tasks/submissions');
        if (taskSubRes.ok) {
            studentTaskSubmissions = await taskSubRes.json();
            document.getElementById('completedTasksCount').textContent = studentTaskSubmissions.length;
        }

        // Load Progress
        if (studentUser) {
            const progRes = await fetchAuth(`/api/students/${studentUser.id}/progress`);
            if (progRes.ok) {
                studentProgress = await progRes.json();
            }
        }

    } catch (error) {
        console.error('Error loading dashboard data', error);
    }
}

function renderCoursesGrid(courses, elementId) {
    const grid = document.getElementById(elementId);
    if (!grid) return;
    if (courses.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; color: var(--text-muted);">No enrolled courses found.</p>';
        return;
    }

    grid.innerHTML = courses.map(course => `
        <div class="premium-card premium-hover" onclick="viewCourseDetails('${course.courseId}')" style="padding: 0; overflow: hidden; cursor: pointer;">
            <div style="height: 120px; background: linear-gradient(135deg, var(--primary), var(--info)); display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;">
                <i class="fas fa-book-reader"></i>
            </div>
            <div style="padding: 1.5rem;">
                <span class="badge" style="background: var(--bg-main); color: var(--primary); margin-bottom: 0.5rem; font-size: 0.7rem;">${course.courseCode || 'LMS'}</span>
                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 700; border: none; padding: 0;">${course.title}</h3>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                    <span class="badge badge-secondary" style="font-size: 0.65rem; background: var(--bg-main); color: var(--text-muted);">Semester ${course.semester}</span>
                    <button class="btn-primary btn-sm" style="border-radius: 50px;">Learn More <i class="fas fa-arrow-right" style="margin-left: 0.5rem; font-size: 0.7rem;"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderAnnouncements(announcements, elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;
    if (!announcements || announcements.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); padding: 1rem; text-align: center;">No news available.</p>';
        return;
    }

    container.innerHTML = announcements.map(ann => `
        <div class="premium-card premium-hover" style="margin-bottom: 1rem; padding: 1.25rem;">
            <div style="display: flex; gap: 1.25rem; align-items: flex-start;">
                <div style="width: 48px; height: 48px; min-width: 48px; background: var(--warning-soft); color: var(--warning); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
                    <i class="fas fa-bullhorn"></i>
                </div>
                <div style="flex: 1;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.5rem;">
                        <h4 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--text-main); border: none; padding: 0;">${ann.title}</h4>
                        <span class="badge" style="background: var(--bg-main); color: var(--text-muted); font-size: 0.65rem;">
                            ${ann.courseId ? 'Course' : 'General'}
                        </span>
                    </div>
                    <p style="margin: 0 0 0.75rem 0; font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">${ann.content}</p>
                    <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 600;">
                        <i class="far fa-clock"></i> ${new Date(ann.timestamp).toLocaleDateString()}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderLectures(lectures, elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;
    if (!lectures || lectures.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; padding: 1rem; text-align: center;">No sessions scheduled.</p>';
        return;
    }

    container.innerHTML = lectures.map(l => `
        <div class="premium-card premium-hover" style="margin-bottom: 1rem; padding: 1.25rem; border-left: 4px solid var(--primary);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <div style="width: 48px; height: 48px; background: var(--primary-soft); color: var(--primary); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
                        <i class="fas fa-video"></i>
                    </div>
                    <div>
                        <h4 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--text-main); border: none; padding: 0;">${l.title}</h4>
                        <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 600; margin-top: 0.25rem;">
                            <i class="far fa-calendar-alt"></i> ${new Date(l.dateTime).toLocaleString()}
                        </div>
                    </div>
                </div>
                <span class="badge" style="background: var(--primary-soft); color: var(--primary); font-size: 0.7rem;">Upcoming</span>
            </div>
            <div style="display: flex; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid var(--bg-main);">
                <a href="${l.meetingLink}" target="_blank" class="btn-primary btn-sm" style="text-decoration: none; border-radius: 50px; font-weight: 600;">
                    <i class="fas fa-external-link-alt"></i> Join Meeting
                </a>
            </div>
        </div>
    `).join('');
}

// Navigation Functions
// --- Navigation ---
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sidebar-menu li').forEach(el => el.classList.remove('active'));

    const section = document.getElementById(sectionId);
    if (section) section.classList.add('active');

    // Handle sidebar highlighting
    const navMap = {
        'dashboardHome': 'Dashboard',
        'myCoursesView': 'My Courses',
        'courseDetailView': 'My Courses',
        'announcementsView': 'Announcements',
        'assignmentsView': 'Assignments',
        'profileView': 'Profile'
    };

    const targetText = navMap[sectionId];
    if (targetText) {
        document.querySelectorAll('.sidebar-menu li').forEach(li => {
            if (li.innerText.trim() === targetText) {
                li.classList.add('active');
            }
        });
    }
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('mobile-active');
}

function showDashboard(e) {
    if (e) e.preventDefault();
    showSection('dashboardHome');
    loadDashboardData(); // Keep this to refresh dashboard data
}

async function showMyCourses(e) {
    if (e) e.preventDefault();
    showSection('myCoursesView');
    const res = await fetchAuth('/api/student/courses'); // Re-fetch to ensure currentCourses is up-to-date
    if (res.ok) {
        currentCourses = await res.json();
        renderCoursesGrid(currentCourses, 'allEnrolledCoursesGrid');
    }
}

async function loadFullAnnouncements() {
    const res = await fetchAuth('/api/student/announcements');
    if (res.ok) {
        const announcements = await res.json();
        renderAnnouncements(announcements, 'fullAnnouncementsList');
    }
}

async function showAssignments(e) {
    if (e) e.preventDefault();
    switchView('assignmentsView');
    const res = await fetchAuth('/api/student/assignments');
    if (res.ok) {
        const assignments = await res.json();
        renderItemsList(assignments, 'fullAssignmentsList', 'clipboard-list');
    }
}

function renderItemsList(items, elementId, icon) {
    const container = document.getElementById(elementId);
    if (!container) return;
    if (!items || items.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); padding: 2rem; text-align: center;">No items found.</p>';
        return;
    }

    container.innerHTML = items.map(item => {
        const isAssignment = icon === 'clipboard-list';
        const isTask = icon === 'tasks';
        const hasAttachment = item.attachmentUrl && item.attachmentUrl.trim() !== '';

        const submission = isAssignment
            ? studentSubmissions.find(s => s.assignmentId === item.id)
            : studentTaskSubmissions.find(s => s.taskId === item.id);

        const isSubmitted = !!submission;
        const grade = submission ? submission.grade : null;

        const downloadUrl = (item.attachmentUrl && item.attachmentUrl.startsWith('http')) ? item.attachmentUrl : (API_URL + (item.attachmentUrl || ''));
        const borderColor = isAssignment ? 'var(--success)' : (isTask ? '#6366f1' : 'var(--primary)');
        const softBg = isAssignment ? 'var(--success-soft)' : (isTask ? '#eef2ff' : 'var(--primary-soft)');
        const accentColor = isAssignment ? 'var(--success)' : (isTask ? '#6366f1' : 'var(--primary)');

        return `
        <div class="premium-card premium-hover" style="margin-bottom: 1.5rem; border-left: 4px solid ${borderColor}; padding: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem;">
                <div style="display: flex; gap: 1.5rem; align-items: center; flex: 1;">
                    <div style="width: 54px; height: 54px; background: ${softBg}; color: ${accentColor}; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                        <i class="fas fa-${icon}"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                            <h4 style="margin: 0; font-size: 1.15rem; color: var(--text-main); font-weight: 800; border: none; padding: 0;">${item.title}</h4>
                            ${isSubmitted ? `<span class="badge" style="background: var(--success-soft); color: var(--success); font-weight: 700; font-size: 0.7rem;">SUBMITTED</span>` : ''}
                        </div>
                        <p style="margin: 0 0 1rem 0; font-size: 0.95rem; color: var(--text-muted); line-height: 1.6;">${item.description || 'No instructions provided.'}</p>
                        <div style="font-size: 0.8rem; color: #94a3b8; display: flex; gap: 1.5rem; font-weight: 600;">
                             <span><i class="far fa-calendar-alt"></i> DUE: ${item.deadline ? new Date(item.deadline).toLocaleString() : 'N/A'}</span>
                             ${item.totalMarks ? `<span><i class="fas fa-award"></i> POINTS: ${item.totalMarks}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.75rem; min-width: 160px;">
                    ${(isAssignment || isTask) ? `
                        <button onclick="${isAssignment ? 'openSubmissionModal' : 'openTaskSubmissionModal'}('${item.id}', \`${item.title.replace(/`/g, "\\`").replace(/'/g, "\\'")}\`, '${item.deadline}')" class="${isSubmitted ? 'btn-secondary' : 'btn-primary'}" style="width: 100%; border-radius: 50px; font-weight: 700;">
                            <i class="fas fa-${isSubmitted ? 'edit' : 'upload'}"></i> ${isSubmitted ? 'Update' : 'Submit Now'}
                        </button>
                    ` : ''}
                    ${grade ? `
                        <div class="badge badge-success" style="padding: 0.6rem; text-align: center; border-radius: 50px;">
                            <i class="fas fa-check-circle"></i> Grade: ${grade}%
                        </div>
                    ` : (isSubmitted ? `
                        <div class="badge badge-secondary" style="padding: 0.6rem; text-align: center; border-radius: 50px;">
                            <i class="fas fa-clock"></i> Pending Grade
                        </div>
                    ` : '')}
                    ${hasAttachment ? `
                        <a href="${downloadUrl}" target="_blank" class="btn-secondary" style="text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; border-radius: 50px; font-weight: 600;">
                            <i class="fas fa-file-download"></i> Resource
                        </a>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    }).join('');
}

// Detail View
async function viewCourseDetails(courseId) {
    showSection('courseDetailView');
    const course = currentCourses.find(c => c.courseId === courseId) || await (await fetchAuth(`/api/courses/${courseId}`)).json();

    if (course) {
        document.getElementById('detailCourseTitle').textContent = course.title || 'Course Details';
        document.getElementById('detailCourseCode').textContent = `${course.courseCode || ''} - Semester ${course.semester || ''}`;
        document.getElementById('detailDescription').textContent = course.description || 'No description available.';

        // Save current course ID globally if needed
        window.currentViewingCourseId = courseId;

        // Default to overview
        showDetailTab('overview', courseId);
        updateCourseProgressOverview(courseId);
    }
}

async function updateCourseProgressOverview(courseId) {
    try {
        // Fetch tasks, assignments, and lectures for this course
        const [tasksRes, asgnRes, lectRes] = await Promise.all([
            fetchAuth(`/api/courses/${courseId}/tasks`),
            fetchAuth(`/api/courses/${courseId}/assignments`),
            fetchAuth(`/api/lectures/degree/${studentUser.degreeId}`)
        ]);

        if (tasksRes.ok && asgnRes.ok && lectRes.ok) {
            const tasks = await tasksRes.json();
            const assignments = await asgnRes.json();
            let lectures = await lectRes.json();
            lectures = lectures.filter(l => l.moduleId === courseId);

            // Calculate progress
            const submittedTasks = studentTaskSubmissions.filter(s => tasks.some(t => t.id === s.taskId)).length;
            const submittedAsgns = studentSubmissions.filter(s => assignments.some(a => a.id === s.assignmentId)).length;
            const completedLectures = studentProgress.filter(p => lectures.some(l => l.id === p.contentId) && p.completed).length;

            // Update UI
            document.getElementById('overviewTaskProgress').textContent = tasks.length > 0
                ? `${Math.round((submittedTasks / tasks.length) * 100)}%`
                : '0%';
            document.getElementById('overviewAsgnProgress').textContent = `${submittedAsgns}/${assignments.length}`;
            document.getElementById('overviewLectureProgress').textContent = lectures.length > 0
                ? `${Math.round((completedLectures / lectures.length) * 100)}%`
                : '0%';
        }
    } catch (err) {
        console.error("Error updating progress overview:", err);
    }
}

async function showDetailTab(tabName, courseId) {
    if (!courseId) courseId = window.currentViewingCourseId;

    // UI Update
    const tabs = document.querySelectorAll('.tab-item');
    tabs.forEach(t => {
        t.classList.remove('active');
        if (t.innerText.toLowerCase() === tabName.toLowerCase()) {
            t.classList.add('active');
        }
    });

    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) targetTab.style.display = 'block';

    // Load dynamic data for the specific tab
    if (courseId && tabName !== 'overview') {
        loadCourseSpecificData(tabName, courseId);
    }
}

async function loadCourseSpecificData(tab, courseId) {
    const listIdMap = {
        'announcements': 'courseAnnouncementsList',
        'assignments': 'courseAssignmentsList',
        'tasks': 'courseTasksList',
        'lectures': 'courseLecturesList',
        'materials': 'courseMaterialsList',
        'grades': 'courseGradeSheetsList'
    };
    const iconMap = {
        'announcements': 'bullhorn',
        'assignments': 'clipboard-list',
        'tasks': 'tasks',
        'lectures': 'video',
        'materials': 'file-alt',
        'grades': 'file-invoice'
    };

    const containerId = listIdMap[tab];
    if (!containerId) return;

    const container = document.getElementById(containerId);
    container.innerHTML = '<p>Loading...</p>';

    try {
        const endpoint = (tab === 'lectures') ? `/api/lectures/degree/${studentUser.degreeId}` : `/api/courses/${courseId}/${tab}`;
        const res = await fetchAuth(endpoint);
        if (res.ok) {
            let data = await res.json();
            if (tab === 'lectures') {
                data = data.filter(l => l.moduleId === courseId);
                renderLectures(data, containerId);
            } else if (tab === 'announcements') {
                renderAnnouncements(data, containerId);
            } else if (tab === 'materials') {
                renderMaterials(data, containerId);
            } else if (tab === 'grades') {
                renderGradeSheets(data, containerId);
            } else {
                renderItemsList(data, containerId, iconMap[tab]);
            }
        }
    } catch (err) {
        console.error(`Error loading course ${tab}`, err);
    }
}

function renderLectures(lectures, elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;

    if (lectures.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem; grid-column: 1/-1;">No lectures scheduled.</p>';
        return;
    }

    container.innerHTML = lectures.map(l => {
        const isDone = studentProgress.some(p => p.contentId === l.id && p.completed);
        return `
        <div class="list-item" style="display: flex; flex-direction: column; align-items: flex-start; gap: 0.75rem; border-left: 4px solid ${isDone ? 'var(--success)' : 'var(--primary)'};">
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: flex-start;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="progress-checkbox" onclick="toggleProgress('${l.id}', ${isDone})" style="cursor: pointer; width: 24px; height: 24px; border-radius: 6px; border: 2px solid ${isDone ? 'var(--success)' : 'var(--border)'}; background: ${isDone ? 'var(--success)' : 'transparent'}; display: flex; align-items: center; justify-content: center; color: white;">
                        ${isDone ? '<i class="fas fa-check"></i>' : ''}
                    </div>
                    <h4 style="margin: 0; color: var(--text-main); font-weight: 700;">${l.title}</h4>
                </div>
                <span class="badge ${isDone ? 'badge-success' : 'badge-upcoming'}">${isDone ? 'COMPLETED' : l.status}</span>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0; padding-left: 2.5rem;">${l.description}</p>
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: center; margin-top: 0.5rem; padding-left: 2.5rem;">
                <div style="font-size: 0.8rem; color: var(--text-muted);">
                    <i class="fas fa-calendar-alt"></i> ${new Date(l.dateTime).toLocaleString()}
                </div>
                <a href="${l.meetingLink}" target="_blank" class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem; text-decoration: none; border-radius: 50px;">
                    <i class="fas fa-video"></i> ${isDone ? 'Re-watch' : 'Join Session'}
                </a>
            </div>
        </div>
    `;
    }).join('');
}

async function toggleProgress(contentId, currentState) {
    const progress = {
        studentId: studentUser.id,
        contentId: contentId,
        completed: !currentState
    };

    const res = await fetchAuth('/api/progress', {
        method: 'POST',
        body: JSON.stringify(progress)
    });

    if (res.ok) {
        // Refresh local progress data
        const progRes = await fetchAuth(`/api/students/${studentUser.id}/progress`);
        if (progRes.ok) {
            studentProgress = await progRes.json();
            if (window.currentViewingCourseId) {
                loadCourseSpecificData('lectures', window.currentViewingCourseId);
            }
        }
    }
}

function renderMaterials(materials, elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;

    if (materials.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); padding: 2rem; text-align: center;">No materials available for this course.</p>';
        return;
    }

    container.innerHTML = materials.map(m => {
        const isVideo = m.type === 'LECTURE_VIDEO' || m.type === 'RECORDED_LIVE';
        const icon = isVideo ? 'video' : (m.type === 'SLIDE' ? 'file-powerpoint' : 'file-alt');
        const color = isVideo ? 'var(--primary)' : (m.type === 'SLIDE' ? '#d97706' : '#64748b');

        return `
            <div class="premium-card premium-hover" style="display: flex; gap: 1.5rem; align-items: center; padding: 1.25rem;">
                <div style="width: 50px; height: 50px; border-radius: 12px; background: var(--bg-main); color: ${color}; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                    <i class="fas fa-${icon}"></i>
                </div>
                <div style="flex: 1;">
                    <h4 style="margin: 0; font-size: 1.1rem; color: var(--text-main);">${m.title}</h4>
                    <p style="margin: 0.25rem 0 0; font-size: 0.9rem; color: var(--text-muted);">${m.description}</p>
                </div>
                <a href="${m.fileUrl}" target="_blank" class="btn-secondary" style="text-decoration: none; padding: 0.6rem 1.2rem; border-radius: 50px; font-weight: 600;">
                    <i class="fas fa-external-link-alt"></i> View
                </a>
            </div>
        `;
    }).join('');
}

function renderGradeSheets(sheets, elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;

    if (sheets.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); padding: 2rem; text-align: center;">No result sheets posted yet.</p>';
        return;
    }

    container.innerHTML = sheets.map(s => `
        <div class="premium-card premium-hover" style="display: flex; gap: 1.5rem; align-items: center; padding: 1.25rem; border-left: 4px solid var(--success);">
            <div style="width: 50px; height: 50px; border-radius: 12px; background: #ecfdf5; color: var(--success); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                <i class="fas fa-file-invoice"></i>
            </div>
            <div style="flex: 1;">
                <h4 style="margin: 0; font-size: 1.1rem; color: var(--text-main);">${s.title}</h4>
                <p style="margin: 0.25rem 0 0; font-size: 0.85rem; color: var(--text-muted);">Posted on ${new Date(s.createdAt).toLocaleDateString()}</p>
            </div>
            <a href="${s.fileUrl}" target="_blank" class="btn-success" style="text-decoration: none; padding: 0.6rem 1.2rem; border-radius: 50px; font-weight: 700;">
                <i class="fas fa-download"></i> Get Results
            </a>
        </div>
    `).join('');
}

function renderAnnouncements(announcements, elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;

    if (announcements.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">No announcements.</p>';
        return;
    }

    container.innerHTML = announcements.map(ann => `
        <div class="announcement-card" style="margin-bottom: 1rem; padding: 1rem; background: var(--primary-soft); border-radius: 0.75rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <h4 style="margin: 0;">${ann.title}</h4>
                <small style="color: var(--text-muted);">${new Date(ann.timestamp).toLocaleDateString()}</small>
            </div>
            <p style="font-size: 0.9rem; margin: 0;">${ann.content}</p>
        </div>
    `).join('');
}

// Submission Logic
async function openSubmissionModal(id, title, deadline) {
    const modal = document.getElementById('submissionModal');
    document.getElementById('submitAsgnId').value = id;
    document.getElementById('submitAsgnTitle').textContent = `Submission: ${title}`;
    document.getElementById('submissionAssignmentTitle').textContent = title;
    document.getElementById('submitAsgnDeadline').textContent = `Deadline: ${deadline ? new Date(deadline).toLocaleString() : 'N/A'}`;

    // Check if passed deadline
    const isPast = deadline && new Date() > new Date(deadline);
    const submitBtn = document.getElementById('submitBtn');
    const fileInput = document.getElementById('submissionFile');
    const prevSubDiv = document.getElementById('previousSubmission');

    if (isPast) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-lock"></i> Deadline Passed';
        submitBtn.style.background = '#94a3b8';
        fileInput.disabled = true;
    } else {
        submitBtn.disabled = false;
        submitBtn.style.background = 'var(--primary)';
        fileInput.disabled = false;
    }

    // Check for previous submission
    try {
        const res = await fetchAuth(`/api/student/assignments/${id}/my-submission`);
        if (res.ok) {
            const sub = await res.json();
            if (sub) {
                prevSubDiv.style.display = 'block';
                const prevLink = document.getElementById('prevFileUrl');
                const downloadUrl = sub.fileUrl.startsWith('http') ? sub.fileUrl : (API_URL + sub.fileUrl);
                prevLink.href = downloadUrl;

                if (!isPast) {
                    submitBtn.innerHTML = '<i class="fas fa-edit"></i> Update Submission';
                }
            } else {
                prevSubDiv.style.display = 'none';
                if (!isPast) {
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Now';
                }
            }
        }
    } catch (err) {
        console.error("Error checking submission:", err);
    }

    document.getElementById('submissionForm').reset();
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    if (fileNameDisplay) fileNameDisplay.textContent = 'Drag and drop or click to browse';
    modal.style.display = 'block';
}

// File name display for submission
document.getElementById('submissionFile')?.addEventListener('change', (e) => {
    const fileName = e.target.files[0]?.name || 'Drag and drop or click to browse';
    const display = document.getElementById('fileNameDisplay');
    if (display) {
        display.textContent = fileName;
        display.style.color = 'var(--primary)';
    }
});

document.getElementById('submissionForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const asgnId = document.getElementById('submitAsgnId').value;
    const fileInput = document.getElementById('submissionFile');

    if (fileInput.files.length === 0) {
        alert('Please select a file to upload.');
        return;
    }

    try {
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

        // 1. Upload file
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        const uploadRes = await fetch(API_URL + '/api/uploads', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
            body: formData
        });

        if (!uploadRes.ok) throw new Error('File upload failed');
        const fileUrl = await uploadRes.text();

        // 2. Submit Assignment
        const submission = {
            assignmentId: asgnId,
            studentId: studentUser.id,
            studentName: studentUser.name,
            fileUrl: fileUrl
        };

        const response = await fetchAuth(`/api/student/assignments/${asgnId}/submit`, {
            method: 'POST',
            body: JSON.stringify(submission)
        });

        if (response.ok) {
            alert('Assignment submitted successfully!');
            closeModal('submissionModal');
            await loadDashboardData(); // This refreshes studentSubmissions
            if (window.currentViewingCourseId) {
                loadCourseSpecificData('assignments', window.currentViewingCourseId);
            }
        } else {
            const err = await response.text();
            alert('Submission failed: ' + err);
        }
    } catch (error) {
        console.error('Error submitting assignment', error);
        alert('An error occurred during submission.');
    } finally {
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Now';
    }
});

async function showProfile(e) {
    if (e) e.preventDefault();
    showSection('profileView');
    const res = await fetchAuth('/api/users/me');
    if (res.ok) {
        const user = await res.json();
        document.getElementById('profileNameDisplay').textContent = user.name;
        document.getElementById('profileEmailDisplay').textContent = user.email;
        document.getElementById('editProfileName').value = user.name;
        document.getElementById('editProfileEmail').value = user.email;
        document.getElementById('profileAvatarBig').textContent = user.name.charAt(0).toUpperCase();
    }
}

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
        const user = await res.json();
        const un = document.getElementById('userName');
        if (un) un.textContent = user.name;
        const pd = document.getElementById('profileNameDisplay');
        if (pd) pd.textContent = user.name;
        const ua = document.getElementById('userAvatar');
        if (ua) ua.textContent = user.name.charAt(0).toUpperCase();
        const pab = document.getElementById('profileAvatarBig');
        if (pab) pab.textContent = user.name.charAt(0).toUpperCase();
    } else {
        alert('Failed to update profile');
    }
});

// Task Submission Logic
async function openTaskSubmissionModal(id, title, deadline) {
    const modal = document.getElementById('submitTaskModal');
    document.getElementById('submitTaskId').value = id;
    document.getElementById('submitTaskTitle').textContent = `Submit Task: ${title}`;

    // Check if passed deadline
    const isPast = deadline && new Date() > new Date(deadline);
    const form = document.getElementById('submitTaskForm');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (isPast) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Deadline Passed';
        submitBtn.style.background = '#94a3b8';
    } else {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Work';
        submitBtn.style.background = 'var(--primary)';
    }

    document.getElementById('submitTaskForm').reset();
    const fileNameDisplay = document.getElementById('taskFileName');
    if (fileNameDisplay) {
        fileNameDisplay.textContent = '';
        fileNameDisplay.style.display = 'none';
    }
    openModal('submitTaskModal');
}

document.getElementById('submitTaskFile')?.addEventListener('change', (e) => {
    const fileName = e.target.files[0]?.name;
    const display = document.getElementById('taskFileName');
    if (display && fileName) {
        display.textContent = `Selected: ${fileName}`;
        display.style.display = 'block';
    }
});

document.getElementById('taskFileDropArea')?.addEventListener('click', () => {
    document.getElementById('submitTaskFile').click();
});

document.getElementById('submitTaskForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskId = document.getElementById('submitTaskId').value;
    const fileInput = document.getElementById('submitTaskFile');

    if (fileInput.files.length === 0) {
        alert('Please select a file to upload.');
        return;
    }

    try {
        const fileUrl = await uploadFile('submitTaskFile');
        const submission = {
            taskId: taskId,
            studentId: studentUser.id,
            studentName: studentUser.name,
            fileUrl: fileUrl
        };

        const response = await fetchAuth(`/api/tasks/${taskId}/submit`, {
            method: 'POST',
            body: JSON.stringify(submission)
        });

        if (response.ok) {
            alert('Task submitted successfully!');
            closeModal('submitTaskModal');
            await loadDashboardData(); // Refresh submissions
            if (window.currentViewingCourseId) {
                loadCourseSpecificData('tasks', window.currentViewingCourseId);
            }
        }
    } catch (error) {
        console.error('Error submitting task', error);
        alert(error.message);
    }
});
