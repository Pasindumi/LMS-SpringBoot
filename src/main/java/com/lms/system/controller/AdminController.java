package com.lms.system.controller;

import com.lms.system.model.Announcement;
import com.lms.system.model.Course;
import com.lms.system.model.User;
import com.lms.system.service.AnnouncementService;
import com.lms.system.service.CourseService;
import com.lms.system.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private CourseService courseService;

    @Autowired
    private AnnouncementService announcementService;

    // --- Overview / Stats ---
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalUsers", userService.getAllUsers().size());
            stats.put("totalCourses", courseService.getAllCourses().size());
            stats.put("totalAnnouncements", announcementService.getAllAnnouncements().size());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // --- User Management ---
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            return ResponseEntity.ok(userService.getAllUsers());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PutMapping("/users/{userId}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable String userId, @RequestBody Map<String, String> payload) {
        try {
            String newRole = payload.get("role");
            User user = userService.getUserById(userId);
            if (user != null) {
                user.setRole(newRole);
                userService.updateUser(user);
                return ResponseEntity.ok(user);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable String userId) {
        try {
            userService.deleteUser(userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // --- Course Management ---
    @GetMapping("/courses")
    public ResponseEntity<?> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    @PostMapping("/courses")
    public ResponseEntity<?> createCourse(@RequestBody Course course) {
        return ResponseEntity.ok(courseService.createCourse(course));
    }

    @PutMapping("/courses/{courseId}")
    public ResponseEntity<?> updateCourse(@PathVariable String courseId, @RequestBody Course updatedCourse) {
        Course course = courseService.getCourseById(courseId);
        if (course != null) {
            course.setTitle(updatedCourse.getTitle());
            course.setCourseCode(updatedCourse.getCourseCode());
            course.setSemester(updatedCourse.getSemester());
            course.setCredits(updatedCourse.getCredits());
            course.setCategory(updatedCourse.getCategory());
            course.setDescription(updatedCourse.getDescription());
            course.setStatus(updatedCourse.getStatus());
            courseService.updateCourse(course); // Save changes
            return ResponseEntity.ok(course);
        }
        return ResponseEntity.notFound().build();
    }

    
    @DeleteMapping("/courses/{courseId}")
    public ResponseEntity<?> deleteCourse(@PathVariable String courseId) {
        courseService.deleteCourse(courseId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/courses/{courseId}/lecturer")
    public ResponseEntity<?> assignLecturer(@PathVariable String courseId, @RequestBody Map<String, String> payload) {
        String lecturerId = payload.get("lecturerId");
        String lecturerType = payload.get("lecturerType");
        
        Course course = courseService.getCourseById(courseId);
        if (course != null) {
            course.setLecturerId(lecturerId);
            course.setLecturerType(lecturerType);
            courseService.updateCourse(course); // Save changes
            return ResponseEntity.ok(course);
        }
        return ResponseEntity.notFound().build();
    }


    // --- Announcement Management ---
    @GetMapping("/announcements")
    public ResponseEntity<?> getAllAnnouncements() {
        return ResponseEntity.ok(announcementService.getAllAnnouncements());
    }

    @PostMapping("/announcements")
    public ResponseEntity<?> createAnnouncement(@RequestBody Announcement announcement) {
        // Assume authorId is set or derived from context if needed
        return ResponseEntity.ok(announcementService.createAnnouncement(announcement));
    }
    
    @DeleteMapping("/announcements/{id}")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable String id) {
        announcementService.deleteAnnouncement(id);
        return ResponseEntity.ok().build();
    }

    // --- Lecture Management (Stub) ---
    @GetMapping("/lectures")
    public ResponseEntity<?> getLectures() {
        return ResponseEntity.ok(List.of("Lecture 1", "Lecture 2")); // Placeholder
    }
    // --- Degree Management ---

    @Autowired
    private com.lms.system.service.DegreeService degreeService;

    @GetMapping("/degrees")
    public ResponseEntity<?> getAllDegrees() {
        return ResponseEntity.ok(degreeService.getAllDegrees());
    }

    @PostMapping("/degrees")
    public ResponseEntity<?> createDegree(@RequestBody com.lms.system.model.Degree degree) {
        return ResponseEntity.ok(degreeService.createDegree(degree));
    }

    @GetMapping("/degrees/{id}")
    public ResponseEntity<?> getDegreeById(@PathVariable String id) {
        com.lms.system.model.Degree degree = degreeService.getDegreeById(id);
        if (degree != null) return ResponseEntity.ok(degree);
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/degrees/{id}")
    public ResponseEntity<?> updateDegree(@PathVariable String id, @RequestBody com.lms.system.model.Degree degree) {
        com.lms.system.model.Degree updated = degreeService.updateDegree(id, degree);
        if (updated != null) return ResponseEntity.ok(updated);
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/degrees/{id}")
    public ResponseEntity<?> deleteDegree(@PathVariable String id) {
        degreeService.deleteDegree(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/degrees/{degreeId}/courses")
    public ResponseEntity<?> addCourseToDegree(@PathVariable String degreeId, @RequestBody Map<String, String> payload) {
        String courseId = payload.get("courseId");
        degreeService.addCourseToDegree(degreeId, courseId);
        // Also update the course entity to reflect the degree link
        Course course = courseService.getCourseById(courseId);
        if(course != null) {
            course.setDegreeId(degreeId);
            courseService.updateCourse(course);
        }
        return ResponseEntity.ok().build();
    }
}
