package com.lms.system.controller;

import com.lms.system.model.Announcement;
import com.lms.system.model.Course;
import com.lms.system.model.Submission;
import com.lms.system.model.TaskSubmission;
import com.lms.system.security.UserDetailsImpl;
import com.lms.system.service.AnnouncementService;
import com.lms.system.service.CourseService;
import com.lms.system.service.AssignmentService;
import com.lms.system.service.SubmissionService;
import com.lms.system.service.TaskService;
import com.lms.system.service.TaskSubmissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasRole('STUDENT') or hasRole('INSTRUCTOR') or hasRole('LECTURER') or hasRole('ADMIN')")
public class StudentController {

    @Autowired
    private CourseService courseService;

    @Autowired
    private AnnouncementService announcementService;

    @Autowired
    private AssignmentService assignmentService;

    @Autowired
    private TaskService taskService;

    @Autowired
    private SubmissionService submissionService;

    @Autowired
    private TaskSubmissionService taskSubmissionService;

    private String getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) auth.getPrincipal()).getId();
        }
        return null;
    }

    @GetMapping("/courses")
    public ResponseEntity<?> getEnrolledCourses() {
        String studentId = getAuthenticatedUserId();
        if (studentId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        List<Course> courses = courseService.getEnrolledCourses(studentId);
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/announcements")
    public ResponseEntity<?> getRelevantAnnouncements() {
        String studentId = getAuthenticatedUserId();
        if (studentId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        List<Course> courses = courseService.getEnrolledCourses(studentId);
        List<String> courseIds = courses.stream().map(Course::getCourseId).collect(Collectors.toList());
        
        List<Announcement> announcements = announcementService.getAnnouncementsForStudent(courseIds);
        return ResponseEntity.ok(announcements);
    }

    @GetMapping("/assignments")
    public ResponseEntity<?> getUpcomingAssignments() {
        String studentId = getAuthenticatedUserId();
        if (studentId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        List<Course> courses = courseService.getEnrolledCourses(studentId);
        // Concatenate all assignments for all enrolled courses
        List<?> allAssignments = courses.stream()
                .flatMap(c -> assignmentService.getAssignmentsByCourseId(c.getCourseId()).stream())
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(allAssignments);
    }

    @GetMapping("/tasks")
    public ResponseEntity<?> getEnrolledTasks() {
        String studentId = getAuthenticatedUserId();
        if (studentId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        List<Course> courses = courseService.getEnrolledCourses(studentId);
        List<?> allTasks = courses.stream()
                .flatMap(c -> taskService.getTasksByCourseId(c.getCourseId()).stream())
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(allTasks);
    }

    @GetMapping("/submissions")
    public ResponseEntity<?> getMySubmissions() {
        String studentId = getAuthenticatedUserId();
        if (studentId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(submissionService.getSubmissionsByStudentId(studentId));
    }

    @PostMapping("/assignments/{id}/submit")
    public ResponseEntity<?> submitAssignment(@PathVariable String id, @RequestBody Submission submission) {
        String studentId = getAuthenticatedUserId();
        if (studentId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        // Check assignment exists and deadline
        com.lms.system.model.Assignment assignment = assignmentService.getAssignmentById(id);
        if (assignment == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Assignment not found");

        if (assignment.getDeadline() != null && !assignment.getDeadline().isEmpty()) {
            try {
                LocalDateTime deadline = LocalDateTime.parse(assignment.getDeadline(), DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                LocalDateTime now = LocalDateTime.now();
                if (now.isAfter(deadline)) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Submission failed: The deadline has passed.");
                }
            } catch (Exception e) {
                // If parsing fails, we might want to log it or ignore it depending on the format
                // For now, let's assume it's valid or if invalid, we don't block submission
            }
        }

        submission.setAssignmentId(id);
        submission.setStudentId(studentId);
        
        return ResponseEntity.ok(submissionService.submitAssignment(submission));
    }

    @GetMapping("/assignments/{id}/my-submission")
    public ResponseEntity<?> getMySubmission(@PathVariable String id) {
        String studentId = getAuthenticatedUserId();
        if (studentId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(submissionService.getSubmissionByStudentAndAssignment(studentId, id));
    }

    @GetMapping("/tasks/submissions")
    public ResponseEntity<?> getMyTaskSubmissions() {
        String studentId = getAuthenticatedUserId();
        if (studentId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(taskSubmissionService.getSubmissionsByStudentId(studentId));
    }
}
