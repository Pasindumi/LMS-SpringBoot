package com.lms.system.controller;

import com.lms.system.model.Course;
import com.lms.system.security.UserDetailsImpl;
import com.lms.system.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/instructor")
@PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
public class InstructorController {

    @Autowired
    private CourseService courseService;

    @GetMapping("/courses")
    public ResponseEntity<?> getAssignedCourses() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        String userId = userDetails.getId();
        
        return ResponseEntity.ok(courseService.getAllCourses().stream()
                .filter(c -> c.getLecturerId() != null && c.getLecturerId().equals(userId))
                .collect(Collectors.toList()));
    }

    @PutMapping("/courses/{courseId}")
    public ResponseEntity<?> updateCourse(@PathVariable String courseId, @RequestBody Course updatedCourse) {
        // Verify ownership
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal(); // Assuming ID matches lecturerId
        String userId = userDetails.getId();
        
        Course course = courseService.getCourseById(courseId);
        if (course != null && course.getLecturerId() != null && course.getLecturerId().equals(userId)) {
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
        return ResponseEntity.status(403).body("You are not authorized to edit this course.");
    }
}
