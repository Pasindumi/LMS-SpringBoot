package com.lms.system.controller;

import com.lms.system.model.Announcement;
import com.lms.system.model.Course;
import com.lms.system.security.UserDetailsImpl;
import com.lms.system.service.AnnouncementService;
import com.lms.system.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/instructor")
@PreAuthorize("hasRole('INSTRUCTOR') or hasRole('LECTURER') or hasRole('ADMIN')")
public class InstructorController {

    @Autowired
    private CourseService courseService;

    @Autowired
    private AnnouncementService announcementService;

    private String getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) auth.getPrincipal()).getId();
        }
        return null;
    }

    private boolean isCourseLecturer(String courseId, String userId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return true;
        }
        Course course = courseService.getCourseById(courseId);
        return course != null && userId != null && userId.equals(course.getLecturerId());
    }

    @GetMapping("/courses")
    public ResponseEntity<?> getAssignedCourses() {
        String userId = getAuthenticatedUserId();
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        return ResponseEntity.ok(courseService.getAllCourses().stream()
                .filter(c -> c.getLecturerId() != null && c.getLecturerId().equals(userId))
                .collect(Collectors.toList()));
    }

    @PutMapping("/courses/{courseId}")
    public ResponseEntity<?> updateCourse(@PathVariable String courseId, @RequestBody Course updatedCourse) {
        String userId = getAuthenticatedUserId();
        if (!isCourseLecturer(courseId, userId)) {
            return ResponseEntity.status(403).body("You are not authorized to edit this course.");
        }
        
        Course course = courseService.getCourseById(courseId);
        // Allow update
        course.setTitle(updatedCourse.getTitle());
        course.setCourseCode(updatedCourse.getCourseCode());
        course.setSemester(updatedCourse.getSemester());
        course.setCredits(updatedCourse.getCredits());
        course.setCategory(updatedCourse.getCategory());
        course.setDescription(updatedCourse.getDescription());
        course.setStatus(updatedCourse.getStatus());
        courseService.updateCourse(course);
        return ResponseEntity.ok(course);
    }

    // --- Student Management ---

    @PostMapping("/courses/{courseId}/students/{studentId}")
    public ResponseEntity<?> addStudentToCourse(@PathVariable String courseId, @PathVariable String studentId) {
        String userId = getAuthenticatedUserId();
        if (!isCourseLecturer(courseId, userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not authorized");
        }

        Course course = courseService.getCourseById(courseId);
        if (course.getStudentIds() == null) {
            course.setStudentIds(new java.util.ArrayList<>());
        }
        if (!course.getStudentIds().contains(studentId)) {
            course.getStudentIds().add(studentId);
            courseService.updateCourse(course);
        }
        return ResponseEntity.ok(course);
    }

    @DeleteMapping("/courses/{courseId}/students/{studentId}")
    public ResponseEntity<?> removeStudentFromCourse(@PathVariable String courseId, @PathVariable String studentId) {
        String userId = getAuthenticatedUserId();
        if (!isCourseLecturer(courseId, userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not authorized");
        }

        Course course = courseService.getCourseById(courseId);
        if (course.getStudentIds() != null && course.getStudentIds().remove(studentId)) {
            courseService.updateCourse(course);
        }
        return ResponseEntity.ok(course);
    }

    // --- Announcement Management ---

    @GetMapping("/courses/{courseId}/announcements")
    public ResponseEntity<?> getCourseAnnouncements(@PathVariable String courseId) {
        String userId = getAuthenticatedUserId();
        if (!isCourseLecturer(courseId, userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not authorized");
        }
        return ResponseEntity.ok(announcementService.getAnnouncementsByCourseId(courseId));
    }

    @PostMapping("/courses/{courseId}/announcements")
    public ResponseEntity<?> createCourseAnnouncement(@PathVariable String courseId, @RequestBody Announcement announcement) {
        String userId = getAuthenticatedUserId();
        if (!isCourseLecturer(courseId, userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not authorized");
        }

        announcement.setCourseId(courseId);
        announcement.setAuthorId(userId);
        announcement.setTimestamp(new Date());
        return ResponseEntity.ok(announcementService.createAnnouncement(announcement));
    }
}
